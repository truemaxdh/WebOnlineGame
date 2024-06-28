let renderer = {
    canv: null,
    ctx: null,
    map: null,
    
    init: function(container) {
        this.canv = document.getElementById('canv');
        this.ctx = this.canv.getContext('2d');
        
        let positionInfo = container.getBoundingClientRect();
        this.canv.width = positionInfo.width
        this.canv.height = positionInfo.height;

        this.map = new objMap(1000);
    },
    render: function (objChain, mainObj) {
        this.map.move(mainObj);
        this.map.render(this.ctx);
        objChain.render(this.ctx, mainObj);
    }
};