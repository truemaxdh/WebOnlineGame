let renderer = {
    canv: null,
    ctx: null,
    map: null,
    mapSize : 2000,
    btnShoot: null,
    init: function(container) {
        this.canv = document.getElementById('canv');
        this.ctx = this.canv.getContext('2d');
        
        let positionInfo = container.getBoundingClientRect();
        this.canv.width = positionInfo.width
        this.canv.height = positionInfo.height;

        this.map = new objMap(this.mapSize);
        this.btnShoot = new objBtnShoot();
    },
    render: function (objChain, mainObj) {
        this.map.move(mainObj);
        this.map.render(this.ctx);
        objChain.render(this.ctx, mainObj);
    }
};