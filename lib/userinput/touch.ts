"use strict";

import vector from "../common/vector";
import Loop from "../common/loop";

// returns center point between first and second touch point
function getCenterPosition(vector, boundingBox, firstTouch, secondTouch) {
    vector.x =
        0.5 * (secondTouch.pageX - firstTouch.pageX) +
        firstTouch.pageX -
        boundingBox.left;
    vector.y =
        0.5 * (secondTouch.pageY - firstTouch.pageY) +
        firstTouch.pageY -
        boundingBox.top;
    vector.z = 0;
    return vector;
}

// returns distance between to touch-points
function getLengthOfLine(firstTouch, secondTouch) {
    var x = secondTouch.pageX - firstTouch.pageX;
    var y = secondTouch.pageY - firstTouch.pageY;
    return Math.sqrt(x * x + y * y);
}

function touch($element, boundingBox, onStart, onInput, onEnd) {
    var config = {
        activated: true,
        dispose: function () {
            this.activated = false;
            $element.removeEventListener("touchmove", touchmove);
            $element.removeEventListener("touchstart", touchstart);
            $element.removeEventListener("touchend", endTouch);
            document.body.removeEventListener("touchend", endTouch);
        },
    };

    var currentTouches = 0;
    var currentPosition = vector.create();
    var previousPosition = vector.create();
    var inputVector = vector.create();

    var currentLength = 0;
    var previousLength = 0;

    $element.addEventListener("touchmove", touchmove);
    $element.addEventListener("touchstart", touchstart);
    $element.addEventListener("touchend", endTouch);
    document.body.addEventListener("touchend", endTouch);

    var Processor = {
        currentEvent: null,

        start: function () {
            this.loopState = Loop.CONTINUE;
            Loop.add(this);
        },

        stop: function () {
            this.loopState = Loop.EXIT;
        },

        calculate: function () {
            var event = this.currentEvent;
            if (event == null) {
                return;
            }

            previousLength = currentLength;
            previousPosition.set(currentPosition);

            if (event.touches.length > 1) {
                currentLength = getLengthOfLine(
                    event.touches[0],
                    event.touches[1]
                );
                currentPosition = getCenterPosition(
                    currentPosition,
                    boundingBox,
                    event.touches[0],
                    event.touches[1]
                );

                inputVector.setDelta(currentPosition, previousPosition);
                // z = scale factor
                inputVector.z =
                    previousLength === 0 ? 1 : currentLength / previousLength;
            } else {
                currentPosition.setValues(
                    event.touches[0].pageX - boundingBox.left,
                    event.touches[0].pageY - boundingBox.top,
                    0
                );
                inputVector.setDelta(currentPosition, previousPosition);
                inputVector.z = 1;
            }

            this.currentEvent = null;
            onInput(inputVector, currentPosition);
            return this.loopState;
        },

        render: Function.prototype,
    };

    function startSingleTouch(touchItem) {
        currentLength = 0;
        previousLength = 0;
        currentPosition.setValues(
            touchItem.pageX - boundingBox.left,
            touchItem.pageY - boundingBox.top,
            0
        );
        previousPosition.set(currentPosition);
    }

    function startDoubleTouch(firstTouch, secondTouch) {
        currentLength = getLengthOfLine(firstTouch, secondTouch);
        currentPosition = getCenterPosition(
            currentPosition,
            boundingBox,
            firstTouch,
            secondTouch
        );
        previousPosition.set(currentPosition);
    }

    function startTouch(event) {
        config.activated && event.preventDefault();
        considerStart = false;
        currentTouches = event.touches.length;

        Processor.start();

        if (event.touches.length === 1) {
            startSingleTouch(event.touches[0]);
        } else {
            startDoubleTouch(event.touches[0], event.touches[1]);
        }

        onStart(currentPosition);
    }

    function endTouch(event) {
        // abort if inactive
        if (currentTouches === 0) {
            return;
        }

        // end event might be triggered twice (document)
        event.stopPropagation();

        // else end input action
        considerStart = false;
        currentTouches = 0;
        Processor.stop();
        onEnd(event);

        // if touch remains, change mode
        if (event.touches.length === 1 || event.touches.length === 2) {
            requestAnimationFrame(() => {
                startTouch(event);
            });
        }
    }

    var considerStart = false;
    function considerInputStart(event) {
        considerStart = true;
    }

    function touchstart(event) {
        if (event.touches.length > 2) {
            return;
        }

        if (event.touches.length === 2 && currentTouches === 1) {
            endTouch(event); // ends current touch and starts a new touch event to handle zoom
            return;
        }

        if (config.activated === false) {
            startTouch(event);
            return;
        }

        if (event.touches.length === 1 && currentTouches === 0) {
            considerInputStart(event);
            return;
        }

        startTouch(event);
    }

    function touchmove(event) {
        if (
            config.activated === false ||
            (currentTouches === 0 && considerStart === false)
        ) {
            return;
        }

        if (considerStart === true) {
            startTouch(event);
        }

        event.preventDefault();
        event.stopPropagation();
        Processor.currentEvent = event;
    }

    return config;
}

export default touch;
