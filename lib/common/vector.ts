"use strict";

var vectorPool = [];
var nullVector = { x: 0, y: 0, z: 0 };
function create(x?: number, y?: number, z?: number) {
    if (vectorPool.length === 0) {
        return new Vector(x, y, z);
    } else {
        return vectorPool.pop().setValues(x || 0, y || 0, z || 0);
    }
}

function dispose(vector) {
    vectorPool.push(vector);
}

function Vector(x?: number, y?: number, z?: number) {
    this.setValues(x || 0, y || 0, z || 0);
}

Vector.prototype.setValues = function (x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
};

Vector.prototype.reset = function () {
    this.setValues(0, 0, 0);
    return this;
};

Vector.prototype.dispose = function () {
    vectorPool.push(this);
};

Vector.prototype.clone = function () {
    return create(this.x, this.y, this.z);
};

Vector.prototype.set = function (vector) {
    return this.setValues(vector.x, vector.y, vector.z);
};

Vector.prototype.setDelta = function (a, b) {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;
    return this;
};

Vector.prototype.add = function (vector) {
    this.x += vector.x;
    this.y += vector.y;
    this.z += vector.z;
    return this;
};

Vector.prototype.subtract = function (vector) {
    this.x -= vector.x;
    this.y -= vector.y;
    this.z -= vector.z;
    return this;
};

Vector.prototype.negate = function () {
    return this.multiplyScalar(-1);
};

Vector.prototype.multiply = function (vector) {
    this.x *= vector.x;
    this.y *= vector.y;
    this.z *= vector.z;
    return this;
};

Vector.prototype.addScalar = function (s) {
    this.x += s;
    this.y += s;
    this.z += s;
    return this;
};

Vector.prototype.multiplyScalar = function (s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
};

Vector.prototype.normalize = function () {
    var length = this.getLength();
    return this.multiplyScalar(1 / length);
};

Vector.prototype.getLength = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
};

// move by z at point2D in camera direction
Vector.prototype.zoomAt = function (eye, point2D, zTranslation) {
    var rz = zTranslation / eye.z;
    // move given point in direction of eye view
    this.x += (eye.x - point2D.x) * rz;
    this.y += (eye.y - point2D.y) * rz;
    this.z += zTranslation;
    return this;
};

Vector.prototype.zoomAtAndMoveVisual = function (eye, origin, movement) {
    // zoomAt
    var rz = movement.z / eye.z;
    this.x += (eye.x - origin.x) * rz;
    this.y += (eye.y - origin.y) * rz;
    this.z += movement.z;
    // move Visual
    rz = this.z / eye.z;
    this.x += movement.x * (1 - rz);
    this.y += movement.y * (1 - rz);
    return this;
};

// TODO: add explanation
Vector.prototype.scaleByZ = function (camera, z) {
    var rz = camera.z / (camera.z - z);
    this.x *= rz;
    this.y *= rz;
    this.z = z;
};

// project from current z to z = 0
Vector.prototype.project = function (camera) {
    var rz = camera.z / (this.z - camera.z);
    // https://en.wikipedia.org/wiki/3D_projection
    this.x = camera.x - (this.x - camera.x) * rz;
    this.y = camera.y - (this.y - camera.y) * rz;
    this.z = 0;
    return this;
};

// project z = 0 to given zPosition
Vector.prototype.invertProject = function (eye, zPosition) {
    this.z = 0;
    return this.zoomAt(eye, this, zPosition);
};

// visually map movement from z=0 to current z-position
Vector.prototype.moveVisual = function (eye, movement) {
    var rz = this.z / eye.z;
    this.x += movement.x * (1 - rz);
    this.y += movement.y * (1 - rz);
    return this;
};

Vector.prototype.toTranslate = function (offset) {
    offset = offset || nullVector;
    return (
        "translate3d(" +
        (this.x + offset.x) +
        "px, " +
        (this.y + offset.y) +
        "px, " +
        (this.z + offset.z) +
        "px)"
    );
};

Vector.prototype.toRotate = function () {
    return (
        "rotateX(" +
        this.x +
        "deg) rotateY(" +
        this.y +
        "deg) rotateZ(" +
        this.z +
        "deg)"
    );
};

Vector.prototype.toString = function () {
    return "[" + this.x + ", " + this.y + ", " + this.z + "]";
};

export default {
    create: create,
    dispose: dispose,
    origin: new Vector(),
};
