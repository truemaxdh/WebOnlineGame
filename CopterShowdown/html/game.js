
const StartGame = () => {
    pageChange('game');
    rendererInit()
    addEvt();
    sendStatus();
    StartBroadcast();
}

const EndGame = () => {
    removeEvt();
    StopBroadcast();
    pageChange('intro');
}

function procUserInput() {
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
