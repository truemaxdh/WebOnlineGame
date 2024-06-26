let map;
//let copter;

const StartGame = () => {
    pageChange('game');
    rendererInit()
    addEvt();
    map = new objMap(1000);
    //copter = new objCopter(map);
    sendStatus();
    StartBroadcast();
}

const EndGame = () => {
    removeEvt();
    StopBroadcast();
    pageChange('intro');
}

function tick(msg) {
    map.render(ctx);
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
            //drawCanvas(pid, px, py);
            const pCopter = new objCopter(map, px, py);
            pCopter.render(ctx);
            if (pid == ID) {
                map.move(pCopter);
            }
            px = -1, py = -1;
        }
    });


    if (!keyPressed) procTouchEvent();
    if (keyCode != '') {
        procKeyEvent();
        sendStatus();
    }
}

function procKeyEvent() {
    switch (keyCode) {
        case 'ArrowLeft':
            x--;
            break;
        case 'ArrowRight':
            x++;
            break;
        case 'ArrowDown':
            y++;
            break;
        case 'ArrowUp':
            y--;
            break;
    }
}

const BLOCK_WH = 3;

function procTouchEvent() {
    keyCode = '';
    if (user_pressing) {
        var dx = user_x - user_x_ori;
        var dy = user_y - user_y_ori;
        console.log(dx + ',' + dy);
        if (dy > BLOCK_WH) keyCode = 'ArrowDown';
        else if (dy < -BLOCK_WH) keyCode = 'ArrowUp';
        else if (dx > BLOCK_WH) keyCode = 'ArrowRight';
        else if (dx < -BLOCK_WH) keyCode = 'ArrowLeft';
    }
}
