let x = 0, y = 0, ID, websocket;
const Connect = () => {
    const IP = document.getElementById("IP").value;
    console.log(ID + "," + IP);

    websocket = new WebSocket(IP);
    websocket.onopen = (evt) => { onOpen(evt) };
    websocket.onclose = (evt) => { onClose(evt) };
    websocket.onmessage = (evt) => { onMessage(evt) };
    websocket.onerror = (evt) => { onError(evt) };
}

const StartBroadcast = () => {
    websocket.send("STARTBROADCAST");
}

const StopBroadcast = () => {
    websocket.send("STOPBROADCAST");
    websocket.close();
}

const onOpen = (evt) => {
    //writeToScreen("CONNECTED");
    //doSend("WebSocket rocks");
    console.log(evt);
}

const onClose = (evt) => {
    //writeToScreen("DISCONNECTED");
    console.log(evt);
}

const onMessage = (evt) => {
    //writeToScreen('<span style="color: blue;">RESPONSE: ' + evt.data + '</span>');
    console.log(evt);
    let msg = evt.data;
    const prefix = 'STATUS_ALL'
    if (msg.startsWith(prefix)) {
        clearCanvas();
        msg = msg.substr(prefix.length + 1);
        const spl = msg.split(';');
        let id = '', x = -1, y = -1;
        spl.forEach((v) => {
            const keyVal = v.split('=');
            const key = keyVal[0];
            const val = keyVal[1];
            if (key == 'ID') id = val;
            else if (key == 'X') x = parseInt(val);
            else if (key == 'Y') y = parseInt(val);

            if (x >= 0 && y >= 0) {
                drawCanvas(id, x, y);
                x = -1, y = -1;
            }
        });
    }
}

const onError = (evt) => {
    //writeToScreen('<span style="color: red;">ERROR:</span> ' + evt.data);
    console.log(evt);
}

let ctx;
const clearCanvas = () => {
    if (typeof ctx == 'undefined') {
        const canv = document.getElementById('canv');
        ctx = canv.getContext('2d');
    }
    ctx.fillStyle = 'DarkGray';
    ctx.fillRect(0, 0, 600, 400);
}

const drawCanvas = (id, x, y) => {
    if (typeof ctx == 'undefined') {
        const canv = document.getElementById('canv');
        ctx = canv.getContext('2d');
    }
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = '10px bold Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(id, x, y);
    console.log(id + "," + x + "," + y);
}

const sendStatus = () => {
    if (typeof ID == 'undefined') ID = document.getElementById("ID").value;
    let status = "STATUS;ID=" + ID + ";X=" + x + ";Y=" + y;
    websocket.send(status);
}
