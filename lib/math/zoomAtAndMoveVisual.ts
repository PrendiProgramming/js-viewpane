import { vec3 as v } from "gl-matrix";


export default function zoomAtAndMoveVisual(out: v, vector: v, eye: v, origin: v, movement: v): v {
    v.copy(out, vector);
    // zoomAt
    let rz = movement[2] / eye[2];
    out[0] += (eye[0] - origin[0]) * rz;
    out[1] += (eye[1] - origin[1]) * rz;
    out[2] += movement[2];
    // move Visual
    rz = out[2] / eye[2];
    out[0] += movement[0] * (1 - rz);
    out[1] += movement[1] * (1 - rz);
    return this;
}
