/* eslint no-magic-numbers: "off" */
import "mocha";
import { strict as assert } from "assert";
import { vec3 as v, glMatrix } from "gl-matrix";
glMatrix.setMatrixArrayType(Array);
import intersectRayPlane from "../../../lib/math/intersectRayPlane";


describe("intersectRayPlane", () => {

    it("should return point of intersection, when origin at center", () => {
        // center -> below center
        const planeNormal = v.fromValues(0, 0, 1);
        const point = intersectRayPlane(v.create(),
            v.fromValues(0, 0, 0), // origin
            v.fromValues(0, 0, -1), // direction
            planeNormal,
            -v.dot(planeNormal, v.fromValues(0, 0, -2))
        );
        assert.deepEqual(point, [0, 0, -2]);
    });

    it("should return point of intersection, when origin above center", () => {
        // above center -> below center
        const planeNormal = v.fromValues(0, 0, 1);
        const point = intersectRayPlane(v.create(),
            v.fromValues(0, 0, 1), // origin
            v.fromValues(0, 0, -1), // direction
            planeNormal,
            -v.dot(planeNormal, v.fromValues(0, 0, -2))
        );
        assert.deepEqual(point, [0, 0, -2]);
    });

    it("should return point of intersection, when origin below center", () => {
        // below center -> below center
        const planeNormal = v.fromValues(0, 0, 1);
        const point = intersectRayPlane(v.create(),
            v.fromValues(0, 0, -1), // origin
            v.fromValues(0, 0, -1), // direction
            planeNormal,
            -v.dot(planeNormal, v.fromValues(0, 0, -2))
        );
        assert.deepEqual(point, [0, 0, -2]);
    });

    it("should return point of intersection, when plane at center", () => {
        // above center -> center
        const planeNormal = v.fromValues(0, 0, -1);
        const point = intersectRayPlane(v.create(),
            v.fromValues(0, 0, 1), // origin
            v.fromValues(0, 0, -1), // direction
            planeNormal,
            -v.dot(planeNormal, v.fromValues(0, 0, 0))
        );
        assert.deepEqual(point, [0, 0, 0]);
    });

    it("should return point of intersection, when plane above center", () => {
        // above center -> above center
        const planeNormal = v.fromValues(0, 0, 1);
        const point = intersectRayPlane(v.create(),
            v.fromValues(0, 0, 2), // origin
            v.fromValues(0, 0, -1), // direction
            planeNormal,
            -v.dot(planeNormal, v.fromValues(0, 0, 1))
        );
        assert.deepEqual(point, [0, 0, 1]);
    });

    it("should fail, when normals point in same direction", () => {
        const planeNormal = v.fromValues(0, 0, 1);
        const point = intersectRayPlane(v.create(),
            v.fromValues(0, 0, 0), // origin
            v.fromValues(0, 0, 1), // direction
            planeNormal,
            -v.dot(planeNormal, v.fromValues(0, 0, -2))
        );
        assert.deepEqual(point, null);
    });

    it("should fail, when distance has wrong direction", () => {
        const planeNormal = v.fromValues(0, 0, 1);
        const point = intersectRayPlane(v.create(),
            v.fromValues(0, 0, 0), // origin
            v.fromValues(0, 0, -1), // direction
            planeNormal,
            v.dot(planeNormal, v.fromValues(0, 0, -2))
        );
        assert.deepEqual(point, null);
    });

    it("should fail, when normals point in wrong direction", () => {
        const planeNormal = v.fromValues(0, 0, -1);
        const point = intersectRayPlane(v.create(),
            v.fromValues(0, 0, 0), // origin
            v.fromValues(0, 0, 1), // direction
            planeNormal,
            -v.dot(planeNormal, v.fromValues(0, 0, -2))
        );
        assert.deepEqual(point, null);
    });
});
