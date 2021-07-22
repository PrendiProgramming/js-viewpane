"use strict";

import touch from "./touch";
import mouse from "./mouse";
import layoutService from "../service/layoutService";

function UserInput($element, eventListener) {
    var self = this;
    this.$element = $element;
    this.elementBound = {};

    this.updateElementBound();

    this.__updateLayout = function updateLayout() {
        self.updateElementBound();
    };
    layoutService.addObserver("end", this.__updateLayout);

    // receives startposition of user interaction
    this.onStart = eventListener.onStart || Function.prototype;
    // receives movement vector from last to current position, where z-value being scale instead of position
    this.onScale = eventListener.onScale || Function.prototype;
    // receives no arguments
    this.onEnd = eventListener.onEnd || Function.prototype;
    // receives startposition of user interaction
    this.onChange = eventListener.onChange || Function.prototype;

    this.controls = [];
    this.controls.push(
        touch(
            $element,
            this.elementBound,
            this.onStart,
            this.onScale,
            this.onEnd
        )
    );
    this.controls.push(
        mouse(
            $element,
            this.elementBound,
            this.onStart,
            this.onScale,
            this.onEnd
        )
    );
}

UserInput.prototype.isActive = function () {
    return this.controls[0].activated;
};

UserInput.prototype.deactivate = function () {
    for (var i = 0, l = this.controls.length; i < l; i += 1) {
        this.controls[i].activated = false;
    }
};

UserInput.prototype.activate = function () {
    for (var i = 0, l = this.controls.length; i < l; i += 1) {
        this.controls[i].activated = true;
    }
};

UserInput.prototype.updateElementBound = function () {
    var bound = this.$element.getBoundingClientRect();
    this.elementBound.top =
        bound.top +
        (document.documentElement.scrollTop || document.body.scrollTop);
    this.elementBound.left =
        bound.left +
        (document.documentElement.scrollLeft || document.body.scrollLeft);
    this.elementBound.width = bound.width;
    this.elementBound.height = bound.height;
};

UserInput.prototype.dispose = function () {
    layoutService.removeObserver("end", this.__updateLayout);
    this.__updateLayout = null;
    for (var i = 0, l = this.controls.length; i < l; i += 1) {
        this.controls[i].dispose();
    }
};

export default UserInput;
