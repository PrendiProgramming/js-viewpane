import { vec3 as v, mat4 } from "gl-matrix";

type CustomElement = {
    position: v;
}

type WorldElement = CustomElement & HTMLElement;


export default class Scene {
    entities: Array<WorldElement>;

    constructor($camera: HTMLElement) {
        // this.entities = Array.from($camera.children) as Array<WorldElement>;
        this.entities = [$camera.querySelector(".world")];
        this.entities.forEach(e => {
            let position = v.create();
            if (e.hasAttribute("data-position")) {
                position = JSON.parse(e.getAttribute("data-position"));
            }
            e.position = position;
        });
    }

    render(viewMatrix: mat4) {
        const { entities } = this;
        for (let i = 0, l = entities.length; i < l; i += 1) {
            const model = mat4.fromTranslation(mat4.create(), entities[i].position);
            mat4.multiply(model, model, viewMatrix);
            entities[i].style.transform = `matrix3d(${model.join(",")})`;
        }
    }
}



