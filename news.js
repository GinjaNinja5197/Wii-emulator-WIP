/*var news = {
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
*/

var news = {
	'init' : function(ctx) {
		this.model = SkeletalModel(Globe3());
		this.model.precomputeJointQuats();

		this.world = World();
		this.cam = Camera(this.world);
		this.cam.setFocalLengthFromBlender(32);
		this.cam.setOrientation(torad(0), torad(0), torad(0));
		this.ras = Rasterizer(this.cam, ctx, '128earth.jpg');

		var textures = [];
		var images = ["news1.png", "news2.png", "news3.png"];
		for (var i=0; i<images.length; i++) {
			var img = new Image();
			textures.push(img);
			img.loaded = false;			
			img.i = i;
			img.onload = function() {
				textures[this.i].loaded = true;
			}
			img.src = images[i];			
		}
		this.textures = textures;
		
		// Load head image and small version of it.
/*		var texture = new Image();
		texture.loaded = false;
		texture.onload = function() {
			texture.loaded = true;			
//			alert(document.getElementById('canvas'));
		}
		texture.src = "paa.png";
		this.texture = texture;
*/
		this.currentImg = -1;
	},

	'render' : function(ctx, width, height, relativeT) {		
		var allLoaded = true;
		for (var i=0; i<this.textures.length; i++) {
			if (!this.textures[i].loaded) allLoaded = false;
		}
		if (!allLoaded) return;
	
		if (this.currentImg == -1) {
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, width, height);
		}

		ctx.globalAlpha = 0.2;
		if (relativeT > 8000 && relativeT < 9000) {
			this.currentImg = 0;
			ctx.drawImage(this.textures[0], 0, 0);
		}
		if (relativeT > 14000 && relativeT < 15000) {
			this.currentImg = 1;
			ctx.drawImage(this.textures[1], 0, 0);
		}
		if (relativeT <21000&& relativeT > 20000) {
			this.currentImg = 2;
			ctx.drawImage(this.textures[2], 0, 0);
			// the end of news
		}
		if (relativeT <27500 && relativeT > 26500) {
			this.currentImg = 3;
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, width, height);
			// the end of news
		}

		ctx.globalAlpha = 0.9;
		ctx.fillStyle = 'black';
		ctx.fillRect(964, 0, width, height);
		
		
//		if (this.ras.texturesLoaded() === false) {
//			console.log('texture not available!'); return;
//		}
	
		if (relativeT < 8250) {
			this.cam.setPosition(5-relativeT/1000.0, 0, 6);
		}
		if (relativeT > 26500) {
			this.cam.setPosition(5-(relativeT-26500+8250)/1000.0, 0, 6);
		}
	
		for (var i=0; i<this.model.getMeshCount(); i++) {
			this.world.tris = this.model.getTris(i);
			this.world.verts = this.model.computeVertices(i, 128, 0, 128, 0, this.model.getMeshJoints());
			this.world.rotateAroundPivot(0, this.world.verts.length-1, [0, 0, -2.5], ((Math.PI*2)/360)*relativeT*-0.005, ((Math.PI*2)/360)*relativeT*0.1, 0);	
		}
//		this.world.calculateNormals();	
		this.ras.refresh(textureMapped = true);
	}
};

