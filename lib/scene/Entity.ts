import { vec3 as v, mat4 } from "gl-matrix";
import Camera from "./Camera";


/**
 * world representation - manages positioning and rotation for included objects.
 */
export default class ViewpaneEntity {
    element: HTMLElement;
    style: CSSStyleDeclaration;
    position: v;
    rotation: v;
    transform: string;

    modelMatrix: mat4;
    readonly modelViewMatrix: mat4;

    constructor(element: HTMLElement) {
        this.element = element;
        this.style = element.style;
        this.position = v.create();
        this.rotation = v.create();
        this.modelMatrix = mat4.create();
        this.modelViewMatrix = mat4.create();
    }

    calculate(camera: Camera): void {
        const { modelMatrix, modelViewMatrix } = this;

        // mat4.translate(modelViewMatrix, modelMatrix, v.fromValues(camera.eye[0], camera.eye[1], 0));
        mat4.multiply(modelViewMatrix, modelViewMatrix, camera.viewMatrix);

        this.transform = `matrix3d(${modelViewMatrix.join(",")})`;
    }

    render(): void {
        const { transform } = this;
        // this.style.webkitTransform = transform;
        // // @ts-ignore
        // this.style.mozTransform = transform;
        this.style.transform = transform;
    }

    dispose(): void {
        this.transform = "";
        this.render();
    }
}
