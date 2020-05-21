import { quat, vec3 as v, mat4 } from "gl-matrix";
import orbitRotation from "./orbitRotation";
import orbitCameraMatrix from "./orbitCameraMatrix";
import getPointOnMap from "./getPointOnMap";
import reverseOrbitRotation from "./reverseOrbitRotation";
import RubberVec3 from "../RubberVec3";


/**
 * Camera rotating around z- and x-axis for tilt and turn movements
 */
export default class OrbitCamera {
    readonly eye: v;
    /** camera-matrix, invert for view-matrix */
    readonly cameraMatrix = mat4.create();
    /** view-matrix for `mat4.multiply(model, object, viewMatrix)` */
    readonly viewMatrix = mat4.create();
    /** point of rotation on plane - note: default plane center always lies on 0,0,0 */
    readonly rotationCenter = v.create();
    /** camera rotation only */
    readonly rotationQuat = quat.create();

    #isDirty = true;
    /** current unrotated camera position */
    #position: v;
    /** current camera rotation */
    #rotation = new RubberVec3();

    /**
     * @param [position] - camera position
     * @param [eye] - user position, basically [0, 0, perspective]
     */
    constructor(position = v.fromValues(0, 0, 0), eye = v.fromValues(0, 0, 1000)) {
        this.#position = position;
        this.eye = eye;
    }

    /** rotation vector in degree - using x (tilt) and z (rotate) only */
    rotate(rotation: v): void {
        this.#isDirty = true;
        this.#rotation.add(rotation);
    }

    translate(movement: v): void {
        this.#isDirty = true;
        v.add(this.#position, this.#position, movement);
    }

    removeRubberband(): void {
        this.#isDirty = true;
        this.#rotation.remove();
    }

    /**
     * change pivot of rotation
     * @param origin - rotation center in screen coordinates, where origin is at viewport center
     */
    setRotationCenter(origin: v): void {
        this.calculate(); // ensure viewMatrix is up to date
        this.#isDirty = true;
        // find world rotation center from user-input and set it as rotation center
        const rotationCenter = getPointOnMap(this.rotationCenter, this, origin);
        // set initial camera position to new pivot
        reverseOrbitRotation(this.#position, this.cameraMatrix, this.rotationQuat, rotationCenter);
    }

    calculate(force?: boolean): void {
        if (this.#isDirty === false && force !== true) {
            return;
        }
        this.#isDirty = false;
        const { cameraMatrix, rotationQuat, rotationCenter: pivot } = this;
        orbitRotation(rotationQuat, this.#rotation.rubber);
        orbitCameraMatrix(cameraMatrix, this.#position, rotationQuat, pivot);
        mat4.invert(this.viewMatrix, cameraMatrix);
    }
}
