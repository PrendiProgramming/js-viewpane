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
    rotate: -1.5
}


export default class GestureHandler {
    readonly emitter: Emitter;
    keepInLoop = Loop.EXIT;
    lastUpdateEvent: number;
    isUpToDate: boolean;

    #element: HTMLElement;
    #bound: Bound;

    startOrigin = vec3.create();
    currentScale = 1;
    currentRotation = 0;
    previousScale = 1;
    previousRotation = 0;

    constructor($element: HTMLElement, boundingBox: Bound) {
        this.emitter = createNanoEvents<Events>();
        this.#element = $element;
        this.#bound = boundingBox;

        // safari https://developer.apple.com/documentation/webkitjs/gestureevent
        // gestures also trigger on ios for multi-touch
        this.gestureStart = this.gestureStart.bind(this);
        this.gestureChange = this.gestureChange.bind(this);
        this.gestureEnd = this.gestureEnd.bind(this);

        $element.addEventListener("gesturestart", this.gestureStart);
        $element.addEventListener("gesturechange", this.gestureChange);
        $element.addEventListener("gestureend", this.gestureEnd);
    }

    gestureStart(event): void {
        event.preventDefault();
        const { scale, rotation, pageX, pageY } = event;
        this.currentScale = scale;
        this.currentRotation = rotation;
        vec3.set(this.startOrigin, pageX, pageY, 0);
        this.isUpToDate = false;
        this.reset();
        console.log("gesture start", scale, rotation, pageX, pageY);
        this.start();
    }

    reset(): void {
        this.previousScale = 1;
        this.previousRotation = 0;
    }

    gestureChange(event): void {
        event.preventDefault();
        this.isUpToDate = false;
        this.currentScale = event.scale;
        this.currentRotation = event.rotation;
    }

    gestureEnd(event): void {
        const { scale, rotation, pageX, pageY } = event;
        console.log("gesture end", scale, rotation, pageX, pageY);
        this.stop();
    }

    calculate(): boolean {
        if (this.isUpToDate) {
            return this.keepInLoop;
        }

        const scaleDelta = 1 + (this.currentScale - this.previousScale);
        const zRotationDelta = (this.currentRotation - this.previousRotation);
        this.previousScale = this.currentScale;
        this.previousRotation = this.currentRotation;
        this.emitter.emit("update", this.startOrigin, scaleDelta, zRotationDelta * defaultOptions.rotate);

        this.isUpToDate = true;
        return this.keepInLoop;
    }

    start(): void {
        this.keepInLoop = Loop.CONTINUE;
        this.emitter.emit("start", this.startOrigin);
        Loop.add(this);
    }

    stop(): boolean {
        this.keepInLoop = Loop.EXIT;
        this.emitter.emit("end", this.startOrigin);
        return this.keepInLoop;
    }

    render() {} // eslint-disable-line

    destroy(): void {
        this.#element.removeEventListener("gesturestart", this.gestureStart);
        this.#element.removeEventListener("gesturechange", this.gestureChange);
        this.#element.removeEventListener("gestureend", this.gestureEnd);
    }
}
