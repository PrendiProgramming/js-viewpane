import { vec3 } from "gl-matrix";
import Loop from "../../common/loop";
import { createNanoEvents, Emitter } from "nanoevents";
import { Bound } from "../types";


export interface Events {
    onStart: (origin: vec3) => void;
    onUpdate: (origin: vec3) => void;
    onEnd: (origin: vec3) => void;
}

export const defaultOptions = {
    timeout: 400,
    scale: 0.02,
    rotateX: 0.1,
    rotateZ: 0.3
}


/**
 * Wheel handler supporting supporting trackpad move and pinch with two-fingers.
 * Note: Safari will only recognice move here, use gesture events for pinch and three fingers
 */
export default class TrackpadHandler {
    readonly emitter: Emitter;
    keepInLoop = Loop.EXIT;
    lastUpdateEvent: number;
    isUpToDate: boolean;

    #element: HTMLElement;
    #bound: Bound;

    startOrigin = vec3.create();
    currentOrigin = vec3.create();

    currentRotate = vec3.create();
    eventRotate = vec3.create();
    currentMove = vec3.create();
    eventMove = vec3.create();

    previousScale = 0;
    currentScale = 0;

    constructor($element: HTMLElement, boundingBox: Bound) {
        this.emitter = createNanoEvents<Events>();
        this.#element = $element;
        this.#bound = boundingBox;

        // chrome & firefox, safari move-only
        this.onWheel = this.onWheel.bind(this);
        $element.addEventListener("wheel", this.onWheel);
    }

    onWheel(event: WheelEvent): void {
        event.preventDefault();
        const { ctrlKey: isPinch, altKey: isRotate,  deltaX, deltaY } = event;

        this.isUpToDate = false;
        this.lastUpdateEvent = Date.now();
        if (this.keepInLoop === Loop.EXIT) {
            this.reset();
            vec3.set(this.startOrigin, event.pageX, event.pageY, 0);
            vec3.copy(this.currentOrigin, this.startOrigin);
            this.start();
        }

        const { currentOrigin, currentMove, currentRotate } = this;

        if (isPinch) {
            // scale
            this.currentScale += deltaY;
            return;
        }

        if (isRotate) {
            // rotate
            currentRotate[0] -= deltaY;
            currentRotate[2] -= deltaX;

        } else {
            // move
            currentMove[0] -= deltaX;
            currentMove[1] -= deltaY;
            currentOrigin[0] -= deltaX;
            currentOrigin[1] -= deltaY;
        }
    }

    reset(): void {
        this.currentScale = 0;
        this.previousScale = this.currentScale;
        vec3.zero(this.currentMove);
        vec3.zero(this.currentRotate);
    }

    calculate(now: number): boolean {
        if (now - this.lastUpdateEvent > defaultOptions.timeout) {
            return this.stop();
        }
        // @note: could debounce here (or once in main handler)
        if (this.isUpToDate) {
            return this.keepInLoop;
        }

        // scale
        const scale = 1 - (this.currentScale - this.previousScale) * defaultOptions.scale;
        this.previousScale = this.currentScale;
        // rotate
        vec3.copy(this.eventRotate, this.currentRotate);
        this.eventRotate[0] *= defaultOptions.rotateX;
        this.eventRotate[2] *= defaultOptions.rotateZ;
        vec3.zero(this.currentRotate);
        // move
        vec3.copy(this.eventMove, this.currentMove);
        vec3.zero(this.currentMove);

        this.isUpToDate = true;
        this.emitter.emit("update", this.currentOrigin, this.eventMove, scale, this.eventRotate);
        return this.keepInLoop;
    }

    start(): void {
        this.keepInLoop = Loop.CONTINUE;
        this.emitter.emit("start", this.startOrigin);
        Loop.add(this);
    }

    stop(): boolean {
        this.keepInLoop = Loop.EXIT;
        this.emitter.emit("end", this.currentOrigin);
        return this.keepInLoop;
    }

    render() {} // eslint-disable-line

    destroy(): void {
        this.#element.removeEventListener("wheel", this.onWheel);
    }
}
