"use strict";


var vector = require("../common/vector");


var FOCUS_TYPE = {
    LARGEST: "fitLargestDimension",
    BOTH: "fitBothDimensions"
};

Camera.FOCUS_TYPE = FOCUS_TYPE;

function Camera($screen, focusPlane, options) {
    options.typeOfFocus = options.typeOfFocus || FOCUS_TYPE.LARGEST;
    options.perspective = options.perspective == null ? 1000 : options.perspective;
    options.origin = options.origin || { x: 0.5, y: 0.5 };
    options.zoomFactor = options.zoomFactor == null ? 0.25 : options.zoomFactor;

    // console.log("perspective", options.perspective);
    // console.log("perspective origin", options.origin);

    this.options = options;
    this.$screen = $screen;
    this.typeOfFocus = options.typeOfFocus;
    this.adjustFocusBy = false;
    this.focusPlane = focusPlane;

    this.eye = vector.create();
    this.position = vector.create();
    this.screenHalfDimensions = vector.create();

    this.xyCorrection = new PositionBoundaries();
    this.maxZ = vector.create();
    this.minZ = vector.create();

    this.update();
}

Camera.prototype.setFocus = function (width, height) {
    this.focusPlane.x = parseFloat(width);
    this.focusPlane.y = parseFloat(height);
}

Camera.prototype.update = function () {
    var screenDimensions = this.$screen.getBoundingClientRect();
    this.screenHalfDimensions.x = screenDimensions.width * 0.5;
    this.screenHalfDimensions.y = screenDimensions.height * 0.5;

    this.adjustFocusBy = false;
    if (this.typeOfFocus === FOCUS_TYPE.LARGEST) {
        var xRatio = (this.focusPlane.x / screenDimensions.width);
        var yRatio = (this.focusPlane.y / screenDimensions.height);
        this.adjustFocusBy = xRatio > yRatio ? "x" : "y";
    }

    this.eye.setValues(
        screenDimensions.width * this.options.origin.x,
        screenDimensions.height * this.options.origin.y,
        this.options.perspective
    );

    // position boundaries of camera

    // z, near plane
    this.maxZ.setValues(this.options.zoomFactor * this.eye.z, this.options.zoomFactor * this.eye.z, 0);
    // z, far plane
    this.minZ.setValues(
        getZWhereSizeFitsViewport(this.eye, this.focusPlane.x, screenDimensions.width),
        getZWhereSizeFitsViewport(this.eye, this.focusPlane.y, screenDimensions.height),
        0
    );

    this.$screen.style.webkitPerspective = this.eye.z + "px";
    this.$screen.style.perspective = this.eye.z + "px";
    this.$screen.style.webkitPerspectiveOrigin = this.eye.x + "px " + this.eye.y + "px";
    this.$screen.style.perspectiveOrigin = this.eye.x + "px " + this.eye.y + "px";
};

Camera.prototype.getZTranslationOfScale = function (scale) {
    if (scale === 1) {
        return 0;
    } else {
        return this.position.z - (this.eye.z - scale * (this.eye.z - this.position.z));
    }
};

// z translation where focusplane fits to screen dimensions
Camera.prototype.getZFit = function () {
    var targetWidth = 2 * this.screenHalfDimensions.x;
    var targetHeight = 2 * this.screenHalfDimensions.y;

    return Math.min(
        getZWhereSizeFitsViewport(this.eye, this.focusPlane.x, targetWidth),
        getZWhereSizeFitsViewport(this.eye, this.focusPlane.y, targetHeight)
    );
};

Camera.prototype.getRestrictToFocusZ = function (movement) {
    movement = movement || vector.origin;
    var targetZ = this.position.z + movement.z;
    var toAdjustWidth = targetZ < this.minZ.x;
    var toAdjustHeight = targetZ < this.minZ.y;

    if (this.typeOfFocus === FOCUS_TYPE.BOTH && (toAdjustWidth || toAdjustHeight)) {
        return Math.max(this.minZ.x, this.minZ.y);

    } else if (this.typeOfFocus === FOCUS_TYPE.LARGEST && (toAdjustWidth && toAdjustHeight)) {
        return Math.min(this.minZ.x, this.minZ.y);

    } else if (targetZ > this.maxZ.x || targetZ > this.maxZ.y) {
        return Math.min(this.maxZ.x, this.maxZ.y);
    }

    return targetZ;
};

Camera.prototype.getZRange = function () {
    var minZ;
    var maxZ;

    if (this.typeOfFocus === FOCUS_TYPE.BOTH) {
        minZ = Math.max(this.minZ.x, this.minZ.y);
    } else if (this.typeOfFocus === FOCUS_TYPE.LARGEST) {
        minZ = Math.min(this.minZ.x, this.minZ.y);
    }
    maxZ = Math.min(this.maxZ.x, this.maxZ.y);

    return {
        max: maxZ,
        min: minZ
    };
};

Camera.prototype.getRestrictToFocusXY = function (movement) {
    movement = movement || vector.origin;
    var xyCorrection = this.xyCorrection.reset();

    var rz = (this.eye.z - this.position.z) / (this.eye.z - 0);
    var availableWidth = this.screenHalfDimensions.x * rz;
    var availableHeight = this.screenHalfDimensions.y * rz;

    var currentWidth = 0.5 * this.focusPlane.x;
    var currentHeight = 0.5 * this.focusPlane.y;

    var deltaWidth = Math.abs(availableWidth - currentWidth);
    var deltaHeight = Math.abs(availableHeight - currentHeight);

    var cz = this.position.z / this.eye.z;
    var cameraX = this.screenHalfDimensions.x + (this.eye.x - this.screenHalfDimensions.x) * cz;
    var cameraY = this.screenHalfDimensions.y + (this.eye.y - this.screenHalfDimensions.y) * cz;

    var rx = cameraX - (this.position.x + movement.x + currentWidth);
    var ry = cameraY - (this.position.y + movement.y + currentHeight);


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
};

Camera.prototype.moveVisual = function (movement2D) {
    this.position.moveVisual(this.eye, movement2D);
};

Camera.prototype.getPosition = function () {
    return this.position;
};

Camera.prototype.setPosition = function (position) {
    return this.position.set(position);
};

Camera.prototype.zoomAt = function (origin, zTranslation) {
    this.position.zoomAt(this.eye, origin, zTranslation);
};

Camera.prototype.alignToPixelGrid = function () {
    var devicePixelRatio = window.devicePixelRatio || 1;
    var x = Math.round(this.position.x * devicePixelRatio) / devicePixelRatio;
    var y = Math.round(this.position.y * devicePixelRatio) / devicePixelRatio;
    var z = this.position.z;

    this.position.setValues(x, y, z);
};


function getZWhereSizeFitsViewport(eye, size, viewportSize) {
    return eye.z - eye.z * (size / viewportSize);
}

function PositionBoundaries() {
    this.toString = function () {
        return "(" + this.left + "," + this.top + "," + this.right + "," + this.bottom + ")";
    };
    this.reset = function () {
        this.left = this.right = this.top = this.bottom = 0;
        return this;
    };
    this.reset();
}


module.exports = Camera;

