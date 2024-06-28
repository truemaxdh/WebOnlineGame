let x = 150, y = 150, ID, websocket;
const Connect = () => {
    const IP = '[[[ip]]]';
    console.log(ID + "," + IP);

    websocket = new WebSocket(IP);
    websocket.onopen = (evt) => { onOpen(evt) };
    websocket.onclose = (evt) => { onClose(evt) };
    websocket.onmessage = (evt) => { onMessage(evt) };
    websocket.onerror = (evt) => { onError(evt) };
}

//const StartBroadcast = () => {
//    console.log('StartBroadcast');
//    websocket.send("STARTBROADCAST");
//}

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
        msg = msg.substr(prefix.length + 1);

        tick(msg);
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
