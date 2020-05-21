import { quat, vec3, mat4 } from "gl-matrix";


const ORIGIN = vec3.create();
const moveToPivot = mat4.create();
const rotateAroundPivot = mat4.create();
const pivotToCamera = vec3.create();


/**
 * Create the camera-matrix for an orbit rotation around a given pivot
 * @param  out - camera-matrix
 * @param  position - position of camera
 * @param  rotation - quaternion of orbit rotation (@see orbitRotation)
 * @param  [pivot] - center of rotation. Defaults to origin
 */
export default function orbitCameraMatrix(out: mat4, position: vec3, rotation: quat, pivot = ORIGIN): mat4 {
    mat4.fromTranslation(moveToPivot, pivot);
    mat4.fromQuat(rotateAroundPivot, rotation);
    vec3.subtract(pivotToCamera, position, pivot);

    // move position, so that rotation point is on origin `pivot -> camera`
    mat4.fromTranslation(out, pivotToCamera);
    // rotate camera around pivot `rotate(pivot -> camera)`
    mat4.multiply(out, rotateAroundPivot, out);
    // revert from origin `origin -> camera`
    return mat4.multiply(out, moveToPivot, out);
}
