// See https://aka.ms/new-console-template for more information
//Console.WriteLine("Hello, World!");
using System.Net.Sockets;
using System.Net;
using System.Text.RegularExpressions;
using System.Text;
using System.Reflection.Emit;
using static System.Runtime.InteropServices.JavaScript.JSType;
using System.Collections;
using System.Reflection.Metadata;
using System.Security.Cryptography.X509Certificates;

class Server
{
    const int httpPort = 80;
    const int tcpPort = 8080;
    public static void Main()
    {
        string ip = GetLocalIP();

        new HttpServer(new TcpServer(ip, tcpPort), ip, httpPort);
        //new HttpServer(null, ip);
        Console.ReadLine();
    }

    public static string GetLocalIP()
    {
        string result = string.Empty;

        var host = Dns.GetHostEntry(Dns.GetHostName());

        foreach (var ip in host.AddressList)
        {
            if (ip.AddressFamily == AddressFamily.InterNetwork)
            {
                result = ip.ToString();
                //break;
                Console.WriteLine(ip.ToString());
            }
        }

        return result;
    }

}

class HttpServer
{
    TcpServer? tcpServer;
    HttpListener listener;

    public volatile bool bListen = true;

    public HttpServer(TcpServer server, string ip, int httpPort)
    {
        this.tcpServer = server;
        listener = new HttpListener();
        string siteUrl = string.Format("http://{0}:{1}/", ip, httpPort);
        listener.Prefixes.Add(siteUrl);
        Console.WriteLine(siteUrl);
        //listener.Prefixes.Add(string.Format("https://{0}:{1}/", ip, httpPort));
        listener.Start();

        new Thread(() =>
        {
            while (bListen)
            {
                // Note: The GetContext method blocks while waiting for a request. 
                HttpListenerContext context = listener.GetContext();
                HttpListenerRequest request = context.Request;
                Console.WriteLine(request.Url);

                // Obtain a response object.
                HttpListenerResponse response = context.Response;
                string strResponse = "";
                string? rawUrl = request.RawUrl;
                if (rawUrl == "/stopServer")
                {
                    bListen = false;
                    strResponse = "HttpServer Stopped";
                }
                else
                {
                    if (rawUrl == "/") rawUrl += "CopterShowdown.html";
                    strResponse = File.ReadAllText("./html" + rawUrl);
                    strResponse = strResponse.Replace("[[[ip]]]", "ws://" + ip + ":" + tcpServer.tcpPort);
                }

                byte[] buffer = System.Text.Encoding.UTF8.GetBytes(strResponse);
                // Get a response stream and write the response to it.
                response.ContentLength64 = buffer.Length;
                System.IO.Stream output = response.OutputStream;
                output.Write(buffer, 0, buffer.Length);
                // You must close the output stream.
                output.Close();
            }
            Thread.Sleep(200);
            listener.Stop();
            tcpServer.StopBroadcast();
        }).Start();
    }
}

class TcpServer
{
    TcpListener tcpListener;
    public int tcpPort;
    public List<Connection> connections = new List<Connection>();
    volatile bool bBroadcast = false;

    public TcpServer(string ip, int tcpPort)
    {
        Connection.tcpServer = this;

        this.tcpPort = tcpPort;

        tcpListener = new TcpListener(IPAddress.Parse(ip), tcpPort);
        tcpListener.Start();

        Console.WriteLine("Server has started on {0}:{1}, Waiting for a connection...", ip, tcpPort);

        tcpListener.BeginAcceptTcpClient(OnClientConnect, null);
    }


    private void OnClientConnect(IAsyncResult ar)
    {
        Console.WriteLine("A client connected");

        Connection con = new Connection(tcpListener.EndAcceptTcpClient(ar));
        connections.Add(con);

        tcpListener.BeginAcceptTcpClient(OnClientConnect, null);

    }

    internal void StartBroadcast()
    {
        if (bBroadcast) return;
        bBroadcast = true;

        new Thread(() =>
        {
            while (bBroadcast)
            {
                string msg = "STATUS_ALL";
                foreach (Connection conn in connections)
                {
                    msg += ";ID=" + conn.gamer.ID;
                    msg += ";X=" + conn.gamer.x;
                    msg += ";Y=" + conn.gamer.y;
                    msg += ";DIR=" + conn.gamer.dir;
                }
                foreach (Connection conn in connections)
                {
                    conn.SendData(msg);
                }
                Thread.Sleep(100);
            }
        }).Start();

        //foreach (Connection conn in connections)
        //{
        //    conn.SendCloseRequest(1000, "Graceful Close");
        //}
    }

    internal void StopBroadcast()
    {
        bBroadcast = false;
    }
}

class Connection
{
    public static TcpServer? tcpServer = null;

    public TcpClient client;
    public NetworkStream stream;
    public byte[] bytes;

    public GamerStatus gamer;

    public Connection(TcpClient client)
    {
        this.client = client;
        stream = client.GetStream();
        bytes = new byte[1024];

        gamer = new GamerStatus();

        stream.BeginRead(bytes, 0, bytes.Length, OnReadData, null);
    }

    private void OnReadData(IAsyncResult ar)
    {
        int size = stream.EndRead(ar);
        if (size > 0)
        {
            string s = Encoding.UTF8.GetString(bytes);

            if (Regex.IsMatch(s, "^GET", RegexOptions.IgnoreCase))
            {
                HandShake(s);
            }
            else
            {
                try
                {
                    string msg = "";
                    PayloadDataType opcode = GetMessage(out msg);

                    switch (opcode)
                    {
                        case PayloadDataType.Text:
                            ProcessMsg(msg);
                            break;
                        case PayloadDataType.Binary:
                            //Binary는 아무 동작 없음
                            break;
                        case PayloadDataType.ConnectionClose:
                            //받은 요청이 서버에서 보낸 요청에 대한 응답이 아닌 경우에만 실행
                            //if (State != WebSocketState.CloseSent)
                            {
                                SendCloseRequest(1000, "Graceful Close");
                                //State = WebSocketState.Closed;
                            }
                            Dispose();      // 소켓 닫음
                            Console.WriteLine("Socket Closed");
                            return;
                        //break;
                        default:
                            Console.WriteLine("Unknown Data Type");
                            break;
                    }
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.Message);
                }
            }
            stream.BeginRead(bytes, 0, bytes.Length, OnReadData, null);
        }
    }

    private void HandShake(string s)
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

        stream.Write(response, 0, response.Length);
    }

    private PayloadDataType GetMessage(out string msg)
    {
        msg = "";
        bool fin = (bytes[0] & 0b10000000) != 0,
                    mask = (bytes[1] & 0b10000000) != 0; // must be true, "All messages from the client to the server have this bit set"
        PayloadDataType opcode = (PayloadDataType)(bytes[0] & 0b00001111); // expecting 1 - text message
        int offset = 2;
        ulong msglen = bytes[1] & (ulong)0b01111111;

        if (msglen == 126)
        {
            // bytes are reversed because websocket wipp print them in Big-Endian, whereas
            // BitConverter will want them arranged in little-endian on windows
            msglen = BitConverter.ToUInt16(new byte[] { bytes[3], bytes[2] }, 0);
            offset = 4;
        }
        else if (msglen == 127)
        {
            // To test the below code, we need to manually buffer larger messages - since the NIC's autobuffering
            // may be too latency-friendly for this code to run(that is, we may have only some of the bytes in this
            // websocket frame available through client.Available).
            msglen = BitConverter.ToUInt64(new byte[] {
                    bytes[9], bytes[8], bytes[7], bytes[6], bytes[5], bytes[4], bytes[3],
                    bytes[2] }, 0);
            offset = 10;
        }

        if (mask)
        {
            byte[] decoded = new byte[msglen];
            byte[] masks = new byte[4] { bytes[offset],
                    bytes[offset + 1], bytes[offset + 2], bytes[offset + 3] };
            offset += 4;

            for (ulong i = 0; i < msglen; ++i) decoded[i] = (byte)(bytes[(ulong)offset + i] ^ masks[i % 4]);

            msg = Encoding.UTF8.GetString(decoded);
            Console.WriteLine(msg);
        }
        else
            throw new Exception("mask bit not set");

        Console.WriteLine();

        return opcode;
    }

    private void ProcessMsg(string msg)
    {
        try
        {
            string[] spl = msg.Split(';');
            string cmd = spl[0].ToUpper();
            Console.WriteLine($"{cmd}");
            if (cmd == "STOPBROADCAST")
            {
                tcpServer.StopBroadcast();
            }
            //else if (cmd == "STARTBROADCAST")
            //{
            //    tcpServer.StartBroadcast();
            //}            
            else if (cmd == "STATUS")
            {
                for (int i = 1; i < spl.Length; ++i)
                {
                    string[] keyVal = spl[i].Split('=');
                    string key = keyVal[0].ToUpper();
                    string val = keyVal[1];
                    if (key == "ID")
                    {
                        gamer.ID = val;
                        Console.WriteLine("gamer.ID=" + gamer.ID);
                    }
                    else if (key == "X")
                    {
                        gamer.x = int.Parse(val);
                    }
                    else if (key == "Y")
                    {
                        gamer.y = int.Parse(val);
                    }
                    else if (key == "DIR")
                    {
                        gamer.dir = val;
                    }
                    else throw new Exception("key invalid");
                }
                tcpServer.StartBroadcast();
            }
            else throw new Exception("cmd invalid");
            SendData("SUCCESS");
        }
        catch (Exception e)
        {
            SendData("FAIL:" + e.Message);
        }
    }

    public void SendData(string msg)
    {
        SendData(Encoding.UTF8.GetBytes(msg), PayloadDataType.Text);
    }

    public void SendData(byte[] data, PayloadDataType opcode)
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
        try
        {
            stream.Write(sendData, 0, sendData.Length);  //클라이언트에 전송
        }
        catch (Exception ex) { }
    }

    public void SendCloseRequest(ushort code, string reason)
    {
        byte[] closeReq = new byte[2 + reason.Length];
        BitConverter.GetBytes(code).CopyTo(closeReq, 0);
        //왜인지는 알 수 없지만 크롬에서 코드는 자리가 바뀌어야 제대로 인식할 수 있다.
        byte temp = closeReq[0];
        closeReq[0] = closeReq[1];
        closeReq[1] = temp;
        Encoding.UTF8.GetBytes(reason).CopyTo(closeReq, 2);
        SendData(closeReq, PayloadDataType.ConnectionClose);
    }

    private void Dispose()
    {
        client.Close();
        client.Dispose(); //모든 소켓에 관련된 자원 해제
        tcpServer.connections.Remove(this);
    }
}

class GamerStatus
{
    public int x = 0;
    public int y = 0;
    public string ID = "";
    public string dir = "";
}

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
