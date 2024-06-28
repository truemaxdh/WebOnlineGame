const StartGame = () => {
    pageChange('game');
    renderer.init(document.getElementById('canv_container'));
    addEvt();
    sendStatus();
}

const EndGame = () => {
    removeEvt();
    StopBroadcast();
    pageChange('intro');
}

function tick(msg) {
    console.log(msg);
    const spl = msg.split(';');
    let pid = '', px = -1, py = -1;
    let objChain = new gameobj();
    let curObj = objChain;
    let mainObj;
    spl.forEach((v) => {
        const keyVal = v.split('=');
        const key = keyVal[0];
        const val = keyVal[1];
        if (key == 'ID') pid = val;
        else if (key == 'X') px = parseInt(val);
        else if (key == 'Y') py = parseInt(val);

        if (px >= 0 && py >= 0) {
            const pCopter = new objCopter(px, py);
            if (pid == ID) {
                mainObj = pCopter;
            }
            curObj.next = pCopter;
            curObj = pCopter;

            pid = '', px = -1, py = -1;
        }
    });
    console.log('render');
    renderer.render(objChain, mainObj);
    console.log('procTouchEvent');
    if (!keyPressed) procTouchEvent();
    console.log('procKeyEvent');
    if (keyCode != '') {
        procKeyEvent();
        console.log('sendStatus');
        sendStatus();
    }
}

function procKeyEvent() {
    console.log(keyCode);
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
