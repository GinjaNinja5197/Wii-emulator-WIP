function torad(degree) {
	return degree/180*Math.PI;	
}

/*
 * Quaternion routines copied from various places over the interwebs. I don't pretend to understand these,
 * except as a user of their awesomeness.
 */

// Quaternions are just represented as javascript vectors with four elements q0 q1 q2 q3 (q0 is the real part).
// "conversion" @ http://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles 
//
function eulerToQuat(rotX, rotY, rotZ) {
	return [
		Math.cos(rotX/2)*Math.cos(rotY/2)*Math.cos(rotZ/2) + Math.sin(rotX/2)*Math.sin(rotY/2)*Math.sin(rotZ/2),
		Math.sin(rotX/2)*Math.cos(rotY/2)*Math.cos(rotZ/2) - Math.cos(rotX/2)*Math.sin(rotY/2)*Math.sin(rotZ/2),
		Math.cos(rotX/2)*Math.sin(rotY/2)*Math.cos(rotZ/2) + Math.sin(rotX/2)*Math.cos(rotY/2)*Math.sin(rotZ/2),
		Math.cos(rotX/2)*Math.cos(rotY/2)*Math.sin(rotZ/2) - Math.sin(rotX/2)*Math.sin(rotY/2)*Math.cos(rotZ/2)
	];
}

// Rotates vector v by quaternion q. Vector is a three-place javascript array, quaternion a four-place one. Returned
// value is a three-place javascript array describing the result vector.
// "pseudo-code for rotating using a quaternion" @ http://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation
//
function rotateByQuat(v, q) {
	var a = q[0];
	var b = q[1];
	var c = q[2];
	var d = q[3];
	var v1 = v[0];
	var v2 = v[1];
	var v3 = v[2];
	var t2 = a*b;
	var t3 = a*c;
	var t4 = a*d;
	var t5 = -b*b;
	var t6 = b*c;
	var t7 = b*d;
	var t8 = -c*c;
	var t9 = c*d;
	var t10 = -d*d;
	return [
		2*( (t8 + t10)*v1 + (t6 -  t4)*v2 + (t3 + t7)*v3 ) + v1,
		2*( (t4 +  t6)*v1 + (t5 + t10)*v2 + (t9 - t2)*v3 ) + v2,
		2*( (t7 -  t3)*v1 + (t2 +  t9)*v2 + (t5 + t8)*v3 ) + v3
	];
}

// Given a four-place quat, returns it normalized.
//
function normalizeQuat(q) {
	var magnitude = Math.sqrt(q[0]*q[0] + q[1]*q[1] + q[2]*q[2] + q[3]*q[3]);
	return [
		q[0]/magnitude,
		q[1]/magnitude,
		q[2]/magnitude,
		q[3]/magnitude
	];
}

// Rotates vector v by quat q in the opposite direction.
//
// "the conjugation operation" @ http://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation
// "the inverse of a unit quaternion is obtained simply by changing the sign of its imaginary components"
function unrotateByQuat(v, q) {
	var inverse = [q[0], -q[1], -q[2], -q[3]];
	return rotateByQuat(v, inverse);
}

// Given a three-place quat with the real value missing, returns a four-place quat with real (w) computed as first value.
// From http://tfc.duke.free.fr/coding/md5-specs-en.html
function completeQuat(q) {
	var term = -q[0]*q[0]-q[1]*q[1]-q[2]*q[2]+1;
	var w = 0.0;
	if (term >= 0.0) {
		w = -Math.sqrt(term);
	}
	return [w, q[0], q[1], q[2]];
}

// Returns new quat as result of multiplying the quats a and b. Not commutative.
// From http://tfc.duke.free.fr/coding/md5-specs-en.html
// Double-checked against http://www.gamedev.net/reference/programming/features/qpowers/page5.asp
function mulQuats(a,b) {
	return [(a[0] * b[0]) - (a[1] * b[1]) - (a[2] * b[2]) - (a[3] * b[3]),
			(a[1] * b[0]) + (a[0] * b[1]) + (a[2] * b[3]) - (a[3] * b[2]),
			(a[2] * b[0]) + (a[0] * b[2]) + (a[3] * b[1]) - (a[1] * b[3]),
			(a[3] * b[0]) + (a[0] * b[3]) + (a[1] * b[2]) - (a[2] * b[1])];
}

