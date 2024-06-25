function procUserInput() {
    if (!keyPressed) procTouchEvent();
    if (keyCode != '') {
        procKeyEvent();
        sendStatus();
    }
}

function procKeyEvent() {
    switch (keyCode) {
        case 'left':
            x--;
            break;
        case 'right':
            x++;
            break;
        case 'down':
            y++;
            break;
        case 'up':
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

        if (dy > BLOCK_WH) keyCode = 'down';
        else if (dy < -BLOCK_WH) keyCode = 'up';
        else if (dx > BLOCK_WH) keyCode = 'right';
        else if (dx < -BLOCK_WH) keyCode = 'left';
    }
}
