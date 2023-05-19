var guru = {	
	'init' : function(ctx) {
		this.p1 = startLoading("guru.png");		
	},

	'render' : function(ctx, width, height, relativeT) {		
		ctx.globalAlpha = 1;
		if (this.p1.loaded) ctx.drawImage(this.p1, 0, 0);
		if ((Math.round((relativeT/1000)) % 2) == 0) {
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, width, 159);
		}
	}
};

