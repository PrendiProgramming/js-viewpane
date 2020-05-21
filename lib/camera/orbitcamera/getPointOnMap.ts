import { vec3, mat4, quat } from "gl-matrix";
import intersectRayPlane from "../../math/intersectRayPlane";


export interface Camera {
    eye: vec3;
    viewMatrix: mat4;
    rotationQuat: quat;
}


const ORIGIN = vec3.create();
const direction = vec3.create();
const planePosition = vec3.create();
const planeToCamNormal = vec3.fromValues(0, 0, 1);
const planeNormal = vec3.create();
const inverseRotation = quat.create();


/**
 * Get intersection of a click with the plane in plane-space. Passing half map-
 * dimenension, the coordinates will be offset, so that a intersection point of
 * 0/0 corresponds to the upper-left corner of the planes bitmap.
 *
 * @param out
 * @param camera
 * @param clickTarget - user input in screen coordinates, where origin is at viewport center
 * @param [mapDimensions] - half map dimensions, defaults to [0, 0, 0]
 * @return
 */
export default function getPointOnMap(out: vec3, camera: Camera, clickTarget: vec3, mapDimensions = ORIGIN): vec3 {
    // click direction from screen or eye position
    vec3.subtract(direction, clickTarget, camera.eye);
    vec3.normalize(direction, direction);

    /* same as the following
    // vec3.rotateX(planeNormal, planeToCamNormal, ORIGIN, toRadian(-camera.rotation[0]));
     */
    quat.conjugate(inverseRotation, camera.rotationQuat);
    vec3.transformQuat(planeNormal, planeToCamNormal, inverseRotation);

    mat4.getTranslation(planePosition, camera.viewMatrix);
    // plane distance from origin
    const distance = -vec3.dot(planeNormal, planePosition);
    // point on rotated plane
    // clickTarget and eye-position are interchangable (z-offset does not count)
    const targetOnPlane = intersectRayPlane(out, camera.eye, direction, planeNormal, distance);

    // resolve from point on plane to point on 2d-map
    const targetOnMap = targetOnPlane;
    // vector from plane-center to target
    vec3.subtract(targetOnMap, targetOnMap, planePosition);

    /* same as the following
    // rotate vector back into z=0
    // vec3.rotateX(targetOnMap, targetOnMap, ORIGIN, toRadian(camera.rotation[0]));
    // // within map rotate around z to revert camera turn-rotation
    // vec3.rotateZ(targetOnMap, targetOnMap, ORIGIN, toRadian(camera.rotation[2]));
    */
    // rotate vector back into z=0 (x-rotation) and orient z-rotation to correct map position
    vec3.transformQuat(targetOnMap, targetOnMap, camera.rotationQuat);

    targetOnMap[2] = 0; // ensure we are exactly on z=0-plane
    // and move point to map-coordinates
    return vec3.add(out, out, mapDimensions);
}
