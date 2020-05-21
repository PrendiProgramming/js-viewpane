import { vec3 } from "gl-matrix";
import ray, { Camera } from "./ray";


const fromPoint = vec3.create();
const toPoint = vec3.create();
const inputDelta = vec3.create();


/**
 * Returns a camera translation, moving along "the plane", from two points on screen (user input).
 * Note: points on screen must have their origin in viewport-center (camera-center)
 * @param out
 * @param fromClick - the starting point of the translation on screen. Point origin must be screen-center (camera 0)
 * @param toClick - the end point of the translation on screen. Point origin must be screen-center (camera 0)
 * @param camera
 * @return movement vector for camera-position
 */
export default function orbitTranslation(out: vec3, camera: Camera, fromClick: vec3, toClick: vec3): vec3 {
    const userDelta = vec3.subtract(inputDelta, fromClick, toClick);
    if (userDelta[0] === 0 && userDelta[1] === 0) {
        return vec3.create();
    }
    // use ray helper to get point on plane
    ray(fromPoint, camera, fromClick);
    ray(toPoint, camera, toClick);
    vec3.subtract(out, toPoint, fromPoint);
    // move the camera, not the plane
    return vec3.negate(out, out);
}
