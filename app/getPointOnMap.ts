import intersectRayPlane from "../lib/math/intersectRayPlane";
import { vec3 as v, glMatrix } from "gl-matrix";
const { toRadian }  = glMatrix;
const UNIT = v.create();
const bound = document.querySelector(".viewport").getBoundingClientRect();
const screenOffset = v.fromValues(bound.width / 2, bound.height / 2, 0);
const EYE = v.fromValues(0, 0, 1000);


// click target on screen
function getClickTarget(out: v, pointOnScreen: v, toOrigin = screenOffset) {
    return v.set(out, pointOnScreen[0] - toOrigin[0], pointOnScreen[1] - toOrigin[1], 0);
}

function getClickDirection(out: v, clickTarget: v, perspective = 1000) {
    v.set(out, clickTarget[0], clickTarget[1], -perspective);
    return v.normalize(out, out);
}


export default function getPointOnMap(out: v, point: v, camera) {
    // click target on screen
    const target = getClickTarget(v.create(), point, screenOffset);
    // click direction from screen or eye position
    const direction = getClickDirection(v.create(), target, EYE[2]);

    // initial plane orientation
    const planeNormal = v.fromValues(0, 0, 1);
    v.rotateX(planeNormal, planeNormal, UNIT, toRadian(-camera.rotation[0]));
    const planePosition = v.negate(v.create(), camera.position);
    // plane distance from origin
    const distance = -v.dot(planeNormal, planePosition);
    // point on rotated plane
    const targetOnPlane = intersectRayPlane(
        out,
        EYE, // click-target and EYE-position are interchangable (z-offset does not count)
        direction,
        planeNormal,
        distance
    );

    // resolve from point on plane to point on 2d-map
    const targetOnMap = targetOnPlane;
    // vector from plane-center to target
    v.subtract(targetOnMap, targetOnMap, planePosition);
    // rotate vector back into z=0
    v.rotateX(targetOnMap, targetOnMap, UNIT, toRadian(camera.rotation[0]));
    // within map rotate around z to revert camera turn-rotation
    v.rotateZ(targetOnMap, targetOnMap, UNIT, toRadian(camera.rotation[2]));
    // and move point to map-coordinates
    v.add(targetOnMap, targetOnPlane, [1000, 650, 0]);
    return targetOnMap;
}
