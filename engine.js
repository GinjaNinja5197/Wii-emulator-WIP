var texture;
var ctx = null;
/*var width = 1280;
var height = 720;*/

function e(x) {
	return document.getElementById(x);
}


//var newPixels = null;



/*var lastTime = null;
function fps() {
	var d = new Date();
	var elapsed = d.getTime() - lastTime;
	if (lastTime !== null) {
		e('fps').innerHTML = Math.round(1000 / elapsed) + ' fps';
	}
	lastTime = d.getTime();
}
*/

/*
function refresh() {
	frameStart();
	fill("blue"); // just this can take over 5 ms!
	for (var i=0; i < 150; i++) {
		posx = Math.random()*(width-100); 
		posy = Math.random()*(height-100);
		tri(	posx, posy, 0, 0,  // x, y, u, v for each corner of triangle 
				Math.random()*100 + posx, Math.random()*100 + posy, 100, 0, 
				Math.random()*100 + posx, Math.random()*100 + posy, 0, 100, texture);
	}
	frameEnd();
}
*/
// Function that returns a new World. A world contains vertices, and triangles formed from these vertices
// in world coordinates. Each vertex has an x y z position in the world, in addition to u/v coordinates.
// To see what is in the world, these raw coordinates need to be fed to a Camera.
//
// As a simplification, the whole world uses a single texture.
//
var World = function() {
	return {
		'verts' : [],
		'tris' : [],
		'normals' : [], // one normal per triangle

		'clear' : function() {
			this.verts = [];
			this.tris = [];
			this.normals = [];
		},
		
		// Calculates face normals for each triangle.
		'calculateNormals' : function () {
			this.normals = [];
			for (var i=0; i<this.tris.length; i++) {
				// Vectors a -> b, a -> c
				var a = this.verts[this.tris[i][0]];
				var b = this.verts[this.tris[i][1]];
				var c = this.verts[this.tris[i][2]];
				var aToB = [b[0]-a[0], b[1]-a[1], b[2]-a[2]];
				var aToC = [c[0]-a[0], c[1]-a[1], c[2]-a[2]];
				
				// Cross product of a -> b, a -> c vectors gives the normal
				var cross = [
					aToB[1]*aToC[2] - aToB[2]*aToC[1],
					aToB[2]*aToC[0] - aToB[0]*aToC[2],
					aToB[0]*aToC[1] - aToB[1]*aToC[0]					
				];
				this.normals.push(cross);
			}
		},
		
		// Returns min and max values that any vertex in the world has in the given axis.
		// Axis 0 = x, 1 = y, 2 = z
		'minMaxOnAxis' : function (axis) {
			var min = null; 
			var max = null;
			for (var i=0; i<this.verts.length; i++) {
				if (min == null || this.verts[i][axis] < min) min = this.verts[i][axis];
				if (max == null || this.verts[i][axis] > max) max = this.verts[i][axis];
			}
			return [min, max];
		},		
		
		// Returns a maxmin bounding box description for the world.
		'boundingBox' : function() {
			return {
				'xMinMax' : this.minMaxOnAxis(0),
				'yMinMax' : this.minMaxOnAxis(1),
				'zMinMax' : this.minMaxOnAxis(2),
			};
		},

		// Rotates the given range of vertices in the world around the given pivot point.
		'rotateAroundPivot' : function(rangeStart, rangeEnd, pivot, rotX, rotY, rotZ) {
			var quat = eulerToQuat(rotX, rotY, rotZ);
			for (var i=rangeStart; i<=rangeEnd; i++) {
				for (var j=0; j<3; j++) { // translate to pivot
					this.verts[i][j] -= pivot[j];
				}	
				var rotV = rotateByQuat(this.verts[i], quat); // rotate
				for (var j=0; j<3; j++) { // translate back, preserve u/v
					this.verts[i][j] = rotV[j] + pivot[j];
				}
			}
		},

		// Translates given range of vertices
		'translateVerts' : function(rangeStart, rangeEnd, trans) {
			for (var i=rangeStart; i<=rangeEnd; i++) {
				for (var j=0; j<3; j++) { // translate to pivot
					this.verts[i][j] += trans[j];
				}	
			}
		},
		
		'debug' : function() {
			alert('There are '+this.verts.length+' vertices and '+this.tris.length+' tris.');
		}
	};
}

// Function that returns a new Camera. A camera here is a pinhole camera positioned somewhere in the world,
// with an orientation described by a quat, with a certain focal length. The main function of the camera is
// to turn given world triangles into projected viewport triangles.
//
// Here's a test for you. Try to count to 100, one says odds, one evens. See how fast you can do without screwing up.
//
var Camera = function(world) {
	return {
		'pos' : [0, 0, 0], // position x y z
		'quat' : [0, 0, 0, 0], // orientation as quat with real part first
		'f' : 1, // focal length
		'debug' : function() {
			alert('camera quat is ['+this.quat+'], camera pos is ['+this.pos+'], focal length is '+this.f);
		},

		// Changes the location of the camera in the world. locX, locY, locZ are the values to copy from Blender 
		// (select desired camera, press N).
		//
		'setPosition' : function (locX, locY, locZ) {
			this.pos = [locX, locY, locZ];
		},

		// Changes the direction the camera is pointing at. rotX, rotY, rotZ are the values to copy from Blender 
		// (select desired camera, press N). Add Math.PI to rotX copied from Blender, because for some reason in Blender
		// a camera oriented (0,0,0) is pointing at the NEGATIVE Z axis, when it seems natural that the positive
		// Z axis would be pointed to.
		//
		'setOrientation' : function (rotX, rotY, rotZ) {
			this.quat = eulerToQuat(rotX, rotY, rotZ);
		},
		
		// Given a value copied from Blender (select camera, F9, "Lens:"), sets internal focal length to match.
		'setFocalLengthFromBlender' : function(blenderLens) {
			this.f = blenderLens / 32.0;
		},
		
		// Returns view from camera projected to the viewplane as vertices and triangles. Some may still fall
		// outside the viewport. In the returned coordinates, (0,0) is in the center. The returned coordinates
		// still likely also need some scaling before they are ready to be displayed.
		//
		'getViewplaneVertsAndTris' : function() {

			// Copy verts from world instead of making a reference to it.
			var worldVerts = [];
			for (var i = 0; i < world.verts.length; i++) {
				worldVerts.push(world.verts[i].slice(0)); // make copy instead of reference for each subelement
			}

			// Copy tris too, since these will be altered (by sorting) as well.
			var tris = [];
			for (var i = 0; i < world.tris.length; i++) {
				tris.push(world.tris[i].slice(0));
			}

			// Translate all verts so that the camera is in the center.
			for (var i=0; i < worldVerts.length; i++) {
				for (var j=0; j < 3; j++) worldVerts[i][j] -= this.pos[j];
			}
			
			// Do an inverse rotation on all verts so that the camera is looking straight towards the negative 
			// Z direction (like in Blender if you set camera rotation to 0,0,0).
			for (var i=0; i < worldVerts.length; i++) {
				var unrotV = unrotateByQuat(worldVerts[i], this.quat);
				for (var j=0; j < 3; j++) worldVerts[i][j] = unrotV[j]; // copy over instead of assign to preserve U/V
			}

			// Back-face culling. See if normal points away. Add only accepted tris to the final triangle list.
			var viewplaneTris = [];
			if (world.normals.length > 0) {
				for (var i=0; i < tris.length; i++) {			
				
					// Dot product between triangle midpoint and the triangle normal.
					var normal = world.normals[i];
					var midpoint = [
						(worldVerts[tris[i][0]][0] + worldVerts[tris[i][1]][0] + worldVerts[tris[i][2]][0])/3,
						(worldVerts[tris[i][0]][1] + worldVerts[tris[i][1]][1] + worldVerts[tris[i][2]][1])/3,
						(worldVerts[tris[i][0]][2] + worldVerts[tris[i][1]][2] + worldVerts[tris[i][2]][2])/3						
					];
					
					var dot = midpoint[0]*normal[0] + midpoint[1]*normal[1] + midpoint[2]*normal[2];
					/*if (dot <= 0)*/ viewplaneTris.push(tris[i].slice(0));
				}
			} else {
				viewplaneTris = tris;
			}
			
			// Let tris that are closer be drawn last.
			viewplaneTris.sort(function(a, b) {
				var aAvgZ = (worldVerts[a[0]][2] + worldVerts[a[1]][2] + worldVerts[a[2]][2])/3;
				var bAvgZ = (worldVerts[b[0]][2] + worldVerts[b[1]][2] + worldVerts[b[2]][2])/3;
				return aAvgZ - bAvgZ;
			});
		
			// Project all vertices, taking focal length into account.
			var viewplaneVerts = [];
			for (var i=0; i < worldVerts.length; i++) {
//				var coeff = this.f / 0.4;//worldVerts[i][2];
				var coeff = -this.f / worldVerts[i][2];
				var u = worldVerts[i][3];
				var v = worldVerts[i][4];
//				console.log('u:'+u+' v:'+v);
				viewplaneVerts.push([worldVerts[i][0]*coeff, worldVerts[i][1]*coeff, u, v]);
			}		
			
			return [viewplaneVerts, viewplaneTris];
			
/*			var verts = [];
			var tris = [];
			for (var i=0; i < 150; i++) {
				var posx = (Math.random()-0.5)/3; 
				var posy = (Math.random()-0.5)/3;
				var firstPushedVertIndex = verts.length;
				verts.push([posx, posy, 0, 0]);
				verts.push([(Math.random()-0.5)/10 + posx, (Math.random()-0.5)/10 + posy, 100, 0]);
				verts.push([(Math.random()-0.5)/10 + posx, (Math.random()-0.5)/10 + posy, 100, 100]);
				tris.push([firstPushedVertIndex, firstPushedVertIndex+1, firstPushedVertIndex+2]);
			}
			return [verts, tris];
*/
		}
	};
};

// Function that returns a new rasterizer that knows how to draw things on a canvas from the point of view
// of a given camera. One might want several rasterizers to show several views of the same world simultaneously.
//
// The given texture is used for texture mapping. 
//
var Rasterizer = function(camera, ctx, textureSrc, fillColor) {

	var width = e(canvasDivId).width;
	var height = e(canvasDivId).height;

	var texture = new Image();
	texture.loaded = false;
	texture.onload = function() {
		texture.loaded = true;
	}
	texture.src = textureSrc;

	var startTime;

	// Draws a simple filled triangle.
	//
	function plaintri(	Ax, Ay,
						Bx, By,
						Cx, Cy ) {
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(Ax, Ay);
		ctx.lineTo(Bx, By);
		ctx.lineTo(Cx, Cy);
		ctx.closePath();
//		ctx.globalAlpha = 0.5;
		ctx.strokeStyle = 'white';
		ctx.stroke();
		if (fillColor === undefined) {
			ctx.fillStyle = 'black';
		} else {
			ctx.fillStyle = fillColor;
		}
		ctx.fill();
		ctx.restore();
	}
	
	// Draws a texture mapped triangle between 2D vectors A B C, each additionally having 
	// U/V coordinates for the texture.
	//
	function tri(	Ax, Ay, Au, Av, 
					Bx, By, Bu, Bv, 
					Cx, Cy, Cu, Cv, texture) {
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(Ax, Ay);
		ctx.lineTo(Bx, By);
		ctx.lineTo(Cx, Cy);
		ctx.closePath();
		ctx.clip();

		// This is a solution to the system of linear equations that asks what
		// a, b, c, d, tx, ty should be so that each u/v coordinate maps to each
		// x/y coordinate. Computed with xcas.
		
		var denominator = Au*Bv - Au*Cv - Av*Bu + Av*Cu + Bu*Cv - Bv*Cu;
		
		if (denominator != 0) {		
			var a = (-Av*Bx + Av*Cx + Ax*Bv - Ax*Cv - Bv*Cx + Bx*Cv) / denominator
			var b = (Au*Bx - Au*Cx - Ax*Bu + Ax*Cu + Bu*Cx - Bx*Cu) / denominator
			var c = (-Av*By + Av*Cy + Ay*Bv - Ay*Cv - Bv*Cy + By*Cv) / denominator
			var d = (Au*By - Au*Cy - Ay*Bu + Ay*Cu + Bu*Cy - By*Cu) / denominator
			var tx = (Au*Bv*Cx - Au*Bx*Cv - Av*Bu*Cx + Av*Bx*Cu + Ax*Bu*Cv - Ax*Bv*Cu) / denominator
			var ty = (Au*Bv*Cy - Au*By*Cv - Av*Bu*Cy + Av*By*Cu + Ay*Bu*Cv - Ay*Bv*Cu) / denominator
					
			ctx.transform(a, c, b, d, tx, ty);
			ctx.drawImage(texture, 0, 0);
		}
/*			borderColor = 'white';
			if (borderColor !== null) {
				ctx.strokeStyle = borderColor;
				ctx.stroke();
			}
		}
	*/	
		ctx.restore();
	}

	return {
	
		'texturesLoaded' : function() { return texture.loaded; },
	
		// Redraws the camera view on the canvas. Returns amount of milliseconds it took to do.
		//
		'refresh' : function(textureMapped) {
			if (texture.loaded === false) return;
			
			var vertsAndTris = camera.getViewplaneVertsAndTris();
			var verts = vertsAndTris[0];
			var tris = vertsAndTris[1];

			// After projection, the dots will span a viewport -0.5 to 0.5, and these need to correspond to
			// 0 to width, with width/2 as center. This can be accomplished by out*width+width/2. For y
			// coords, do (out*width)+height/2 and just let things that are too high / low not get drawn.
			
			for (var i=0; i < tris.length; i++) {
				var vertA = verts[tris[i][0]];
				var vertB = verts[tris[i][1]];
				var vertC = verts[tris[i][2]];
				
				// In Blender coordinate system, as Y increases we go up the viewport. But on our canvas as
				// Y increases we go DOWN the viewport, so that's why Y is flipped but X is not.

				if (textureMapped) {
					tri(vertA[0]*width+width/2, -vertA[1]*width+height/2, vertA[2], vertA[3],
						vertB[0]*width+width/2, -vertB[1]*width+height/2, vertB[2], vertB[3],
						vertC[0]*width+width/2, -vertC[1]*width+height/2, vertC[2], vertC[3], texture);
				} else {
					plaintri(vertA[0]*width+width/2, -vertA[1]*width+height/2, 
						vertB[0]*width+width/2, -vertB[1]*width+height/2,  
						vertC[0]*width+width/2, -vertC[1]*width+height/2 );
				}
			}			
		}
	};
};
