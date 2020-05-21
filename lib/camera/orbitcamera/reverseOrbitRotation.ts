import { quat, vec3, mat4 } from "gl-matrix";


const cameraWorldPosition = vec3.create();
const rotationVector = vec3.create();
const reverseMatrix = mat4.create();
const moveToPivot = mat4.create();
const reverseRotation = mat4.create();
const inverseRotation = quat.create();


/**
 * Get the initial camera position for a different rotation pivot.
 * Maintains current position and orientation (no change in perspective projection)
 *
 * @param out
 * @param cameraMatrix - current camera-matrix of current pivot
 * @param rotation - current rotation quaternion
 * @param pivot - new pivot
 * @return initial camera position for changed pivot
 */
export default function reverseOrbitRotation(out: vec3, cameraMatrix: mat4, rotation: quat, pivot: vec3): vec3 {
    mat4.getTranslation(cameraWorldPosition, cameraMatrix);
    mat4.fromTranslation(moveToPivot, pivot);
    quat.conjugate(inverseRotation, rotation)
    mat4.fromQuat(reverseRotation, inverseRotation);
    vec3.subtract(rotationVector, cameraWorldPosition, pivot);

    // set origin to rotation vector (pivot -> camera-world-position)
    mat4.fromTranslation(reverseMatrix, rotationVector);
    // revert all rotations back to angles 0,0,0
    mat4.multiply(reverseMatrix, reverseRotation, reverseMatrix);
    // then move rotation-vector back to pivot (pivot -> camera-position)
    mat4.multiply(reverseMatrix, moveToPivot, reverseMatrix);
    // return new initial position
    return mat4.getTranslation(out, reverseMatrix);
}
