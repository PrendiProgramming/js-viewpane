import * as math from "./math";
import Camera from "./scene/Camera";
import el from "./common/el";
import Scene, { EVENT as SCENE_EVENT } from "./Scene";
import SpeedSnapAnimation, { EVENT as ANIMATION_EVENT } from "./scene/SpeedSnapAnimation";
import UserInput from "./userinput/index";
import Entity from "./scene/Entity";
import withObservable from "./common/withObservable";
import { glMatrix, vec3 as v, mat4 } from "gl-matrix";
import { ObserverNotify, ObserverAdd, ObserverRemove } from "./types";
glMatrix.setMatrixArrayType(Array);


export enum EVENT {
    CLICK = "onClick",
    UPDATE = "onUpdate",
    RENDER = "onRender",
    START = "onInputStart",
    STOP = "onInputStop",
    END = "onEnd"
}

const nullVector = v.create();
const idleVector = v.fromValues(0, 0, 1);

const toS = (vec: v): string => `(${vec.map(vec => parseInt(vec)).join(",")})`;
function createEntity(id, scene, screenEl): Entity {
    const debugLookAt = document.createElement("div");
    debugLookAt.setAttribute("id", id);
    debugLookAt.classList.add("debug");
    screenEl.appendChild(debugLookAt);
    const lookAtEntity = new Entity(debugLookAt);
    scene.addEntity(lookAtEntity);
    return lookAtEntity
}


/**
 * ViewpaneJS controller
 * @todo
 *     - remove support for multiple entities
 *     - scene + viewpane -> world/plane
 *     - move most controller input handler logic to userinput
 *
 * @param {HTMLElement} screenEl
 * @param {HTMLElement} viewpaneEl
 * @param {Object} options
 */
export default class ViewpaneController {
    scene: Scene;
    viewpane: Entity;
    speedSnap: SpeedSnapAnimation;
    userInput: UserInput;
    isInInteraction: boolean;
    notify: ObserverNotify<EVENT>;
    addObserver: ObserverAdd<EVENT>;
    removeObserver: ObserverRemove<EVENT>;
    camera: Camera;

    constructor(screenEl, viewpaneEl, options?) {
        withObservable.call(this, [EVENT.CLICK, EVENT.UPDATE, EVENT.RENDER, EVENT.START, EVENT.STOP, EVENT.END]);

        screenEl = el(screenEl);
        viewpaneEl = el(viewpaneEl);

        const viewpane = new Entity(viewpaneEl);

        const viewpaneBound = viewpaneEl.getBoundingClientRect();
        const focus = options.focus || { x: viewpaneBound.width, y: viewpaneBound.height };
        this.camera = new Camera(screenEl, focus, options);
        this.scene = new Scene(this.camera);
        this.scene.addObserver(SCENE_EVENT.UPDATE, (position) => this.notify(EVENT.UPDATE, position));
        this.scene.addObserver(SCENE_EVENT.RENDER, (position) => this.notify(EVENT.RENDER, position));

        this.viewpane = viewpane;
        mat4.translate(this.viewpane.modelMatrix, this.viewpane.modelMatrix, v.fromValues(-3960/2, -3060/2, 0))
        this.scene.addEntity(viewpane);
        this.speedSnap = new SpeedSnapAnimation(this.scene, options);

        this.speedSnap.addObserver(ANIMATION_EVENT.STOP, () => this.notify(EVENT.END));

        let isClick = true;
        const startOfInput = v.create(); // start of input position
        const previousPosition = v.create(); // previous event input position
        const currentPosition = v.create(); // temp - current event input position
        // absolute rotation from start to current event
        const rotationVector = v.copy(v.create(), this.viewpane.rotation);
        // listen to user input on element $viewport
        const inputOrigin = v.create();


        // debug
        const lookAtEntity = createEntity("lookAt", this.scene, screenEl);
        const lookUpEntity = createEntity("lookUp", this.scene, screenEl);
        lookUpEntity.element.style.borderColor = "blue";

        this.userInput = new UserInput(screenEl, {

            // Remember: triggered again for each change in touch pointer count
            onStart: (position: v): void => {
                isClick = true;
                v.copy(currentPosition, inputOrigin);
                v.copy(previousPosition, inputOrigin);
                v.copy(inputOrigin, position);
                v.copy(startOfInput, position);
                inputOrigin[2] = this.camera.position[2];
                this.userInputStart();
            },

            // Remember: scaleVector.z-value := scale factor; x, y := relativeMovement
            onUpdate: (position: v, movement = idleVector, rotation = nullVector): void => {
                isClick = false;
                const toRotate = rotation.map(v => 10 * glMatrix.toRadian(v));

                v.copy(inputOrigin, position);
                inputOrigin[2] = this.camera.position[2];

                v.copy(previousPosition, currentPosition);
                v.copy(currentPosition, inputOrigin);

                // adjust position by rotation
                // if (toRotate[2] !== 0) {
                //     const { position: cam } =  this.camera;
                //     const camSide = cam[2]/Math.abs(cam[2]);
                //     const toCam = v.fromValues(0, 0, -camSide);
                //     const direction = this.camera.getForward();
                //     direction[2] = camSide * direction[2];
                //     // current look at point
                //     const target = math.intersectRayPlane(v.create(), cam, direction, toCam);
                //     mat4.fromTranslation(lookAtEntity.modelMatrix, target);

                //     const targetToCam = v.subtract(v.create(), cam, target);
                //     const newTargetToCam = v.rotateX(v.create(), targetToCam, nullVector, toRotate[0]);

                //     const rotatedCamPos = v.subtract(v.create(), targetToCam, newTargetToCam);
                //     v.negate(rotatedCamPos, rotatedCamPos);
                //     this.camera.translate(rotatedCamPos);

                //     mat4.fromTranslation(lookUpEntity.modelMatrix, target);
                //     mat4.translate(lookUpEntity.modelMatrix, lookAtEntity.modelMatrix, rotatedCamPos);
                // }

                // ADD TRANS
                this.camera.rotate([toRotate[0], 0, 0]);
                this.camera.translate(v.negate(movement, movement));

                // tryout
                // const lookAtBefore = math.lookAtPointOnPlane(v.create(), this.camera.position, this.camera.rotation);

                // v.copy(inputOrigin, position);
                // inputOrigin[2] = this.camera.position[2];

                // const move = v.clone(movement);
                // move[2] = this.camera.getZTranslationOfScale(move[2]);

                // v.copy(previousPosition, currentPosition);
                // v.copy(currentPosition, inputOrigin);

                // // apply rotation
                // v.subtract(rotationVector, rotationVector, rotation);
                // this.camera.setRotation(rotationVector);

                // const lookAtAfter = math.lookAtPointOnPlane(v.create(), this.camera.position, this.camera.rotation);
                // if (lookAtAfter) {
                //     // lookAtEntity.setPosition(lookAtAfter);
                //     if (lookAtBefore) {
                //         const targetToCamera = v.subtract(v.create(), this.camera.position, lookAtBefore);
                //         v.rotateX(targetToCamera, targetToCamera, nullVector, glMatrix.toRadian(rotation[0]));
                //         v.add(targetToCamera, targetToCamera, lookAtBefore);

                //         // const targetToCamera = v.subtract(v.create(), this.camera.position, lookAtAfter);
                //         // const delta = v.subtract(v.create(), lookAtAfter, lookAtBefore);
                //         // v.add(targetToCamera, targetToCamera, delta);
                //         // v.add(targetToCamera, targetToCamera, lookAtBefore);
                //         v.copy(this.camera.position, targetToCamera);
                //     }
                // }

                // // @todo move visual along rotation (think move camera)
                // this.moveBy(move, inputOrigin);
            },

            onEnd: (event: MouseEvent|TouchEvent): void => {
                if (isClick === false) {
                    v.subtract(previousPosition, previousPosition, currentPosition);
                    previousPosition[2] = 0;
                    if (v.len(previousPosition) > 5) {
                        return this.userInputStop(inputOrigin, previousPosition);
                    }

                } else {
                    // clicked.
                    // Convert click point, to point on viewpane
                    const viewpanePosition = this.camera.getPosition();
                    // clickTarget in screen space
                    const clickTarget = v.clone(inputOrigin);
                    clickTarget[2] = 0;
                    // convert to screen position to position in viewpane z distance
                    math.invertProject(clickTarget, clickTarget, this.camera.eye, inputOrigin[2]);
                    // adjust target by viewpane translation
                    v.subtract(clickTarget, clickTarget, viewpanePosition);
                    clickTarget[2] = 0;
                    this.notify(EVENT.CLICK, event, clickTarget);
                }

                this.userInputStop(inputOrigin, nullVector);
            }
        });

        screenEl.addEventListener("dblclick", (event: MouseEvent) => {
            const z = this.camera.position[2];
            if (z !== 0) {
                // zoom in
                this.zoomAt(inputOrigin, -z);
            } else {
                // zoom out
                this.scene.fitToViewport();
            }
        });

        // this.fit();
    }

    deactivate(): void {
        this.userInput.deactivate();
    }

    activate(): void {
        this.userInput.activate();
    }

    isActive(): boolean {
        return this.userInput.isActive();
    }

    userInputStart(): void {
        this.isInInteraction = true;
        this.speedSnap.stop();
        this.scene.activate();
        this.notify(EVENT.START);
    }

    userInputStop(origin: v, speedVector: v): void {
        this.isInInteraction = false;
        if (this.scene.isActive()) {
            this.scene.deactivate();
            v.copy(this.speedSnap.from, this.camera.getPosition());
            // this.speedSnap.start(speedVector, origin);
            this.notify(EVENT.STOP);
        }
    }

    setFocus(width: number, height: number): void {
        this.scene.setFocus(width, height);
    }

    repaint(): void {
        this.scene.calculate();
        this.scene.render();
    }

    zoomAt(origin: v, zTranslation: number): void {
        origin[2] = this.camera.position[2];
        this.camera.zoomAt(origin, zTranslation);
        this.repaint();
    }

    moveBy(moveVector: v, origin: v): void {
        this.camera.moveVisual(moveVector, origin);
    }

    addEntity(entity): void {
        this.scene.addEntity(entity);
    }

    fit(): void {
        this.scene.fitToViewport();
    }

    createEntity(elementId): any {
        const entity = new Entity(el(elementId));
        this.addEntity(entity);
        return entity;
    }

    setPosition(position: v): void {
        this.camera.setPosition(position);
    }

    getPosition(): v {
        return this.camera.getPosition();
    }

    getScene(): Scene {
        return this.scene;
    }

    getCamera(): Camera {
        return this.camera;
    }

    getViewpane(): Entity {
        return this.viewpane;
    }

    dispose(): void {
        this.userInput.dispose();
        this.scene.dispose();
    }
}
