import { vec3 as v } from "gl-matrix";


export default function getZWhereSizeFitsViewport(eye: v, size: number, viewportSize: number): number {
    return eye[2] - eye[2] * (size / viewportSize);
}
