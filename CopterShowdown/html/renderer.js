let canv;

let ctx;
const clearCanvas = () => {
    ctx.fillStyle = 'DarkGray';
    ctx.fillRect(0, 0, 600, 400);
}

const drawCanvas = (id, x, y) => {
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = '10px bold Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(id, x, y);
    console.log(id + "," + x + "," + y);
}
function rendererInit() {
    canv = document.getElementById('canv');
    ctx = canv.getContext('2d');
}