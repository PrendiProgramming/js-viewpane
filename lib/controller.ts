"use strict";

import SpeedSnapAnimation from "./scene/SpeedSnapAnimation";
import vector from "./common/vector";
import Userinput from "./userinput/index";
import Scene from "./scene";
import ViewpaneElement from "./scene/Entity";
import withObservable from "./common/withObservable";
import { ObserverNotify } from "./types";

export enum EVENT {
    CLICK = "onClick",
    UPDATE = "onUpdate",
    RENDER = "onRender",
    START = "onInputStart",
    STOP = "onInputStop",
    END = "onEnd",
}
function el(elementId) {
    if (
        elementId &&
        Object.prototype.toString.call(elementId) === "[object String]"
    ) {
        return document.getElementById(elementId);
    } else if (elementId && elementId.tagName) {
        return elementId;
    }

    console.log("invalid element id given", elementId);
    return null;
}

/**
 * ViewpaneJS controller
 *
 * @param {HTMLElement} screenEl
 * @param {HTMLElement} viewpaneEl
 * @param {Object} options
 */
class Viewpane {
    scene: any;
    userinput: any;
    notify: ObserverNotify<EVENT>;
    viewpane: any;
    speedSnap: any;

    constructor(screenEl, viewpaneEl, options?) {
        withObservable.call(this, [
            EVENT.CLICK,
            EVENT.UPDATE,
            EVENT.RENDER,
            EVENT.START,
            EVENT.STOP,
            EVENT.END,
        ]);

        screenEl = el(screenEl);
        viewpaneEl = el(viewpaneEl);

        var self = this;
        var viewpane = new ViewpaneElement(viewpaneEl);

        var viewpaneBound = viewpaneEl.getBoundingClientRect();
        var focus =
            options.focus ||
            vector.create(viewpaneBound.width, viewpaneBound.height, 0);
        this.scene = new Scene(screenEl, focus, options);
        this.scene.addObserver(Scene.EVENT_UPDATE, function (position) {
            self.notify(EVENT.UPDATE, position);
        });
        this.scene.addObserver(Scene.EVENT_RENDER, function (position) {
            self.notify(EVENT.RENDER, position);
        });

        this.viewpane = viewpane;
        this.scene.addEntity(viewpane);
        this.speedSnap = new SpeedSnapAnimation(this.scene, options);

        this.speedSnap.addObserver(SpeedSnapAnimation.EVENT_STOP, function () {
            self.notify(EVENT.END);
        });

        var isClick = true;
        var previousPosition = vector.create();
        var currentPosition = vector.create();

        // listen to user input on element $viewport
        var inputOrigin = vector.create();
        this.userinput = new Userinput(screenEl, {
            // Remember: triggered again for each change in touch pointer count
            onStart: function (position) {
                inputOrigin.set(position);
                inputOrigin.z = self.scene.camera.getPosition().z;

                isClick = true;
                currentPosition.set(inputOrigin);
                previousPosition.set(currentPosition);

                self.userInputStart();
            },

            // Remember: scaleVector.z-value := scale factor; x, y := relativeMovement
            onScale: function (scaleVector, position) {
                inputOrigin.set(position);
                inputOrigin.z = self.scene.camera.getPosition().z;
                scaleVector.z = self.scene.convertZScaleToPosition(
                    scaleVector.z
                );

                isClick = false;
                previousPosition.set(currentPosition);
                currentPosition.set(inputOrigin);

                self.moveBy(scaleVector, inputOrigin);
            },

            onEnd: function (event) {
                if (isClick === false) {
                    previousPosition.subtract(currentPosition);
                    previousPosition.z = 0;
                    if (previousPosition.getLength() > 5) {
                        return self.userInputStop(
                            inputOrigin,
                            previousPosition
                        );
                    }
                } else {
                    // clicked.
                    // Convert click point, to point on viewpane
                    var viewpanePosition = self.scene.getPosition();
                    // clickTarget in screen space
                    var clickTarget = inputOrigin.clone();
                    clickTarget.z = 0;
                    // convert to screen position to position in viewpane z distance
                    clickTarget.invertProject(
                        self.scene.camera.eye,
                        inputOrigin.z
                    );
                    // adjust target by viewpane translation
                    clickTarget.subtract(viewpanePosition);
                    clickTarget.z = 0;

                    self.notify(EVENT.CLICK, event, clickTarget);
                }

                self.userInputStop(inputOrigin, vector.origin);
            },
        });

        this.fit();
    }
    deactivate() {
        this.userinput.deactivate();
    }

    activate() {
        this.userinput.activate();
    }

    isActive() {
        return this.userinput.isActive();
    }

    userInputStart() {
        this.speedSnap.stop();
        this.scene.activate();
        this.notify(EVENT.START);
    }

    userInputStop(origin, speedVector) {
        if (this.scene.isActive()) {
            this.scene.deactivate();
            this.speedSnap.from.set(this.scene.getPosition());
            this.speedSnap.start(speedVector, origin);
            this.notify(EVENT.STOP);
        }
    }

    setFocus(width, height) {
        this.scene.setFocus(width, height);
    }

    repaint() {
        this.scene.calculate();
        this.scene.render();
    }

    getViewportCenter() {
        return this.scene.camera.screenHalfDimensions;
    }

    getZCenter() {
        var range = this.scene.camera.getZRange();
        return (range.max - range.min) / 2;
    }

    zoomAt(origin, zTranslation) {
        origin.z = this.scene.camera.getPosition().z;
        this.scene.camera.zoomAt(origin, zTranslation);
        this.repaint();
    }

    moveBy(moveVector, origin) {
        this.scene.moveVisual(moveVector, origin);
    }

    addEntity(entity) {
        this.scene.addEntity(entity);
    }

    fit() {
        this.scene.fitToViewport();
    }

    createEntity(elementId) {
        var entity = new ViewpaneElement(el(elementId));
        this.addEntity(entity);
        return entity;
    }

    setPosition(position) {
        this.scene.setPosition(position);
    }

    getPosition(position) {
        return this.scene.getPosition();
    }

    getScene(position) {
        return this.scene;
    }

    getViewpane(position) {
        return this.viewpane;
    }

    dispose() {
        this.userinput.dispose();
        this.scene.dispose();
    }
}

export default Viewpane;
