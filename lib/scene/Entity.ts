"use strict";

import vector from "../common/vector";

/**
 * Physical viewpane representation - manages positioning.
 *
 * @param {HtmlElement} element - of the viewpane
 */
function Viewpane(element) {
    this.element = element;
    this.style = element.style;
    this.position = vector.create();
    this.rotation = vector.create();
}

Viewpane.prototype.getPosition = function () {
    return this.position;
};

Viewpane.prototype.setPosition = function (vector) {
    return this.position.set(vector);
};

Viewpane.prototype.getRotation = function () {
    return this.rotation;
};

Viewpane.prototype.setRotation = function (rotate) {
    return this.rotation.set(rotate);
};

Viewpane.prototype.calculate = function (camera) {
    this.transform =
        this.position.toTranslate(camera) + " " + this.rotation.toRotate();
};

Viewpane.prototype.render = function render() {
    var transform = this.transform;
    this.style.webkitTransform = transform;
    this.style.mozTransform = transform;
    this.style.transform = transform;
};

Viewpane.prototype.dispose = function () {
    this.transform = "";
    this.render();
};

/**
 * Move position relative to current position
 *
 * @param  {Vector} vector  - relative position
 */
Viewpane.prototype.add = function (vector) {
    this.position.add(vector);
};

export default Viewpane;
