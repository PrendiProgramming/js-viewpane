/* eslint no-use-before-define: "off", @typescript-eslint/no-use-before-define: "off" */
import Loop from "../common/loop";
import HandlerConfig from "./HandlerConfig";
import { vec3 as v } from "gl-matrix";

// returns center point between first and second touch point
function getCenterPosition(out: v, boundingBox, firstTouch, secondTouch): v {
    const { pageX, pageY }  = firstTouch;
    return v.set(out,
        0.5 * (secondTouch.pageX - pageX) + pageX - boundingBox.left,
        0.5 * (secondTouch.pageY - pageY) + pageY - boundingBox.top,
        0
    );
}

const toDeg = (rad: number): number => rad * 180/Math.PI;

// returns distance between to touch-points
function getLengthOfLine(firstTouch, secondTouch): number {
    const x = secondTouch.pageX - firstTouch.pageX;
    const y = secondTouch.pageY - firstTouch.pageY;
    return Math.sqrt(x * x + y * y);
}

function setRotationAxis(out: v, a: Touch, b: Touch): v {
    const { pageX: ax, pageY: ay } = a;
    const { pageX: bx, pageY: by } = b;
    return v.set(out, ax - bx, ay - by, 1);
}

const anglePlane = v.fromValues(0, 0, -1);
const temp = v.create();
function getAngle(a: v, b: v): number {
    const sign = v.dot(anglePlane, v.cross(temp, a, b))
    return toDeg(sign < 0 ? v.angle(a, b) : -v.angle(a, b));
}


interface Bound {
    top: number;
    left: number;
    width: number;
    height: number;
}


class InputProcessor {
    loopState: boolean;
    onInput: (origin: v, movement: v, rotation: v) => void;
    boundingBox: Bound;

    currentEvent: TouchEvent;
    // calulcation values
    touchDistance: number;
    previousPosition = v.create();
    currentPosition = v.create();
    rotation = v.create();
    inputVector = v.create();
    currentRotationAxis = v.create();
    previousRotationAxis = v.create();

    constructor(boundingBox: Bound, onInput) {
        this.boundingBox = boundingBox;
        this.onInput = onInput;
    }

    reset(touches: TouchList): void {
        this.currentEvent = null;
        v.zero(this.rotation);

        if (touches.length > 2) {
            this.updateTripleTouch(touches[0], touches[1]);
        } else if (touches.length > 1) {
            this.updateDualTouch(touches[0], touches[1]);
            v.copy(this.previousRotationAxis, this.currentRotationAxis);
        } else {
            this.updateSingleTouch(touches[0]);
        }

        v.copy(this.previousPosition, this.currentPosition);
    }

    updateSingleTouch(touch: Touch): void {
        const { pageX, pageY } = touch;
        const { boundingBox, currentPosition, previousPosition, inputVector } = this;
        // movement
        v.set(currentPosition, pageX - boundingBox.left, pageY - boundingBox.top, 0);
        v.subtract(inputVector, currentPosition, previousPosition);
        // no scale
        inputVector[2] = 0;
    }

    updateDualTouch(firstTouch: Touch, secondTouch: Touch): void {
        const {
            boundingBox, currentPosition, previousPosition, inputVector,
            rotation, currentRotationAxis, previousRotationAxis
        } = this;

        // movement
        getCenterPosition(currentPosition, boundingBox, firstTouch, secondTouch);
        v.subtract(inputVector, currentPosition, previousPosition);
        // scale
        const touchDistance = getLengthOfLine(firstTouch, secondTouch);
        inputVector[2] = touchDistance / this.touchDistance; // z = scale factor
        this.touchDistance = touchDistance;
        // rotation
        setRotationAxis(currentRotationAxis, firstTouch, secondTouch);
        rotation[2] = getAngle(currentRotationAxis, previousRotationAxis);
        v.copy(previousRotationAxis, currentRotationAxis);
    }

    updateTripleTouch(firstTouch: Touch, secondTouch: Touch): void {
        const { boundingBox, rotation, currentPosition, previousPosition, inputVector } = this;
        // movement
        getCenterPosition(currentPosition, boundingBox, firstTouch, secondTouch);
        v.subtract(inputVector, currentPosition, previousPosition);
        // rotation: x axis only (tilt in view direction)
        rotation[0] = inputVector[1] / (screen.height/45);
    }

    start(): void {
        this.loopState = Loop.CONTINUE;
        Loop.add(this);
    }

    stop(): void {
        this.loopState = Loop.EXIT;
    }

    calculate(): boolean {
        if (this.currentEvent == null) {
            return;
        }

        const { touches } = this.currentEvent;
        this.currentEvent = null;

        if (touches.length === 1) {
            this.updateSingleTouch(touches[0]);
            this.onInput(this.currentPosition, this.inputVector, undefined);

        } else if (touches.length === 2) {
            this.updateDualTouch(touches[0], touches[1]);
            console.log("send dualtouch");
            this.onInput(this.currentPosition, this.inputVector, this.rotation);

        } else if (touches.length > 2) {
            this.updateTripleTouch(touches[0], touches[1]);
            this.onInput(this.currentPosition, undefined, this.rotation);
        }

        return this.loopState;
    }

    render() {} // eslint-disable-line
}


export default function touch($element, boundingBox, onStart, onInput, onEnd): HandlerConfig {
    const config = {
        // if viewpane is enabled and accepts inputs - changed outside
        activated: true,
        dispose(): void {
            this.activated = false;
            $element.removeEventListener("touchstart", addTouchPoint);
            $element.removeEventListener("touchmove", moveTouch);
            $element.removeEventListener("touchend", removeTouchPoint);
            document.body.removeEventListener("touchend", removeTouchPoint);
        }
    };

    $element.addEventListener("touchstart", addTouchPoint);
    $element.addEventListener("touchmove", moveTouch);
    $element.addEventListener("touchend", removeTouchPoint);
    document.body.addEventListener("touchend", removeTouchPoint);

    let touchCount = 0;
    let startOnTouchMove = false;
    const processor = new InputProcessor(boundingBox, onInput);

    /** called for each added touch */
    function addTouchPoint(event: TouchEvent): void {
        if (config.activated === false) {
            // still allow click events via endTouch
            touchCount = event.touches.length;
            return;
        }

        if (touchCount === 0) {
            // delay interaction start to touchMove
            startOnTouchMove = true;
            return;
        }

        // change of touchcount (more than one)
        changeTouchCount(event);
    }

    /** called for new or changing touch events */
    function changeTouchCount(event: TouchEvent): void {
        const currentTouchCount = event.touches.length;
        touchCount = currentTouchCount;
        if (touchCount !== 0) {
            onEnd(processor.currentPosition); // send end event if change of active interaction
        }
        processor.reset(event.touches);
        onStart(processor.currentPosition)
    }

    /** called for each removed touch */
    function removeTouchPoint(event): void {
        if (touchCount === 0) {
            return; // abort if inactive
        }
        event.stopPropagation(); // end event might be triggered twice (document listener)
        if (event.touches.length !== 0) {
            changeTouchCount(event);
            return;
        }
        // stop and reset
        startOnTouchMove = false;
        touchCount = 0;
        processor.stop();
        onEnd(processor.currentPosition);
    }

    function moveTouch(event: TouchEvent): void {
        if (config.activated === false || (touchCount === 0 && startOnTouchMove === false)) {
            return;
        }

        if (startOnTouchMove === true) {
            startOnTouchMove = false;
            changeTouchCount(event);
            processor.start();
        }

        event.preventDefault();
        event.stopPropagation();
        processor.currentEvent = event;
    }

    return config;
}
