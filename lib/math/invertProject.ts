import { vec3 as v } from "gl-matrix";
import zoomAt from "./zoomAt";


export default function invertProject(out, vector: v, eye, zPosition): v {
    v.copy(out, vector);
    vector[2] = 0;
    return zoomAt(out, out, eye, this, zPosition);
}
