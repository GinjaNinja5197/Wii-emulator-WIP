var placebacon = {	
	'init' : function(ctx) {
		this.p1 = startLoading("bacon.png");		
	},

	'render' : function(ctx, width, height, relativeT) {		
		ctx.globalAlpha = 0.2;
		if (this.p1.loaded) ctx.drawImage(this.p1, 0, 0);
	}
};

