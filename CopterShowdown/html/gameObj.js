class objMap extends gameobj {
    constructor(r) {
        super(r / 2, r / 2, r, 0, 0);
        this.forestColor = "#2b2";
        this.landColor = "#f0db66";
        this.mapSize = new Vector2D(r, r);
        this.mapCanvas = document.createElement("canvas");
        this.mapCanvas.width = this.mapSize.v1 * 2;
        this.mapCanvas.height = this.mapSize.v2 * 2;
        this.mapCtx = this.mapCanvas.getContext("2d");
        this.createMap();
    }
    createMap() {
        const ctx = this.mapCtx;
        ctx.fillStyle = this.landColor;
        ctx.fillRect(0, 0, this.mapSize.v1, this.mapSize.v2);
        ctx.globalAlpha = 0.8;
        const objCnt = Math.random() * this.r * 0.03;
        for(let cnt = 0; cnt < objCnt; cnt++) {
            const cx = Math.random() * this.mapSize.v1;
            const cy = Math.random() * this.mapSize.v2;
            const r = Math.random() * 100;
            if ((cx - r) < 0 || (cx + r) > this.mapSize.v1 ||
                (cy - r) < 0 || (cy + r) > this.mapSize.v2) {
                cnt--;
            } else {
                ctx.beginPath();
                ctx.fillStyle = getRndColor(128, 128, 128, 128);
                ctx.arc(cx, cy, r, 0, 2 * Math.PI);
                ctx.fill();    
            }            
        }
        ctx.globalAlpha = 1;
        ctx.drawImage(this.mapCanvas, 0, 0, this.mapSize.v1, this.mapSize.v2,
          this.mapSize.v1, 0, this.mapSize.v1, this.mapSize.v2);     
        ctx.drawImage(this.mapCanvas, 0, 0, this.mapSize.v1, this.mapSize.v2,
          0, this.mapSize.v2, this.mapSize.v1, this.mapSize.v2);     
        ctx.drawImage(this.mapCanvas, 0, 0, this.mapSize.v1, this.mapSize.v2,
          this.mapSize.v1, this.mapSize.v2, this.mapSize.v1, this.mapSize.v2);
    }

    move(copter) {
        console.log('move to ' + copter.center.v1 + ',' + copter.center.v2);
        this.center.v1 = copter.center.v1;
        this.center.v2 = copter.center.v2;
    }

    render(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        let l = this.center.v1 - Math.floor(w / 2);
        let t = this.center.v2 - Math.floor(h / 2);
        if (l < 0) l += this.mapSize.v1;
        if (t < 0) t += this.mapSize.v2;
        const imgData = this.mapCtx.getImageData(l, t, w, h);
        ctx.putImageData(imgData, 0, 0);
    }
}

class objCopter extends gameobj {
    constructor(x, y) {
        super(x, y, 45, 0, 0);
        this.propellerRot = 0;
        this.rotate = 0;
        this.unitRotate = Math.PI / 12;
        this.propellerRot = 0;
    }

    move() {
        const speed2D = new Vector2D(Math.cos(this.rotate) * this.speed, Math.sin(this.rotate) * this.speed);
        this.center.add(speed2D);
        if (this.center.v1 < 0) this.center.v1 += this.mapSize.v1;
        if (this.center.v1 >= this.mapSize.v1) this.center.v1 -= this.mapSize.v1;
        if (this.center.v2 < 0) this.center.v2 += this.mapSize.v2;
        if (this.center.v2 >= this.mapSize.v2) this.center.v2 -= this.mapSize.v2;
        const rndNum = Math.random();
        if (rndNum < 0.05) {
            this.rotate -= this.unitRotate;
        } else if (rndNum >= 0.95) {
            this.rotate += this.unitRotate;
        }
        this.propellerRot += this.unitRotate;
        this.propellerRot %= Math.PI * 2;
    }
    
    render(ctx, mainObj) {
        const dCenter = this.center.clone().subtract(mainObj);
        const half_w = ctx.canvas.width / 2 + dCenter.v1;
        const half_h = ctx.canvas.height / 2 + dCenter.v2;
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.translate(half_w, half_h);
        ctx.rotate(this.rotate);  
        
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(this.r / 2, 0);
        ctx.lineTo(-this.r, 0);
        //ctx.strokeStyle = "olive";
        ctx.strokeStyle = "greenyellow";
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(this.r / 2, 0, this.r * 0.8, this.r * 0.6, 0, 0, 2 * Math.PI);
        ctx.fillStyle = "yellowgreen";
        ctx.fill();
        
        ctx.beginPath();
        //ctx.fillStyle = "greenyellow";
        ctx.fillStyle = "yellowgreen";
        ctx.arc(-this.r, 0, this.r * 0.4, 0, 2 * Math.PI);
        ctx.fill();

        ctx.translate(this.r / 2, 0);
        ctx.rotate(-this.rotate);  
        
        ctx.lineWidth = 8;
        ctx.rotate(this.propellerRot);  
        ctx.beginPath();
        ctx.moveTo(-this.r, 0);
        ctx.lineTo(this.r, 0);
        ctx.moveTo(0, -this.r);
        ctx.lineTo(0, this.r);
        //ctx.strokeStyle = "peachpuff";
        ctx.strokeStyle = "olive";
        ctx.stroke();
        ctx.restore();

        super.render(ctx, mainObj);
    }
}

//motionGraphics.movingCopter = function(el) {
//    let cnv = document.createElement("CANVAS");
//    cnv.style.position = "relative";
//    cnv.style.width = el.style.width;
//    cnv.style.height = el.style.height;
//    cnv.id = "cnv";
    
//    var positionInfo = el.getBoundingClientRect();
//    cnv.width = positionInfo.width
//    cnv.height = positionInfo.height;
//    el.appendChild(cnv);

//    let obj = this.movingCopter;
//    obj.objName = "movingCopter";
//    this.runningObj = obj;

//    obj.ctx = cnv.getContext("2d");
//    obj.w = cnv.width;
//    obj.h = cnv.height;
//    obj.lastTimeStamp = null;

//    const map = new objMap(1000);
//    const copter = new objCopter(map);
//    obj.drawFrm = function(timeStamp) {
//        if (!obj.lastTimeStamp) obj.lastTimeStamp = timeStamp;
//        if ((timeStamp - obj.lastTimeStamp) > 30) {
//            obj.lastTimeStamp = timeStamp;
        
//            map.render(obj.ctx);
//            copter.render(obj.ctx);
//            copter.move();
//            map.move(copter);
//        }
    
//        if (motionGraphics.runningObj.objName == obj.objName) {
//            requestAnimationFrame(obj.drawFrm);
//        }
//    }
    
//    requestAnimationFrame(obj.drawFrm);
//}
