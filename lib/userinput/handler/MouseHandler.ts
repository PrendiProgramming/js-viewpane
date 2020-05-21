/* eslint no-use-before-define: "off", @typescript-eslint/no-use-before-define: "off" */
import { vec3 } from "gl-matrix";
import Loop from "../../common/loop";
import { createNanoEvents, Emitter } from "nanoevents";
import { Bound } from "../types";


export const defaultOptions = {
    rotateX: 0.2,
    rotateZ: 0.4
}


export interface Events {
    onStart: (origin: vec3) => void;
    onUpdate: (origin: vec3) => void;
    onEnd: (origin: vec3) => void;
}


export default class MouseHandler {
    readonly emitter: Emitter;
    keepInLoop = Loop.EXIT;
    lastUpdateEvent: number;
    isUpToDate: boolean;
    isActive = false;

    #element: HTMLElement;
    #bound: Bound;

    isRotate = false;
    startOrigin = vec3.create();
    previousOrigin = vec3.create();
    currentOrigin = vec3.create();

    delta = vec3.create();

    constructor($element: HTMLElement, boundingBox: Bound) {
        this.emitter = createNanoEvents<Events>();
        this.#element = $element;
        this.#bound = boundingBox;

        this.onStart = this.onStart.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.onEnd = this.onEnd.bind(this);
        this.onCancel = this.onCancel.bind(this);

        $element.addEventListener("mousedown", this.onStart);
        $element.addEventListener("mousemove", this.onUpdate);
        $element.addEventListener("mouseup", this.onEnd);
        document.body.addEventListener("mousemove", this.onEnd); // mouse left container
        document.body.addEventListener("mouseout", this.onCancel); // mouse left window
    }

    onStart(event: MouseEvent): void {
        event.preventDefault();

        const { startOrigin, currentOrigin, previousOrigin } = this;

        this.isRotate = event.altKey;
        const x = event.pageX - this.#bound.left;
        const y = event.pageY - this.#bound.top;
        vec3.set(startOrigin, x, y, 0);
        vec3.copy(currentOrigin, startOrigin);
        vec3.copy(previousOrigin, startOrigin);
        this.isUpToDate = false;
        this.start();
    }

    onUpdate(event: MouseEvent): void {
        if (this.isActive === false) {
            return;
        }
        this.isUpToDate = false;
        event.preventDefault();
        event.stopPropagation(); // stop event to bubble to document.body, which aborts dragging
        this.isRotate = event.altKey;
        vec3.set(this.currentOrigin, event.pageX - this.#bound.left, event.pageY - this.#bound.top, 0);
    }

    onCancel(_event): void {
        const event = _event ? _event : window.event;
        const from = event.relatedTarget || event.toElement;
        if (!from || from.nodeName === "HTML") {
            this.onEnd(event);
        }
    }

    onEnd(event: MouseEvent): void {
        if (this.isActive === false) {
            return;
        }
        this.isUpToDate = false;
        vec3.set(this.currentOrigin, event.pageX - this.#bound.left, event.pageY - this.#bound.top, 0);
        this.stop();
    }

    calculate(): boolean {
        if (this.isUpToDate) {
            return;
        }

        const { delta } = this;
        vec3.subtract(delta, this.currentOrigin, this.previousOrigin);
        if (this.isRotate) {
            vec3.set(delta, delta[1] * defaultOptions.rotateX, 0, delta[0] * defaultOptions.rotateZ);
            this.emitter.emit("update", this.currentOrigin, undefined, delta);
        } else {
            this.emitter.emit("update", this.currentOrigin, delta);
        }

        this.isUpToDate = true;
        vec3.copy(this.previousOrigin, this.currentOrigin);
        return this.keepInLoop;
    }

    start(): void {
        this.isActive = true;
        this.keepInLoop = Loop.CONTINUE;
        this.emitter.emit("start", this.startOrigin);
        Loop.add(this);
    }

    stop(): boolean {
        this.isActive = false;
        this.keepInLoop = Loop.EXIT;
        this.emitter.emit("end", this.currentOrigin);
        return this.keepInLoop;
    }

    render() {} // eslint-disable-line

    destroy(): void {
        this.#element.removeEventListener("mousedown", this.onStart);
        this.#element.removeEventListener("mousemove", this.onUpdate);
        this.#element.removeEventListener("mouseup", this.onEnd);
        document.body.removeEventListener("mousemove", this.onEnd); // mouse left container
        document.body.removeEventListener("mouseout", this.onCancel); // mouse left window
    }
}
