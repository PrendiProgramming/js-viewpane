import { vec3, mat4, quat } from "gl-matrix";
import intersectRayPlane from "../../math/intersectRayPlane";


const clickDirection = vec3.create();
const planePosition = vec3.create();
const planeNormal = vec3.create();
const PLANE_NORMAL = vec3.fromValues(0, 0, 1);
const rotation = quat.create();


export interface Camera {
    eye: vec3;
    /** inverse of camera-matrix */
    viewMatrix: mat4;
    /** euler-rotation quaternion of camera (matrix) */
    rotationQuat: quat;
}


/**
 * Get intersection of a click with the plane in world-space.
 *
 * @param out
 * @param camera
 * @param clickTarget - user input in screen coordinates, where origin is at viewport center
 * @return intersection point from origin (0/0/0) in world-coorinates
 */
export default function ray(out: vec3, camera: Camera, clickTarget: vec3): vec3 {
    // clickTarget is in screen/camera-space
    vec3.subtract(clickDirection, clickTarget, camera.eye);
    vec3.normalize(clickDirection, clickDirection);

    // center is at origin, camera offset is from origin
    mat4.getTranslation(planePosition, camera.viewMatrix);
    // invert camera rotation
    quat.conjugate(rotation, camera.rotationQuat);
    // rotate plane normal to world
    vec3.transformQuat(planeNormal, PLANE_NORMAL, rotation);

    // plane distance from origina
    const distance = -vec3.dot(planeNormal, planePosition);
    // point on plane in world-space
    return intersectRayPlane(out, camera.eye, clickDirection, planeNormal, distance);
}
