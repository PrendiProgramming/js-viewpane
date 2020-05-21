import { vec3 as v, mat4, glMatrix } from "gl-matrix";
import * as math from "../math";
import PositionBoundaries from "./PositionBoundaries";

export enum FocusType {
    LARGEST = "fitLargestDimension",
    BOTH = "fitBothDimensions"
}


const origin = v.create();

const defaultOptions = {
    typeOfFocus: FocusType.LARGEST,
    perspective: 1000,
    origin: { x: 0.5, y: 0.5 },
    zoomFactor: 0.25,
    rubberZ: false
}

export default class Camera {
    options;
    typeOfFocus: FocusType;
    adjustFocusBy: "x"|"y"|false;
    rubberZ: boolean;

    readonly eye: v;
    readonly position: v;
    readonly rotation: v;
    /** camera world position and rotation */
    readonly cameraMatrix: mat4;
    /** inverted camera world position and rotation, for viewModelGeneration */
    readonly viewMatrix: mat4;

    readonly $screen: HTMLElement;
    readonly focusPlane: { x: number; y: number };
    readonly screenHalfDimensions: v;
    readonly xyCorrection: PositionBoundaries;
    readonly maxZ: v;
    readonly minZ: v;

    constructor($screen, focusPlane, options) {
        this.options = { ...defaultOptions, ...options };
        this.rubberZ = this.options.rubberZ;

        this.$screen = $screen;
        this.typeOfFocus = this.options.typeOfFocus;
        this.adjustFocusBy = false;
        this.focusPlane = focusPlane;

        this.eye = v.create();
        this.position = v.fromValues(0, 0, 1000);
        this.rotation = v.create();
        this.screenHalfDimensions = v.create();

        this.xyCorrection = new PositionBoundaries();
        this.maxZ = v.create();
        this.minZ = v.create();

        this.cameraMatrix = mat4.create();
        this.viewMatrix = mat4.create();

        this.update();
    }

    rotate(rotation: v): void {
        v.add(this.rotation, this.rotation, rotation);
    }

    translate(movement: v): v {
        return v.add(this.position, this.position, movement);
    }

    getLeft(out = v.create()): v {
        const { cameraMatrix } = this;
        const upVector = v.set(out, cameraMatrix[0], cameraMatrix[4], cameraMatrix[8]);
        return upVector;
    }

    getUp(out = v.create()): v {
        const { cameraMatrix } = this;
        const upVector = v.set(out, cameraMatrix[1], cameraMatrix[5], cameraMatrix[9]);
        return upVector;
    }

    getForward(out = v.create()): v {
        const { cameraMatrix } = this;
        const forwardVector = v.set(out, cameraMatrix[2], cameraMatrix[6], cameraMatrix[10]);
        // @check why is this required, forward is pointing in wrong z-direction. construction error?
        forwardVector[2] = -forwardVector[2];
        return forwardVector;
    }

    getTranslation(out = v.create()): v {
        return mat4.getTranslation(out, this.cameraMatrix);
    }

    updateMatrix(): void {
        const { cameraMatrix, viewMatrix, position, rotation } = this;

        mat4.identity(cameraMatrix);
        // scale, rotate, then translate SRT; "rotate first then translate"
        mat4.translate(cameraMatrix, cameraMatrix, position);
        mat4.rotateZ(cameraMatrix, cameraMatrix, glMatrix.toRadian(rotation[2]));
        mat4.rotateX(cameraMatrix, cameraMatrix, glMatrix.toRadian(rotation[0]));
        mat4.invert(viewMatrix, cameraMatrix);

        // projection-part: move to screen center
        // const offset = v.fromValues(this.eye[0], this.eye[1], 0);
        // mat4.translate(viewMatrix, viewMatrix, offset);
    }


    setFocus(width, height): void {
        this.focusPlane.x = parseFloat(width);
        this.focusPlane.y = parseFloat(height);
    }

    update(): void {
        const screenDimensions = this.$screen.getBoundingClientRect();
        v.set(this.screenHalfDimensions, screenDimensions.width * 0.5, screenDimensions.height * 0.5, 0);

        this.adjustFocusBy = false;
        if (this.typeOfFocus === FocusType.LARGEST) {
            const xRatio = (this.focusPlane.x / screenDimensions.width);
            const yRatio = (this.focusPlane.y / screenDimensions.height);
            this.adjustFocusBy = xRatio > yRatio ? "x" : "y";
        }

        v.set(this.eye,
            screenDimensions.width * this.options.origin.x,
            screenDimensions.height * this.options.origin.y,
            this.options.perspective
        );

        // position boundaries of camera

        // z, near plane
        v.set(this.maxZ,
            this.options.zoomFactor * this.eye[2],
            this.options.zoomFactor * this.eye[2],
            0
        );
        // z, far plane
        v.set(this.minZ,
            math.getZWhereSizeFitsViewport(this.eye, this.focusPlane.x, screenDimensions.width),
            math.getZWhereSizeFitsViewport(this.eye, this.focusPlane.y, screenDimensions.height),
            0
        );

        this.$screen.style.webkitPerspective = this.eye[2] + "px";
        this.$screen.style.perspective = this.eye[2] + "px";
        this.$screen.style.webkitPerspectiveOrigin = this.eye[0] + "px " + this.eye[1] + "px";
        this.$screen.style.perspectiveOrigin = this.eye[0] + "px " + this.eye[1] + "px";
    }

    getZTranslationOfScale(scale): number {
        if (scale === 1) {
            return 0;
        } else {
            return this.position[2] - (this.eye[2] - scale * (this.eye[2] - this.position[2]));
        }
    }

    // z translation where focusplane fits to screen dimensions
    getZFit(): number {
        const targetWidth = 2 * this.screenHalfDimensions[0];
        const targetHeight = 2 * this.screenHalfDimensions[1];

        return Math.min(
            math.getZWhereSizeFitsViewport(this.eye, this.focusPlane.x, targetWidth),
            math.getZWhereSizeFitsViewport(this.eye, this.focusPlane.y, targetHeight)
        );
    }

    getZRange(): { min: number; max: number } {
        let minZ: number;
        if (this.typeOfFocus === FocusType.BOTH) {
            minZ = Math.max(this.minZ[0], this.minZ[1]);
        } else if (this.typeOfFocus === FocusType.LARGEST) {
            minZ = Math.min(this.minZ[0], this.minZ[1]);
        }
        const maxZ = Math.min(this.maxZ[0], this.maxZ[1]);
        return {
            max: maxZ,
            min: minZ
        }
    }

    getRestrictToFocusZ(movement: v = origin): number {
        const targetZ = this.position[2] + movement[2];
        const toAdjustWidth = targetZ < this.minZ[0];
        const toAdjustHeight = targetZ < this.minZ[1];

        if (this.typeOfFocus === FocusType.BOTH && (toAdjustWidth || toAdjustHeight)) {
            return Math.max(this.minZ[0], this.minZ[1]);

        } else if (this.typeOfFocus === FocusType.LARGEST && (toAdjustWidth && toAdjustHeight)) {
            return Math.min(this.minZ[0], this.minZ[1]);

        } else if (targetZ > this.maxZ[0] || targetZ > this.maxZ[1]) {
            return Math.min(this.maxZ[0], this.maxZ[1]);
        }

        return targetZ;
    }

    getRestrictToFocusXY(movement: v = origin): PositionBoundaries {
        const xyCorrection = this.xyCorrection.reset();

        const rz = (this.eye[2] - this.position[2]) / (this.eye[2] - 0);
        const availableWidth = this.screenHalfDimensions[0] * rz;
        const availableHeight = this.screenHalfDimensions[1] * rz;

        const currentWidth = 0.5 * this.focusPlane.x;
        const currentHeight = 0.5 * this.focusPlane.y;

        const deltaWidth = Math.abs(availableWidth - currentWidth);
        const deltaHeight = Math.abs(availableHeight - currentHeight);

        const cz = this.position[2] / this.eye[2];
        const cameraX = this.screenHalfDimensions[0] + (this.eye[0] - this.screenHalfDimensions[0]) * cz;
        const cameraY = this.screenHalfDimensions[1] + (this.eye[1] - this.screenHalfDimensions[1]) * cz;

        const rx = cameraX - (this.position[0] + movement[0] + currentWidth);
        const ry = cameraY - (this.position[1] + movement[1] + currentHeight);


        // move to screen center
        if (availableWidth - currentWidth > 0) {
            xyCorrection.left = rx;

        } else if (Math.abs(rx) - deltaWidth > 0) {
            // addToFix (left -, right +)
            xyCorrection.left = Math.min(0, rx + deltaWidth);
            xyCorrection.right = Math.max(0, rx - deltaWidth);
        }

        // move to screen center
        if (availableHeight - currentHeight > 0) {
            xyCorrection.top = ry;

        } else if (Math.abs(ry) - deltaHeight > 0) {
            // addToFix (top -, bottom +)
            xyCorrection.top = Math.min(0, ry + deltaHeight);
            xyCorrection.bottom = Math.max(0, ry - deltaHeight);
        }

        return xyCorrection;
    }

    fitToViewport(): void {
        // z translation where plane size matches viewport size
        v.set(this.position, 0, 0, this.getZFit());
        // positional corrections to center plane
        const bounds = this.getRestrictToFocusXY();
        this.position[0] = bounds.left + bounds.right;
        this.position[1] = bounds.top + bounds.bottom;
        this.alignToPixelGrid();
    }

    // sets camera back within boundaries
    moveToFocus(): void {
        const { position } = this;
        const restrictedZ = this.getRestrictToFocusZ();
        this.zoomAt(position, restrictedZ - position[2]);
        const restrictedXY = this.getRestrictToFocusXY();
        v.set(position,
            position[0] + restrictedXY.right + restrictedXY.left,
            position[1] + restrictedXY.top + restrictedXY.bottom,
            position[2]
        );
        this.alignToPixelGrid();
    }

    getRubberband(out: v): v {
        const restrictedZ = this.getRestrictToFocusZ();
        const restrictedXY = this.getRestrictToFocusXY();
        return v.set(out,
            restrictedXY.left + restrictedXY.right,
            restrictedXY.top + restrictedXY.bottom,
            restrictedZ - this.position[2]
        );
    }

    convertToWorldTranslation(out: v, userInput: v, origin: v): v {
        const { position, eye } = this;
        math.zoomAtAndMoveVisual(out, position, eye, origin, userInput);
        return v.subtract(out, out, position);
    }

    // move and apply rubberband based on inputvector
    moveVisual(moveVector: v, origin: v, rubberForce = 0.3): void {
        // @todo reuse worldTranslation vector
        const worldTranslation = v.create();
        this.convertToWorldTranslation(worldTranslation, moveVector, origin);

        const { position, eye } = this;
        const majorZ = Math.abs(moveVector[2]) > (Math.abs(moveVector[0]) + Math.abs(moveVector[1]));

        // rubberZ
        // not really necessary (tiny image is feedback enough)
        const zoomOut = worldTranslation[2] < 0;
        const zoomIn = worldTranslation[2] > 0;
        const restrictedZ = this.getRestrictToFocusZ([worldTranslation[0], worldTranslation[1], worldTranslation[2]]);
        const deltaZ = restrictedZ - position[2] - worldTranslation[2];
        if (deltaZ < 0 && zoomIn || deltaZ > 0 && zoomOut) {
            if (this.rubberZ === true) {
                // !z might need hard limits
                math.zoomAt(position, position, eye, origin, -worldTranslation[2] * (1 - rubberForce));
            } else {
                math.zoomAt(position, position, eye, origin, deltaZ);
            }
        }

        // adjust movement by rubber, if any and not currently zooming
        if (majorZ === false) {
            const restrictedXY = this.getRestrictToFocusXY();
            if ((restrictedXY.left + restrictedXY.right) !== 0) {
                worldTranslation[0] *= rubberForce;
            }
            if ((restrictedXY.top + restrictedXY.bottom) !== 0) {
                worldTranslation[1] *= rubberForce;
            }
        }

        v.add(position, position, v.fromValues(worldTranslation[0], worldTranslation[1], worldTranslation[2]));
    }

    getPosition(): v {
        return this.position;
    }

    setPosition(position: v): v {
        return v.copy(this.position, position);
    }


    setRotation(rotation: v): void {
        v.copy(this.rotation, rotation);
    }

    zoomAt(origin: v, zTranslation: number): void {
        math.zoomAt(this.position, this.position, this.eye, origin, zTranslation);
    }

    alignToPixelGrid(): void {
        const devicePixelRatio = window.devicePixelRatio || 1;
        const x = Math.round(this.position[0] * devicePixelRatio) / devicePixelRatio;
        const y = Math.round(this.position[1] * devicePixelRatio) / devicePixelRatio;
        const z = this.position[2];
        v.set(this.position, x, y, z);
    }
}
