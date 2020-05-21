import { quat, vec3, glMatrix } from "gl-matrix";
const { toRadian } = glMatrix;


/**
 * Create a camera orbit-rotation quaternion. Rotation angles are given in degrees.
 *
 * Usage:
 * ```js
 * const rotation = orbitRotation(quat.create(), v.fromValues())
 * const rotationMatrix = mat4.fromQuat(mat4.create(), rotation);
 * ```
 *
 * @param  out
 * @param  rotation - rotation ngles in degrees, where x = turn, z = tilt. y is ignored
 */
export default function orbitRotation(out: quat, rotation: vec3): quat {
    // the following is equal to:
    // return quat.fromEuler(out, rotation[0], 0, rotation[2]);

    // update our rotation quaternion
    quat.identity(out);
    // start with z-rotation only, which should always be performed on initial z-axis
    quat.rotateZ(out, out, toRadian(rotation[2]));
    // then add x-rotation, being applied in current view direction
    return quat.rotateX(out, out, toRadian((rotation[0])));
}
