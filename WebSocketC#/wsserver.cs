//// See https://aka.ms/new-console-template for more information
using System.Collections;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Text;
using System.Text.RegularExpressions;

public enum PayloadDataType
{
    Unknown = -1,
    Continuation = 0,
    Text = 1,
    Binary = 2,
    ConnectionClose = 8,
    Ping = 9,
    Pong = 10
}

class Client
{
    public TcpClient client;
    public NetworkStream stream;
    public byte[] bytes;

    public Client(TcpClient client)
    {
        this.client = client;
        this.stream = client.GetStream();
        this.bytes = new byte[1024];
    }
}
class Server
{
    string ip = "127.0.0.1";
    int port = 80;
    TcpListener server;

    public Server()
    {
        server = new TcpListener(IPAddress.Parse(ip), port);

        server.Start();
        Console.WriteLine("Server has started on {0}:{1}, Waiting for a connection...", ip, port);

        server.BeginAcceptTcpClient(OnClientConnect, null);
        
    }

    private void OnClientConnect(IAsyncResult ar)
    {
        Client cl = new Client(server.EndAcceptTcpClient(ar));
        Console.WriteLine("A client connected");
        cl.stream.BeginRead(cl.bytes, 0, cl.bytes.Length, OnReadData, cl);

        server.BeginAcceptTcpClient(OnClientConnect, null);
        
    }

    private void OnReadData(IAsyncResult ar)
    {
        Client cl = (Client)ar.AsyncState;
        int size = cl.stream.EndRead(ar);        
        if (size > 0)
        {            
            string s = Encoding.UTF8.GetString(cl.bytes);

            if (Regex.IsMatch(s, "^GET", RegexOptions.IgnoreCase))
            {
                Console.WriteLine("====Handshaking from client=====\n{0}", s);

                // 1. Obtain the value of the "Sec-Websocket-Key" request header without any leading or trailing whitespace
                // 2. Concatenate it with "258EAFA5-E914-47DA-95CA-C5AB0DC85B11" (a special GUID specified by RFC 6455)
                // 3. Compute SHA-1 and Base64 hase of the new value
                // 4. Write the hash back as the value of "Sec-Websocket-Accept" response header in an HTTP response
                string swk = Regex.Match(s, "Sec-WebSocket-Key: (.*)").Groups[1].Value.Trim();
                string swka = swk + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
                byte[] swkaSha1 = System.Security.Cryptography.SHA1.Create().ComputeHash(Encoding.UTF8.GetBytes(swka));
                string swkaSha1Base64 = Convert.ToBase64String(swkaSha1);

                // HTTP/1.1 defines the sequence CR LF as the end-of-line marker

                byte[] response = Encoding.UTF8.GetBytes(
                    "HTTP/1.1 101 Switching Protocols\r\n" +
                    "Connection: Upgrade\r\n" +
                    "Upgrade: websocket\r\n" +
                    "Sec-Websocket-Accept: " + swkaSha1Base64 + "\r\n\r\n");

                cl.stream.Write(response, 0, response.Length);
            }
            else
            {
                bool fin = (cl.bytes[0] & 0b10000000) != 0,
                    mask = (cl.bytes[1] & 0b10000000) != 0; // must be true, "All messages from the client to the server have this bit set"
                PayloadDataType opcode = (PayloadDataType)(cl.bytes[0] & 0b00001111); // expecting 1 - text message
                int offset = 2;
                ulong msglen = cl.bytes[1] & (ulong)0b01111111;

                if (msglen == 126)
                {
                    // bytes are reversed because websocket wipp print them in Big-Endian, whereas
                    // BitConverter will want them arranged in little-endian on windows
                    msglen = BitConverter.ToUInt16(new byte[] { cl.bytes[3], cl.bytes[2] }, 0);
                    offset = 4;
                }
                else if (msglen == 127)
                {
                    // To test the below code, we need to manually buffer larger messages - since the NIC's autobuffering
                    // may be too latency-friendly for this code to run(that is, we may have only some of the bytes in this
                    // websocket frame available through client.Available).
                    msglen = BitConverter.ToUInt64(new byte[] {
                    cl.bytes[9], cl.bytes[8], cl.bytes[7], cl.bytes[6], cl.bytes[5], cl.bytes[4], cl.bytes[3],
                    cl.bytes[2] }, 0);
                    offset = 10;
                }

                if (mask)
                {
                    byte[] decoded = new byte[msglen];
                    byte[] masks = new byte[4] { cl.bytes[offset],
                    cl.bytes[offset + 1], cl.bytes[offset + 2], cl.bytes[offset + 3] };
                    offset += 4;

                    for (ulong i = 0; i < msglen; ++i) decoded[i] = (byte)(cl.bytes[(ulong)offset + i] ^ masks[i % 4]);

                    string text = Encoding.UTF8.GetString(decoded);
                    Console.WriteLine(text);

                    switch (opcode)
                    {
                        case PayloadDataType.Text:
                            SendData(Encoding.UTF8.GetBytes("Success!"), PayloadDataType.Text, cl);
                            break;
                        case PayloadDataType.Binary:
                            //Binary는 아무 동작 없음
                            break;
                        case PayloadDataType.ConnectionClose:
                            //받은 요청이 서버에서 보낸 요청에 대한 응답이 아닌 경우에만 실행
                            //if (State != WebSocketState.CloseSent)
                            {
                                SendCloseRequest(1000, "Graceful Close", cl);
                                //State = WebSocketState.Closed;
                            }
                            Dispose(cl);      // 소켓 닫음
                            Console.WriteLine("Socket Closed");
                            return;
                            //break;
                        default:
                            Console.WriteLine("Unknown Data Type");
                            break;
                    }
                }
                else
                    Console.WriteLine("mask bit not set");

                Console.WriteLine();
            }
            cl.stream.BeginRead(cl.bytes, 0, cl.bytes.Length, OnReadData, cl);
        }
    }

    public void SendData(byte[] data, PayloadDataType opcode, Client cl)
    {
        byte[] sendData;
        BitArray firstByte = new BitArray(new bool[] {
                    // opcode
                    opcode == PayloadDataType.Text || opcode == PayloadDataType.Ping,
                    opcode == PayloadDataType.Binary || opcode == PayloadDataType.Pong,
                    false,
                    opcode == PayloadDataType.ConnectionClose || opcode == PayloadDataType.Ping || opcode == PayloadDataType.Pong,
                    false,  //RSV3
                    false,  //RSV2
                    false,  //RSV1
                    true,   //Fin
                });
        //위 코드는 아래 설명 참조

        if (data.Length < 126)
        {
            sendData = new byte[data.Length + 2];
            firstByte.CopyTo(sendData, 0);
            sendData[1] = (byte)data.Length;    //서버에서는 Mask 비트가 0이어야 함
            data.CopyTo(sendData, 2);
        }
        else
        {
            // 수신과 마찬가지로 32,767이상의 길이(int16 범위 이상)의 데이터에 대응하지 못함
            sendData = new byte[data.Length + 4];
            firstByte.CopyTo(sendData, 0);
            sendData[1] = 126;
            byte[] lengthData = BitConverter.GetBytes((ushort)data.Length);
            Array.Copy(lengthData, 0, sendData, 2, 2);
            data.CopyTo(sendData, 4);
        }

        cl.stream.Write(sendData, 0, sendData.Length);  //클라이언트에 전송
    }

    public void SendCloseRequest(ushort code, string reason, Client cl)
    {
        byte[] closeReq = new byte[2 + reason.Length];
        BitConverter.GetBytes(code).CopyTo(closeReq, 0);
        //왜인지는 알 수 없지만 크롬에서 코드는 자리가 바뀌어야 제대로 인식할 수 있다.
        byte temp = closeReq[0];
        closeReq[0] = closeReq[1];
        closeReq[1] = temp;
        Encoding.UTF8.GetBytes(reason).CopyTo(closeReq, 2);
        SendData(closeReq, PayloadDataType.ConnectionClose, cl);
    }

    public void Dispose(Client cl)
    {
        cl.client.Close();
        cl.client.Dispose(); //모든 소켓에 관련된 자원 해제
    }
    public static void Main()
    {
        new Server();
        Console.ReadLine();
    }
}

