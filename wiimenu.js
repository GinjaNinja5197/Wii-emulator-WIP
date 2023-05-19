var createMenuPlayerEffect = function(movement, background, spinner, shouldRecord) {
	function startLoading(src) {
		var texture = new Image();
		texture.loaded = false;
		texture.onload = function() {
			texture.loaded = true;			
		}
		texture.src = src;
		return texture;
	}

	var recording = null;
	if (shouldRecord !== undefined) recording = [];
	var prevX = -1;
	var prevY = -1;
	
	function getPosForT(t) {
		var x, y;
		for (var i=0; i<movement.length; i++) {
			x = movement[i][1];
			y = movement[i][2];
			if (movement[i][0] > t) break;
		}
		return [x,y];
	}
	
	return {
		'init' : function(ctx) {
			this.texture = startLoading(background/*'channels.png'*/);
			this.cursor = startLoading('cursor.png');		
			this.cx = 50;
			this.cy = 150;
			document.getElementById('out').value = "";
			
			if (spinner !== undefined) {
				this.model = SkeletalModel(Icosphere());
				this.world = World();
				this.cam = Camera(this.world);
				this.cam.setFocalLengthFromBlender(20);
				this.cam.setOrientation(torad(0), torad(0), torad(0));
				this.cam.setPosition(0, 0, 2.2);
				this.ras = Rasterizer(this.cam, ctx, 'waves2.gif', '#eecccc');
			}
		},

/*		'moveCursor' : function() {
		},
	*/	
		'render' : function(ctx, width, height, relativeT) {		
			ctx.globalAlpha = Math.min(1, relativeT/2000);
	//		if (!this.texture.loaded || !this.cursor.loaded) return;		
	//		this.moveCursor();
			if (this.texture.loaded) ctx.drawImage(this.texture, 0, 0);
			
			if (recording !== null) {
				if (mouseX != prevX || mouseY != prevY) {
					document.getElementById('out').value += "["+relativeT+", "+mouseX+", "+mouseY+"], ";
					prevX = mouseX;
					prevY = mouseY;
				}
				if (this.cursor.loaded) {
					ctx.drawImage(this.cursor, mouseX, mouseY);
				}
			} else {
				if (this.cursor.loaded) {
					var pos = getPosForT(relativeT);
//					console.log(pos);
					ctx.drawImage(this.cursor, pos[0], pos[1]);
				}
			}
			
			if (spinner !== undefined) {
				this.world.tris = this.model.getTris(0);
				var joints = this.model.getMeshJoints();
				this.world.verts = this.model.computeVertices(0, 100, 0, 100, 0, joints);
				this.world.rotateAroundPivot(0, this.world.verts.length-1, [0, 0, 1.5], 0, relativeT/500, relativeT/10000);
				this.world.translateVerts(0, this.world.verts.length-1, [-0.18, -0.05, 0]);			
				this.world.calculateNormals();
//				ctx.globalAlpha = 0.6;
				this.ras.refresh(true);
//				ctx.globalAlpha = 1;
			}
		}
	};
};

