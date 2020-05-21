import { vec3 as v } from "gl-matrix";
const { dot, create, scale, copy, add } = v;


/**
 * get the intersection point of a ray and a plane defined by a normal and its distance from origin
 * the distance of the plane is calculated by `-vec3.dot(planeNormal, planeCenterPosition)`
 * @param out resulting point of intersection
 * @param rayOrigin point of ray
 * @param rayDirection normalized direction of ray
 * @param planeNormal normal of plane
 * @param dist      distance of plane from origin `-vec3.dot(planeNormal, planeCenterPosition)`
 */
export default function intersectRayPlane(out: v, rayOrigin: v, rayDirection: v, planeNormal: v, dist = 0): null|v {
    const denom = dot(rayDirection, planeNormal);
    const v0 = create();
    if (denom !== 0) {
        const t = -(dot(rayOrigin, planeNormal) + dist) / denom;
        if (t < 0) {
            return null;
        }
        scale(v0, rayDirection, t);
        return add(out, rayOrigin, v0);
    } else if (dot(planeNormal, rayOrigin) + dist === 0) {
        return copy(out, rayOrigin);
    }
    return null;
}
