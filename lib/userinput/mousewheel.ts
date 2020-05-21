/* eslint no-use-before-define: "off", @typescript-eslint/no-use-before-define: "off" */
import HandlerConfig from "./HandlerConfig";
import Timeout from "../common/Timeout";
import { vec3 as v } from "gl-matrix";

const mouseWheelDelay = 50;

// note: if wheel is set, mousewheel will be ignored (for trackpad)


/**
 * Eventhandler, sending input position and relative motion events (last-update to update)
 */
export default function mouse($element, boundingBox, onStart, onInput, onEnd): HandlerConfig {
    // note: if wheel is set, mousewheel will be ignored (for trackpad)

    const config = {
        activated: true,
        dispose(): void {
            this.activated = false;
            $element.removeEventListener("mousewheel", mousewheel);
        }
    };

    $element.addEventListener("mousewheel", mousewheel);

    const previousPosition = v.create();
    const currentPosition = v.create();
    const movementVector = v.create();

    const rotation = v.create();

    let isInAction = false;

    const wheelTimeout = new Timeout(function () {
        if (isInAction === false) {
            return;
        }

        isInAction = false;
        onEnd(currentPosition);
    }, mouseWheelDelay);

    function mousewheel(event: MouseWheelEvent): void {
        if (config.activated === false) {
            return;
        }

        event.preventDefault();

        const x = event.pageX - boundingBox.left;
        const y = event.pageY - boundingBox.top;
        // @ts-ignore
        const z = event.wheelDelta;

        if (isInAction === false) {
            console.log("mousewheel");
            isInAction = true;

            wheelTimeout.start();
            v.set(rotation, 0, 0, 0);
            v.set(currentPosition, x, y, z);
            onStart(currentPosition);

        } else {
            wheelTimeout.keepAlive();
            v.copy(previousPosition, currentPosition);
            v.set(currentPosition, x, y, currentPosition[2] + z);
            v.subtract(movementVector, currentPosition, previousPosition);
            // convert position to scale
            movementVector[2] = 1 - (movementVector[2] * 0.002);

            onInput(currentPosition, movementVector);
        }
    }

    function cancelInput(event: MouseEvent): void {
        if (isInAction === false) {
            return;
        }

        isInAction = false;
        onEnd(currentPosition);
    }

    return config;
}
