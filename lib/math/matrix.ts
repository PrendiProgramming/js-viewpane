import { vec3 as v, mat4 } from "gl-matrix";


export function getLeftVector(out = v.create(), matrix: mat4): v {
    return v.set(out, matrix[0], matrix[4], matrix[8]);
}

export function getUpVector(out = v.create(), matrix: mat4): v {
    return v.set(out, matrix[1], matrix[5], matrix[9]);
}

export function getForwardVector(out = v.create(), matrix: mat4): v {
    return v.set(out, matrix[8], matrix[9], matrix[10]);
}

export function getTranslation(out = v.create(), matrix: mat4): v {
    return mat4.getTranslation(out, matrix);
}
