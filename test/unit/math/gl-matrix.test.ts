/* eslint no-magic-numbers: "off" */
import "mocha";
import { strict as assert } from "assert";
import { quat, vec3 as v, glMatrix } from "gl-matrix";

const ALMOST_ZERO = 0.0000000000001;

describe.only("gl-matrix", () => {
    describe("rotation using quarternions", () => {

        it("should rotate vector around x-axis 90deg", () => {
            const vector = v.fromValues(0, 1, 0);
            const rotation = quat.create();
            quat.rotateX(rotation, rotation, glMatrix.toRadian(90));
            v.transformQuat(vector, vector, rotation);

            assert.equal(vector[0], 0, "x should have no component");
            assert.ok(Math.abs(vector[1]) < ALMOST_ZERO, "y should be close to 0");
            assert.equal(vector[2], 1, "vector should point to z");
        });

        it("should rotate vector around x-axis 45deg", () => {
            const vector = v.fromValues(0, 1, 0);
            const rotation = quat.create();
            quat.rotateX(rotation, rotation, glMatrix.toRadian(45));
            v.transformQuat(vector, vector, rotation);

            assert.equal(vector[0], 0, "x should have no component");
            assert.ok(Math.abs(vector[1] - vector[2]) < ALMOST_ZERO, "x and y component should be equal");
        });

        it("should not rotate x-vector around x-axis", () => {
            const vector = v.fromValues(1, 0, 0);
            const rotation = quat.create();
            quat.rotateX(rotation, rotation, glMatrix.toRadian(45));
            v.transformQuat(vector, vector, rotation);

            assert.deepEqual(vector, [1, 0, 0]);
        });
    });
});
