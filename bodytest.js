/*
 * Couldn't get skeletal animation working, so this is a simplified version of the we fat effect.
 */


var bodytest = {	
	'init' : function(ctx) {
//		this.anim = BaconAnim();
		this.model = SkeletalModel(Bodyukko());

		this.world = World();
		this.cam = Camera(this.world);
		this.cam.setFocalLengthFromBlender(20);
		this.cam.setOrientation(torad(10), torad(0), torad(0));
		this.cam.setPosition(0, 0, 0);
		this.ras = Rasterizer(this.cam, ctx, 'bemmuface256.png', 'blue');
		
		// Load head image and small version of it.
		this.p1 = startLoading("welcometowefat.png");
		this.p2 = startLoading("bodyteststart.png");
		this.p3 = startLoading("measuring.png");
		this.p4 = startLoading("done.png");
		this.p5 = startLoading("gained.png");
		this.p6 = startLoading("congrats.png");
		
	},

	'render' : function(ctx, width, height, relativeT) {		
		ctx.globalAlpha = 1;
		
		if (relativeT >= 0 && relativeT < 4000) { ctx.globalAlpha = 0.2; if (this.p1.loaded) ctx.drawImage(this.p1, 0, 0); } // 0:00
		if (relativeT >= 4000 && relativeT < 9000) { if (this.p2.loaded) ctx.drawImage(this.p2, 0, 0); } // 0:04
		if (relativeT >= 9000 && relativeT < 16000) { ctx.globalAlpha = 0.2; if (this.p3.loaded) ctx.drawImage(this.p3, 0, 0); } // 0:09
		if (relativeT >= 16000 && relativeT < 19000) { if (this.p4.loaded) ctx.drawImage(this.p4, 0, 0); } // 0:16
		if (relativeT >= 19000 && relativeT < 22000) { if (this.p5.loaded) ctx.drawImage(this.p5, 0, 0); } // 0:19
		if (relativeT >= 22000) { if (this.p6.loaded) ctx.drawImage(this.p6, 0, 0); } // 0:22

		ctx.globalAlpha = 1;
		for (var i=0; i<this.model.getMeshCount(); i++) {
			this.world.tris = this.model.getTris(i);
			joints = this.model.getMeshJoints();
			this.world.verts = this.model.computeVertices(i, 256, 0, 256, 0, joints);
			this.world.rotateAroundPivot(0, this.world.verts.length-1, [0, 0, -10], Math.PI/2-Math.PI/5, (relativeT-9000)/30000, -Math.PI/3);
			if (relativeT >= 9000 && relativeT < 16000) {
				this.world.rotateAroundPivot(0, this.world.verts.length-1, [0, 0, -10], 0, (relativeT-9000)/1000, 0);
			}
			if (relativeT >= 22000 && i == 2) {
				this.world.rotateAroundPivot(0, this.world.verts.length-1, [0, 0, -10], Math.PI, 0/*(relativeT-22000)/8000*/, 0/*(relativeT-22000)/10000*/);
				this.world.translateVerts(0, this.world.verts.length-1, [0, 0.4+(relativeT-22000)/16000, 0]);
			}
			if (i == 0) ctx.globalAlpha = 1;
			if (i != 0) ctx.globalAlpha = 0.2;
			if (relativeT > 4000) this.ras.refresh(i == 0);
		}
	}
};

