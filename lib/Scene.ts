import Loop from "./common/loop";
import Camera from "./scene/Camera";
import layoutService from "./service/layoutService";
import withObservable from "./common/withObservable";
import { ObserverNotify, ObserverAdd, ObserverRemove} from "./types";
import Entity from "./scene/Entity";

export enum EVENT {
    UPDATE = "onUpdate",
    RENDER = "onRender"
}


export default class Scene {
    camera: Camera;
    entities: Array<Entity>;
    notify: ObserverNotify<EVENT>;
    addObserver: ObserverAdd<EVENT>;
    removeObserver: ObserverRemove<EVENT>;
    loopState: boolean;

    constructor(camera) {
        withObservable.call(this, [EVENT.UPDATE, EVENT.RENDER]);
        this.entities = [];
        this.camera = camera;
        this.update = this.update.bind(this)
        layoutService.addObserver("end", this.update);
    }

    setFocus(width, height): void {
        this.camera.setFocus(width, height);
        this.update();
    }

    update(): void  {
        this.camera.update();
        this.camera.moveToFocus();
        this.calculate();
        this.render();
    }

    activate(): void  {
        this.loopState = Loop.CONTINUE;
        Loop.add(this);
    }

    deactivate(): void  {
        this.loopState = Loop.EXIT;
    }

    isActive(): boolean {
        return this.loopState === Loop.CONTINUE;
    }

    addEntity(entity): void {
        this.entities.push(entity);
    }

    fitToViewport(): void {
        this.camera.fitToViewport();
        // redraw
        this.calculate();
        this.render();
    }

    calculate(): boolean {
        this.camera.updateMatrix();
        const entities = this.entities;
        for (let i = 0, l = entities.length; i < l; i += 1) {
            entities[i].calculate(this.camera);
        }
        this.notify(EVENT.UPDATE, this.camera.getPosition());
        return Loop.CONTINUE;
    }

    render(): boolean {
        const entities = this.entities;
        const position = this.camera.getPosition();
        for (let i = 0, l = entities.length; i < l; i += 1) {
            entities[i].render();
        }
        this.notify(EVENT.RENDER, position);
        return this.loopState;
    }

    dispose(): void {
        const entities = this.entities;
        layoutService.removeObserver("end", this.update);
        for (let i = 0, l = entities.length; i < l; i += 1) {
            entities[i].dispose();
        }
    }
}

