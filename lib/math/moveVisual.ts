import { vec3 as v } from "gl-matrix";


export default function moveVisual(out: v, vector: v, eye: v, movement: v): v {
    const rz = this.z / eye[2];
    this.x += movement[0] * (1 - rz);
    this.y += movement[1] * (1 - rz);
    return this;
}
