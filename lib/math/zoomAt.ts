import { vec3 as v } from "gl-matrix";


// move by z at point2D in camera direction
export default function zoomAt(out: v, vector: v, eye: v, point2D: v, zTranslation: number): v {
    const rz = zTranslation / eye[2];
    // move given point in direction of eye view
    return v.set(out,
        vector[0] + (eye[0] - point2D[0]) * rz,
        vector[1] + (eye[1] - point2D[1]) * rz,
        vector[2] + zTranslation
    );
}
