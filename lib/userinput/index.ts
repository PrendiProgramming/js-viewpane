import touch from "./touch";
import layoutService from "../service/layoutService";
import HandlerConfig from "./HandlerConfig";
import { vec3 as v } from "gl-matrix";
import { Bound } from "./types";

import TrackpadHandler from "./handler/TrackpadHandler";
import GestureHandler from "./handler/GestureHandler";
import MouseHandler from "./handler/MouseHandler";


export interface Options {
    onStart?(position: v);
    onUpdate?(position: v, movement: v, rotation: v);
    onEnd?(event: MouseEvent | TouchEvent);
}


export default class UserInput {
    $element: HTMLElement;
    elementBound: Bound;
    onStart;
    onUpdate;
    onEnd;
    controls: Array<HandlerConfig>;

    constructor($element, options: Options) {
        this.$element = $element;
        this.elementBound = { top: 0, left: 0, width: 0, height: 0 };

        this.updateElementBound();

        this.updateElementBound = this.updateElementBound.bind(this);
        layoutService.addObserver("end", this.updateElementBound);

        // receives startposition of user interaction
        this.onStart = options.onStart || Function.prototype;
        // receives movement vector from last to current position, where z-value being scale instead of position
        this.onUpdate = options.onUpdate || Function.prototype;
        // receives no arguments
        this.onEnd = options.onEnd || Function.prototype;

        this.controls = [];
        this.controls.push(touch($element, this.elementBound, this.onStart, this.onUpdate, this.onEnd));

        const mouse = new MouseHandler($element, this.elementBound);
        mouse.emitter.on("start", (origin: v) => this.onStart(origin));
        mouse.emitter.on("end", (origin: v) => this.onEnd(origin));
        mouse.emitter.on("update", (origin: v, movement?: v, rotation?: v) => {
            this.onUpdate(origin, movement, rotation);
        });

        const trackpad = new TrackpadHandler($element, this.elementBound);
        trackpad.emitter.on("start", (origin: v) => this.onStart(origin));
        trackpad.emitter.on("end", (origin: v) => this.onEnd(origin));
        trackpad.emitter.on("update", (origin: v, movement: v, scale: number, rotation: v) => {
            const moveScale = v.fromValues(movement[0], movement[1], scale);
            this.onUpdate(origin, moveScale, rotation);
        });

        // this is mac safari only
        // conflicts with touch event implementation (also no android support)
        if ("ontouchstart" in document.documentElement === false) {
            const gesture = new GestureHandler($element, this.elementBound);
            gesture.emitter.on("start", (origin: v) => this.onStart(origin));
            gesture.emitter.on("start", (origin: v) => this.onEnd(origin));
            gesture.emitter.on("update", (origin: v, scale: number, rotation: number) => {
                const moveScale = v.fromValues(0, 0, scale);
                const rotate = v.fromValues(0, 0, rotation)
                this.onUpdate(origin, moveScale, rotate);
            });
        }
    }

    isActive(): boolean {
        return this.controls[0].activated;
    }

    deactivate(): void {
        for (let i = 0, l = this.controls.length; i < l; i += 1) {
            this.controls[i].activated = false;
        }
    }

    activate(): void {
        for (let i = 0, l = this.controls.length; i < l; i += 1) {
            this.controls[i].activated = true;
        }
    }

    updateElementBound(): void {
        const bound = this.$element.getBoundingClientRect();
        this.elementBound.top = bound.top + (document.documentElement.scrollTop || document.body.scrollTop);
        this.elementBound.left = bound.left + (document.documentElement.scrollLeft || document.body.scrollLeft);
        this.elementBound.width = bound.width;
        this.elementBound.height = bound.height;
    }

    dispose(): void {
        layoutService.removeObserver("end", this.updateElementBound);
        this.updateElementBound = null;
        for (let i = 0, l = this.controls.length; i < l; i += 1) {
            this.controls[i].dispose();
        }
    }
}
