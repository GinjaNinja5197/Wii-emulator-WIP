/*
 * Wrapper for 3D skeletal model data that knows how to compute final vertex positions from
 * the data, either from the joint positions present in the model, or from an animation frame.
 */
var SkeletalModel = function(model) {
	return {
		'mesh' : model,
		
		'getMeshCount' : function() {
			return this.mesh.meshes.length;
		},
		
		'getTris' : function(meshindex) {
		
//			var meshindex = 0;
//			var tris = [];
			
//			alert(this.mesh.meshes.length);
//			for (var meshindex=0;meshindex<this.mesh.meshes.length;meshindex++) {				
/*				for (var i=0; i<this.mesh.meshes[meshindex].tris.length; i++) {
					tris.push(this.mesh.meshes[meshindex].tris[i]);
				}*/
	//		}

//			return tris;
			return this.mesh.meshes[meshindex].tris;
		},
		
		// Quats as we get them from the JSON-encoded MD5 file are missing the W component. Fill that
		// in to get a complete quat for each joint.
		//
		'precomputeJointQuats' : function() {
/*			for (var m=0; m<this.mesh.meshes.length; m++) {
				for (var j=0; j<this.mesh.joints.length; j++) {
					var q = this.mesh.joints[j].quat; // quat without w component

					// Not sure why I need to test term for 0.0. Many people seemed to have an issue with this same
					// part, so just working on tips from http://www.doom3world.org/phpbb2/viewtopic.php?t=4618
					var term = -q[0]*q[0]-q[1]*q[1]-q[2]*q[2]+1;
					var w = 0.0;
					if (term >= 0.0) {
						w = -Math.sqrt(term);
					}
					
					this.mesh.joints[j].quat = [w, q[0], q[1], q[2]];
				}
			}
*/
		},
		
		// Returns a joints structure that can be passed to computeVertices to get the vertices. For animation,
		// instead of passing this data, pass data calculated from animation frames instead.
		'getMeshJoints' : function() {		
			return this.mesh.joints;
		},
		
		'getJointPosAndQuat' : function(joints, i, hierarchy) {		
		
			var parent = hierarchy[i].parent;
			
			// If there is no parent, use position and quat as-is. Otherwise the
			// position is translated and rotated by the parent.
			var pos = joints[i].pos.slice(0);
			var quat = joints[i].quat.slice(0);
			
			if (parent !== -1) {
				var pdata = this.getJointPosAndQuat(joints, parent, hierarchy);
				var ppos = pdata[0];
				var pquat = pdata[1];
				
				// Rotate position by parent.
				pos = rotateByQuat(pos, completeQuat(pquat));
				
				// Translate by parent.				
				pos[0] += ppos[0];
				pos[1] += ppos[1];
				pos[2] += ppos[2];
				
				// Combine rotation with parent.
				var combined = normalizeQuat(mulQuats(completeQuat(quat), completeQuat(pquat)));
				quat = [combined[1], combined[2], combined[3]];
			}
			
			return [pos, quat];
		},
		
		// Given an animation and an index into a frame of that animation, returns 
		'getJointsFromAnimation' : function(anim, frameIndex) {
		
			// Construct returned output to this joints structure. Every value in it will end up replaced
			// (so it might as well be initialized to zero values), but it is convenient to copy the frame structure.
			var joints = [];
			for (var i=0; i<anim.frames[frameIndex].length; i++) {
				joints.push({
				'pos' : anim.frames[frameIndex][i].pos.slice(0),
				'quat' : anim.frames[frameIndex][i].quat.slice(0),
				});
			}
			
			
			// Now go through each joint to get final joint positions. If a joint has no parent, then that
			// joint pos & orientation can be returned as-is.
			for (var i=0; i<joints.length; i++) {
			
				var vals = this.getJointPosAndQuat(anim.frames[frameIndex], i, anim.hierarchy);
				joints[i].pos = vals[0];
				joints[i].quat = vals[1];
			
/*				var animatedPos = joints[i].pos;
				var animatedOrient = completeQuat(joints[i].quat);
				var thisJoint = joints[i];// not sure what this should be!			
				var parent = anim.hierarchy[i].parent;
	*/			
/*				if (parent < 0) {
					thisJoint.pos = animatedPos;
					thisJoint.quat = [animatedOrient[1], animatedOrient[2], animatedOrient[3]];
				} else {
	
					var parentJoint = joints[parent];
					thisJoint.pos[0] = parentJoint.pos[0] + animatedPos[0];
					thisJoint.pos[1] = parentJoint.pos[1] + animatedPos[1];
					thisJoint.pos[2] = parentJoint.pos[2] + animatedPos[2];
//					thisJoint.quat = [animatedOrient[1], animatedOrient[2], animatedOrient[3]];

/*					var parentJoint = joints[parent];
					var rpos = rotateByQuat(animatedPos, completeQuat(parentJoint.quat));
					thisJoint.pos[0] = rpos[0] + parentJoint.pos[0];
					thisJoint.pos[1] = rpos[1] + parentJoint.pos[1];
					thisJoint.pos[2] = rpos[2] + parentJoint.pos[2];
					*/
					// Concat rotations
	/*				var mulr = mulQuats(completeQuat(parentJoint.quat), animatedOrient);
					mulr = normalizeQuat(mulr);
					thisJoint.quat[0] = mulr[1];
					thisJoint.quat[1] = mulr[2];
					thisJoint.quat[2] = mulr[3];
				}*/
/*				
				if (parentIndex != -1) {
					var rpos = rotateByQuat(joints[i].pos, completeQuat(joints[parentIndex].quat));
					joints[i].pos[0] = rpos[0] + joints[parentIndex].pos[0];
					joints[i].pos[1] = rpos[1] + joints[parentIndex].pos[1];
					joints[i].pos[2] = rpos[2] + joints[parentIndex].pos[2];

					var mulres = mulQuats(completeQuat(joints[parentIndex].quat), completeQuat(joints[i].quat));
					mulres = normalizeQuat(mulres);					
					joints[i].quat = [mulres[1], mulres[2], mulres[3]];
					
//						rotatedPos = rotateByQuat(m.weights[wi].pos, completeQuat(joints[jointindex].quat));

				}
				*/
			}
			
			return joints;
		},
		
		// Weigh vertices according to bones influencing them. We get U and V texture coords as 0-1 by default,
		// so you'll need to provide args to scale & translate them to where you want them to be.
		//
		'computeVertices' : function(meshindex, uscale, utranslate, vscale, vtranslate, joints) {		
			var finalverts = [];
			
//			for (var meshindex=0;meshindex<this.mesh.meshes.length;meshindex++) {				
				// Each vertex gets its final position contributed to by a number of weights.
				// Each weight refers to a joint and gives an offset from that joint for the vertice.
				// Of course, this contribution is weighted by the weight's weight value. 
				// Did I say "weight" often enough yet?
				for (var vi=0; vi<this.mesh.meshes[meshindex].verts.length; vi++) {
					var m = this.mesh.meshes[meshindex];
					var start = m.verts[vi]['weightstart'];
					var len = m.verts[vi]['weightlen'];
					var finalpos = [0, 0, 0];
		//			var totalweight = 0;
					for (var wi=start; wi<start+len; wi++) {
						var jointindex = m.weights[wi]['jointindex'];
	//					alert(jointindex);

						// Orientation of joint is described by a quat.
						// We know i j k components for quat. Solve for w.
//						q = this.mesh.joints[jointindex].quat; // quat without w component
//						w = Math.sqrt(-q[0]*q[0]-q[1]*q[1]-q[2]*q[2]+1); wrong.

						// Not sure why I need to test term for 0.0. Many people seemed to have an issue with this same
						// part, so just working on tips from http://www.doom3world.org/phpbb2/viewtopic.php?t=4618
/*						var term = -q[0]*q[0]-q[1]*q[1]-q[2]*q[2]+1;
						var w = 0.0;
						if (term >= 0.0) {
							w = -Math.sqrt(term);
						}
	*/					
//						w = Math.sqrt(-q[0]*q[0]-q[1]*q[1]-q[2]*q[2]+1);
//						quat = [w, q[0], q[1], q[2]];
//						var rotatedPos = rotateByQuat(m.weights[wi].pos, quat);

						var jointpos, rotatedPos;						
						jointpos = joints[jointindex].pos;
						rotatedPos = rotateByQuat(m.weights[wi].pos, completeQuat(joints[jointindex].quat));
/*
						if (frame === undefined) {
							jointpos = this.mesh.joints[jointindex].pos;
							rotatedPos = rotateByQuat(m.weights[wi].pos, completeQuat(this.mesh.joints[jointindex].quat));
						} else {
												
							var q = completeQuat(frame[jointindex].orient);
							
							// Joint orientation and position mentioned in an animation frame can be copied
							// as-is if the joint has no parent.
							var parentIndex = hierarchy[jointindex].parent;
							if (parentIndex == -1) {
								jointpos = frame[jointindex].pos;
								rotatedPos = rotateByQuat(m.weights[wi].pos, q);
							} else {

								// If had parent, then have to apply parent's rotation and translation to this joint.
									
								parentOrient = completeQuat(frame[parentIndex].pos); 
								parentPos = frame[parentIndex].pos;
		

								jointpos = parentPos;
								rotatedPos = rotateByQuat(m.weights[wi].pos, parentOrient);
								
								
								// Rotate by parent
								
	//							var rpos = rotateByQuat(frame[jointindex].pos, parentOrient);
								
								// Translate by parent
//								rpos[jointpos] = 
							
//								console.log("parentIndex was "+parentIndex);
							}
						}
*/
						// w*w+i*i+j*j+k*k = 1
						// w*w = 1 - i*i - j*j - k*k
						// w = +-sqrt(1 - i*i - j*j - k*k)
						// ah but if I take sqrt of both sides, then w is +- the result!
						
						
//function rotateByQuat(v, q) {

						for (var i=0; i<3; i++) {
//							finalpos[i] += (jointpos[i] + m.weights[wi].pos[i]) * m.weights[wi]['weightvalue'];
							finalpos[i] += (jointpos[i] + rotatedPos[i]) * m.weights[wi]['weightvalue'];
						}
	//					totalweight += m.weights[wi]['weightvalue'];
					}
	//				alert(totalweight);
					finalverts.push(
						[finalpos[0], finalpos[1], finalpos[2], 
						m.verts[vi]['u']*uscale + utranslate, m.verts[vi]['v']*vscale + vtranslate]);
				}
	//		}

			return finalverts;
		}		
	};
};
