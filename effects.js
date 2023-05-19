var news = {
	'init' : function(ctx) {
		this.model = SkeletalModel(Globe2());
		this.model.precomputeJointQuats();

		this.world = World();
		this.cam = Camera(this.world);
		this.cam.setFocalLengthFromBlender(32);
		this.cam.setOrientation(torad(0), torad(0), torad(0));
		this.ras = Rasterizer(this.cam, ctx, '128earth.jpg');
	},

	'render' : function(ctx, width, height, relativeT) {		
		if (this.ras.texturesLoaded() === false) {
//			console.log('texture not available!'); return;
		}
	
		ctx.fillStyle = '#003088';
		ctx.fillRect(0, 0, width, height);

		this.cam.setPosition(5-relativeT/1000.0, 0, 8);
		
		for (var i=0; i<this.model.getMeshCount(); i++) {
			this.world.tris = this.model.getTris(i);
			this.world.verts = this.model.computeVertices(i, 128, 0, 128, 0);
			this.world.rotateAroundPivot(0, this.world.verts.length-1, [0, 0, 0], -90, ((Math.PI*2)/360)*relativeT*0.1, 0);	
		}
		this.world.calculateNormals();	
		this.ras.refresh(textureMapped = true);
	}
};

var lens = {

	'firstFrame' : function(ctx, width, height) {
		
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, width, height);	
	
//		var imgwidth = 331;
	//	var imgheight = 500;
//		ctx.drawImage(this.texture, 450, 100);
//		this.imgpx = ctx.getImageData(450, 100, imgwidth, imgheight);
//		alert(this.imgpx);
		this.firstFrame = null; // neo that is loco, sui-ci-de
	},

	'init' : function(ctx) {

		// Load head image and small version of it.
		var texture = new Image();
		texture.loaded = false;
		texture.onload = function() {
			texture.loaded = true;			
//			alert(document.getElementById('canvas'));
		}
		texture.src = "paa.png";
		this.texture = texture;

/*		var stexture = new Image();
		stexture.loaded = false;
		stexture.onload = function() {
			stexture.loaded = true;			
//			alert(document.getElementById('canvas'));
		}
		stexture.src = "pikkupaa.png";
		this.stexture = stexture;
	*/	
/*		var width = 100, height = 100;
		var newPixels = ctx.createImageData(width, height);
		for (var y = 0; y < newPixels.height; y += 1) {
			for (var x = 0; x < newPixels.width; x += 1) {
				for (var c = 0; c < 3; c += 1) {
					c = Math.round(Math.random()*255);
					var i = (y*newPixels.width + x)*4 + c;
					newPixels.data[i] = c;
	//				newPixels.data[i] = 255 - currentPixels.data[i];
				}
//				var alphaIndex = (y*newPixels.width + x)*4 + 3;
	//			newPixels.data[alphaIndex] = currentPixels.data[alphaIndex];
			}
		}
		this.px = newPixels;
	*/	
		this.lensx = 350;
		this.lensxs = 3;
		this.lensy = -100;
		this.lensys = 0;
		this.runtime = 15000;
		
		// Precompute path of ball for frameskipping.
		this.path = [];		
		for (var i=0; i<this.runtime/30; i++) {
			this.lensys += 0.15;
			this.lensy += this.lensys;
			if (i < 8000/30 && this.lensy > 450) { this.lensy = 450; this.lensys *= -0.6; }
			this.lensx += this.lensxs;
			if (i > 100 && (this.lensx > 800 || this.lensx < 550)) {
				this.lensxs *= -1;
			}
			this.path.push([this.lensx, this.lensy]);
		}

		this.frame = 0;
	},

	'render' : function(ctx, width, height, relativeT) {		
		if (this.firstFrame !== null) {
			this.firstFrame(ctx, width, height);
		}
		if (!this.texture.loaded) return;
		
		ctx.fillStyle = 'black';
		ctx.fillRect(this.lensx-100, this.lensy-100, 200, 200);	

//		thsi lensy = 100-Math.round(Math.abs(Math.sin(relativeT/1000.0)*100));

		// Draw concentric circles clipping an increasily zoomed version of the image drawn inside.
//		ctx.scale(2,2);

		this.frame = Math.round(relativeT/40);

		
		ctx.save();
		
		if (this.frame < 15) {
			ctx.beginPath();
			ctx.moveTo(1280/2-this.frame*10,0);
			ctx.lineTo(1280/2+this.frame*10,0);
			ctx.lineTo(1280/2+this.frame*5,720);
			ctx.lineTo(1280/2-this.frame*5,720);
			ctx.closePath();
			ctx.clip();
		}
		if (this.frame > 300) {
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, width, height);	
			ctx.beginPath();
			ctx.moveTo(1280/2-((315-this.frame)*10),0);
			ctx.lineTo(1280/2+((315-this.frame)*10),0);
			ctx.lineTo(1280/2+((315-this.frame)*5),720);
			ctx.lineTo(1280/2-((315-this.frame)*5),720);
			ctx.closePath();
			ctx.clip();
		}
		
		if (this.frame < 315) ctx.drawImage(this.texture, 450, 100);
		var startrad = 80;
		
		ctx.restore();
		
		this.lensx = this.path[this.frame][0];
		this.lensy = this.path[this.frame][1];

		if (this.frame < 315) {
			for (var rad=startrad;rad>0;rad-=5) {
				ctx.save();
				ctx.beginPath();
				ctx.arc(this.lensx, this.lensy, rad, 0, Math.PI*2, false);
				ctx.closePath();
				ctx.clip();
				var s = 1+Math.sin((startrad-rad)/1000);
				ctx.scale(s,s);
				ctx.drawImage(this.texture, 450*1/s/*+rad*Math.sin(relativeT/1000.0)/10*/, 100*1/s);
				ctx.restore();
			}		
		}
		
		// Make it a bit blue
		ctx.save();
		ctx.beginPath();
		ctx.arc(this.lensx, this.lensy, startrad, 0, Math.PI*2, false);
		ctx.fillStyle = "blue";
		ctx.globalAlpha = 0.2;
		ctx.fill();
		ctx.closePath();
		ctx.restore();
		
//		ctx.putImageData(this.px, 0, 0);
/*		ctx.fillStyle = '#003088';
		ctx.fillRect(0, 0, width, height);

		this.cam.setPosition(5-relativeT/1000.0, 0, 8);
		
		for (var i=0; i<this.model.getMeshCount(); i++) {
			this.world.tris = this.model.getTris(i);
			this.world.verts = this.model.computeVertices(i, 128, 0, 128, 0);
			this.world.rotateAroundPivot(0, this.world.verts.length-1, [0, 0, 0], -90, ((Math.PI*2)/360)*relativeT*0.1, 0);	
		}
		this.world.calculateNormals();	
		this.ras.refresh(textureMapped = true);*/
//		ctx.restore();
	}
};

