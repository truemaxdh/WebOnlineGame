let x = 50, y = 50, ID, websocket;
const Connect = () => {
    const IP = '[[[ip]]]';
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
    console.log(evt);
    StartGame();
    
}

const onClose = (evt) => {
    console.log(evt);
}

const onMessage = (evt) => {
    //console.log(evt);
    let msg = evt.data;
    const prefix = 'STATUS_ALL'
    if (msg.startsWith(prefix)) {
        clearCanvas();
        msg = msg.substr(prefix.length + 1);
        const spl = msg.split(';');
        let pid = '', px = -1, py = -1;
        spl.forEach((v) => {
            const keyVal = v.split('=');
            const key = keyVal[0];
            const val = keyVal[1];
            if (key == 'ID') pid = val;
            else if (key == 'X') px = parseInt(val);
            else if (key == 'Y') py = parseInt(val);

            if (px >= 0 && py >= 0) {
                drawCanvas(pid, px, py);
                px = -1, py = -1;
            }
        });

        procUserInput();
    }
}

const onError = (evt) => {
    console.log(evt);
}


const sendStatus = () => {
    if (typeof ID == 'undefined') ID = document.getElementById("ID").value;
    let status = "STATUS;ID=" + ID + ";X=" + x + ";Y=" + y;
    websocket.send(status);
}
