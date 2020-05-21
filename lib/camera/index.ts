import * as math from "../math";
import { quat, vec3 as v, mat4, glMatrix } from "gl-matrix";
const { toRadian } = glMatrix;
const { PI } = Math;
const toDegree = (v: number): number => v * 180/PI;
const UP_VECTOR = v.fromValues(0, -1, 0);
const ORIGIN = v.create();


export interface Options {
    perspective?: number;
}

export const defaultOptions = {
    perspective: 1000
}

const assert = (truthy, message) => { if (!truthy) { throw new Error(message) } };
const toS = (vec: v): string => `(${vec.map(vec => vec.toFixed(2)).join(",")})`;


export function getAxes(direction: v) {
    const view = v.normalize(v.create(), direction);
    const right = v.cross(v.create(), UP_VECTOR, view);
    right[2] = 0;
    v.normalize(right, right);
    const up = v.cross(v.create(), right, view);
    up[0] = 0;
    v.normalize(up, up);
    return { view, up, right };
}

export default class Camera {
    options: Options;
    $viewport: HTMLElement;
    $camera: HTMLElement;
    entities: Array<HTMLElement>;
    position = v.fromValues(0, 0, 1000);
    cameraMatrix = mat4.create();
    viewMatrix = mat4.create();
    // direction = v.fromValues(0, .25, -.75);
    direction = v.fromValues(0, 0, -1);
    up = v.fromValues(0, 1, 0);
    left = v.fromValues(1, 0, 0);

    constructor($viewport: HTMLElement, $camera: HTMLElement, options: Options) {
        this.$viewport = $viewport;
        this.$camera = $camera;
        this.options = { ...defaultOptions, ...options };
        this.entities = Array.from($camera.children) as Array<HTMLElement>;
        this.entities.forEach(e => {
            let position = v.create();
            if (e.hasAttribute("data-position")) {
                position = JSON.parse(e.getAttribute("data-position"));
            }
            // @ts-ignore
            e.position = position;
        });

        // setup
        console.log(this.options);
        $viewport.style.perspective = `${this.options.perspective}px`;
        this.position[2] = this.options.perspective;
        $camera.style.cssText = "position: absolute; top: 50%; left: 50%; transform-style: preserve-3d;"

        this.calculate();
        this.render();
    }

    render(): void {
        const { entities, viewMatrix } = this;
        for (let i = 0, l = entities.length; i < l; i += 1) {
            // @ts-ignore
            const model = mat4.fromTranslation(mat4.create(), entities[i].position);
            mat4.multiply(model, model, viewMatrix);
            entities[i].style.transform = `matrix3d(${model.join(",")})`;
        }
    }


    calculate(): void {
        const { cameraMatrix, viewMatrix, position, direction } = this;
        const center = v.add(v.create(), position, direction);

        // targetTo = lookAt (but opengl behaves different) https://github.com/toji/gl-matrix/issues/225
        // => lookAt produces viewMatrix (inverse of targetTo)
        mat4.targetTo(cameraMatrix, position, center, this.up);
        mat4.invert(viewMatrix, cameraMatrix);
        // mat4.lookAt(viewMatrix, position, center, up);
    }



    getLookAt(center: v) {
        const { position: pos } = this;
        const dir = v.subtract(v.create(), center, pos);
        v.normalize(dir, dir);
        const right = v.cross(v.create(), dir, UP_VECTOR);
        const up = v.cross(v.create(), dir, right);

        const lookAtMatrix: mat4 = [
            right[0], right[1], right[2], 0,
            up[0], up[1], up[2], 0,
            dir[0], dir[1], dir[2], 0,
            // pos[0], pos[1], pos[2], 1
            0, 0, 0, 1
        ];

        return lookAtMatrix
    }

    rotation = v.create();

    // http://paulbourke.net/geometry/rotate/
    // https://stackoverflow.com/questions/6721544/circular-rotation-around-an-arbitrary-axis
    rotateAround(rotation: v, lookAt: v): void {
        v.add(this.rotation, this.rotation, rotation);
        this.rotation = this.rotation.map(deg => deg % 360) as v;
        const centerToCam = v.subtract(v.create(), this.position, lookAt);

        // looktAt * object => camera
        // const lookAtM = this.getLookAt(lookAt);
        // const toWorld = mat4.invert(mat4.create(), lookAtM);
        // v.transformMat4(centerToCam, centerToCam, toWorld);

        // const rotateM = mat4.create();
        // mat4.rotateX(rotateM, rotateM, toRadian(-rotation[0]));
        // mat4.rotateZ(rotateM, rotateM, toRadian(rotation[2]));

        // const resultM = mat4.multiply(mat4.create(), lookAtM, rotateM);
        // v.transformMat4(centerToCam, centerToCam, resultM);


        // update position
        // v.add(this.position, centerToCam, lookAt);
        // // update direction vector
        // v.negate(this.direction, centerToCam);

        // rotate camera around lookAt point
        const quatIdent = quat.create();
        const rotationTransformation = quat.create();
        quat.rotateX(rotationTransformation, rotationTransformation, toRadian(-rotation[0]));
        quat.rotateZ(rotationTransformation, rotationTransformation, toRadian(rotation[2]));
        // this would tilt cam, but we want to turn it @see below
        v.transformQuat(centerToCam, centerToCam, rotationTransformation);
        // update position
        v.add(this.position, centerToCam, lookAt);

        // update direction vector
        v.negate(this.direction, centerToCam);


        // its all about the up vector. why does this influence position? wtf
        const turnTransformation = quat.create();
        // quat.rotateX(turnTransformation, turnTransformation, toRadian(-rotation[0]));
        quat.rotateZ(turnTransformation, turnTransformation, toRadian(rotation[2]));
        v.transformQuat(this.up, this.up, turnTransformation);
        v.normalize(this.up, this.up);


        const { up } = getAxes(this.direction);
        this.up = up;
    }

    /* look around
        quat.rotateY(rotationTransformation, rotationTransformation, toRadian(rotation[2]));
        quat.rotateX(rotationTransformation, rotationTransformation, toRadian(-rotation[0]));
        v.transformQuat(this.direction, this.direction, rotationTransformation); */
    rotate(rotation: v): void {
        const { direction } = this;
        const rotationTransformation = quat.create();
        quat.rotateX(rotationTransformation, rotationTransformation, toRadian(-rotation[0]));
        quat.rotateZ(rotationTransformation, rotationTransformation, toRadian(rotation[2]));
        v.transformQuat(this.direction, this.direction, rotationTransformation);
    }

    translate(position: v): v {
        return v.add(this.position, this.position, position);
    }

    getForward(out?: v): v { return math.matrix.getForwardVector(out, this.cameraMatrix); }
    getUp(out?: v): v { return math.matrix.getUpVector(out, this.cameraMatrix); }
    getLeft(out?: v): v { return math.matrix.getLeftVector(out, this.cameraMatrix); }
}
