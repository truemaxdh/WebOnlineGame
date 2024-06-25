var keyCode;

var user_x_ori, user_y_ori;
var user_x, user_y;
var user_pressing = false;
var keyPressed = false;
function addEvt() {
    document.body.onkeydown = function (e) {
        console.log(e);

        keyCode = e.code;
        keyPressed = true;
        return false;
    };

    document.body.onkeyup = function( e ) {
        keyCode = '';
        rotBlTmr = 0;
        return false;
    }

    var scale_fx = canv.width / canv.clientWidth;
    var scale_fy = canv.height / canv.clientHeight;
    console.log(scale_fx + ',' + scale_fx);
    document.body.onmousedown = function (e) {
        user_x = e.clientX  * scale_fx;
        user_y = e.clientY * scale_fy;
        user_x_ori = user_x;
        user_y_ori = user_y;
        console.log(user_x + ',' + user_y);
        user_pressing = true;
        return false;
    }

    document.body.onmouseup = function (e) {
        user_pressing = false;
        return false;
    }

    document.body.onmousemove = function(e) {
        user_x = e.clientX * scale_fx;
        user_y = e.clientY * scale_fy;
        return false;
    }

    document.body.ontouchstart = function (e) {
        user_x = e.touches[0].clientX * scale_fx;
        user_y = e.touches[0].clientY * scale_fy;
        user_x_ori = user_x;
        user_y_ori = user_y;
                
        user_pressing = true;
        return false;
    }

    document.body.ontouchend = function (e) {
        user_pressing = false;
        return false;
    }

    document.body.ontouchmove = function(e) {
        user_x = e.touches[0].clientX * scale_fx;
        user_y = e.touches[0].clientY * scale_fy;
        return false;
    }
}

function removeEvt() {
    document.body.onkeydown = function( e ) {
    };

    document.body.onkeyup = function( e ) {
    }

    document.body.onmousedown = function (e) {
    }

    document.body.onmouseup = function (e) {
    }

    document.body.onmousemove = function(e) {
    }

    document.body.ontouchstart = function (e) {
    }

    document.body.ontouchend = function (e) {
    }

    document.body.ontouchmove = function(e) {
    }
}

