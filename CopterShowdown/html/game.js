let posDir = {
    ID: null,
    x: 0,
    y: 0,
    dir: null,
    propellerRot: 0,
    init: function () {
        this.ID = document.getElementById("ID").value;
        this.x = Math.floor(renderer.mapSize * Math.random());
        this.y = Math.floor( renderer.mapSize * Math.random());
        this.dir = 'ArrowRight';
    },
    getSendStatus: function () {
        return "STATUS;ID=" + this.ID + ";X=" + this.x + ";Y=" + this.y + ";DIR=" + posDir.dir;
    }
}

const StartGame = () => {
    pageChange('game');
    renderer.init(document.getElementById('canv_container'));
    posDir.init();
    addEvt();
    console.log('sendStatus');
    sendStatus();
    console.log('sendStatus end');
}

const EndGame = () => {
    removeEvt();
    StopBroadcast();
    pageChange('intro');
}

function tick(msg) {
    //console.log(msg);
    const spl = msg.split(';');
    let pid = null, px = -1, py = -1, pdir = null;
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
        else if (key == 'DIR') {
            pdir = val;

            const pCopter = new objCopter(px, py);
            if (pdir == 'ArrowDown') pCopter.rotate = Math.PI / 2;
            if (pdir == 'ArrowLeft') pCopter.rotate = Math.PI;
            if (pdir == 'ArrowUp') pCopter.rotate = Math.PI * 3 / 2;
            pCopter.propellerRot = posDir.propellerRot;
            if (pid == posDir.ID) {
                mainObj = pCopter;
            }
            curObj.next = pCopter;
            curObj = pCopter;

            pid = '', px = -1, py = -1;
        }
    });

    renderer.render(objChain, mainObj);
    if (!keyPressed) procTouchEvent();
    if (keyCode != '') {
        procKeyEvent();
        sendStatus();
    }

    posDir.propellerRot += Math.PI / 6;
    posDir.propellerRot %= Math.PI * 2;
}

function procKeyEvent() {
    console.log(keyCode);
    switch (keyCode) {
        case 'ArrowLeft':
            posDir.x -= 2;
            break;
        case 'ArrowRight':
            posDir.x += 2;
            break;
        case 'ArrowDown':
            posDir.y += 2;
            break;
        case 'ArrowUp':
            posDir.y -= 2;
            break;
        case 'Space':

            break;
        default:
            keyCode = posDir.dir;
            break;
    }
    posDir.dir = keyCode;
}

const BLOCK_WH = 3;

function procTouchEvent() {
    keyCode = '';
    if (user_pressing) {
        var dx = user_x - user_x_ori;
        var dy = user_y - user_y_ori;
        console.log(dx + ',' + dy);
        if (Math.abs(dx) <= BLOCK_WH && Math.abs(dy) <= BLOCK_WH) return;
        if (Math.abs(dx) >= Math.abs(dy)) dy = 0;
        else dx = 0;

        if (dy > BLOCK_WH) keyCode = 'ArrowDown';
        else if (dy < -BLOCK_WH) keyCode = 'ArrowUp';
        else if (dx > BLOCK_WH) keyCode = 'ArrowRight';
        else if (dx < -BLOCK_WH) keyCode = 'ArrowLeft';

        if (renderer.btnShoot.center.calcDist(new Vector2D(user_x, user_y)) <= renderer.btnShoot.r)
            keyCode = 'Space';
    }
}
