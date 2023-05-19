/*
 * Couldn't get skeletal animation working, so this is a simplified version of the we fat effect.
 */

function startLoading(src) {
	var texture = new Image();
	texture.loaded = false;
	texture.onload = function() {
		texture.loaded = true;			
	}
	texture.src = src;
	return texture;
}

var eatbacon = {	
	'init' : function(ctx) {
//		this.anim = BaconAnim();
		this.model = SkeletalModel(Bacon());
		this.model.precomputeJointQuats();

		this.world = World();
		this.cam = Camera(this.world);
		this.cam.setFocalLengthFromBlender(35);
		this.cam.setOrientation(torad(65.046-0), torad(-6.574), torad(-136.127));
		this.cam.setPosition(-16.645*1, 11.602*1, 1*14.975);
		this.ras = Rasterizer(this.cam, ctx, '128earth.jpg');
		
		// Load head image and small version of it.
		this.eat1 = startLoading("eat1.png");
		this.eat2 = startLoading("eat2.png");
		this.eat3 = startLoading("eat3.png");
		this.currentImg = -1;
	},

	'render' : function(ctx, width, height, relativeT) {		

		ctx.globalAlpha = 1;
		if (relativeT < 10500) {
			if (this.eat1.loaded) ctx.drawImage(this.eat1, 0, 0);
		} else {
			if (relativeT > 11500) {
				if (this.eat3.loaded) ctx.drawImage(this.eat3, 0, 0);
			} else {
				if (this.eat2.loaded) ctx.drawImage(this.eat2, 0, 0);
			}
		}
		
/*		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, width, height);
	*/	
		
		if (relativeT < 16000) {
			this.cam.setPosition(/*-16.645*1 + */-15+(relativeT*1.2-7000)/1000, 11.602*1 + (relativeT*1.2-7000)/500, 1*14.975);
		} else {
			this.cam.setPosition(/*-16.645*1 + */-15+(relativeT*1.2-7000)/1000 - (relativeT-16000)/40, 11.602*1 + (relativeT*1.2-7000)/500, 1*14.975);
//			this.cam.setPosition(-16.645, 11.602, 14.975);
		}
		
		for (var i=0; i<this.model.getMeshCount(); i++) {
			this.world.tris = this.model.getTris(i);
//			console.log(this.anim.frames[1]);

			joints = this.model.getMeshJoints();
			this.world.verts = this.model.computeVertices(i, 128, 0, 128, 0, joints);
			ctx.globalAlpha = 1;
			
			if (relativeT < 16000) {
				this.world.rotateAroundPivot(0, this.world.verts.length-1, [0.6729, -0.968, 1.080], ((Math.PI*2)/360)*(relativeT*1.2-7000)*-0.005, ((Math.PI*2)/360)*(relativeT*1.2-7000)*0.1, 0);	
			} else {
				this.world.rotateAroundPivot(0, this.world.verts.length-1, [0.6729, -0.968, 1.080], 0, relativeT/1000.0, 0);	
			}
			
			this.world.calculateNormals();	
			this.ras.refresh(textureMapped = false);
		}

		/*
		
		
//		if (this.ras.texturesLoaded() === false) {
//			console.log('texture not available!'); return;
//		}
	
		if (relativeT < 8200) {
			this.cam.setPosition(5-relativeT/1000.0, 0, 6);
		}
		if (relativeT > 26500) {
			this.cam.setPosition(5-(relativeT-26500+8200)/1000.0, 0, 6);
		}
	
		for (var i=0; i<this.model.getMeshCount(); i++) {
			this.world.tris = this.model.getTris(i);
			this.world.verts = this.model.computeVertices(i, 128, 0, 128, 0);
			this.world.rotateAroundPivot(0, this.world.verts.length-1, [0, 0, -2.5], ((Math.PI*2)/360)*relativeT*-0.005, ((Math.PI*2)/360)*relativeT*0.1, 0);	
		}
//		this.world.calculateNormals();	
		this.ras.refresh(textureMapped = true);
		*/
	}
};

