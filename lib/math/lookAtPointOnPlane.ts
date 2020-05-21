import intersectRayPlane from "./intersectRayPlane";
import { glMatrix, vec3 as v } from "gl-matrix";
const nullVector = v.create();


export default function lookAtPointOnPlane(out: v, position: v, rotation: v): null|v {
    const cam = v.clone(position);
    v.negate(cam, cam);

    const sideOfCam = cam[2]/Math.abs(cam[2]);

    const lookAtDirection = v.fromValues(0, 0, -sideOfCam);
    v.rotateX(lookAtDirection, lookAtDirection, nullVector, -glMatrix.toRadian(rotation[0]));
    v.rotateZ(lookAtDirection, lookAtDirection, nullVector, -glMatrix.toRadian(rotation[2]));

    const planeNormal = v.fromValues(0, 0, sideOfCam);
    const lookAtPoint = intersectRayPlane(v.create(), cam, lookAtDirection, planeNormal, 0);

    if (lookAtPoint == null) {
        console.log("failed point calc", cam);
    }

    return lookAtPoint;
}
