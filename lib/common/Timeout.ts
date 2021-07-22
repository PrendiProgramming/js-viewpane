"use strict";

import Loop from "./loop";

// Usage
// var timeout = new Timeout(callback, 1000);
// timeout.start();
function Timeout(callback, ttl) {
    this.STATE = Loop.EXIT;
    this.ttl = ttl;
    this.sendTimeout = callback || Function.prototype;
}

Timeout.prototype.start = function () {
    this.keepAlive();
    if (this.isActive() === false) {
        this.STATE = Loop.CONTINUE;
        Loop.add(this);
    }
    return this;
};

Timeout.prototype.isActive = function () {
    return this.STATE === Loop.CONTINUE;
};

Timeout.prototype.getTime = function () {
    return this.lastUpdate;
};

Timeout.prototype.calculate = function (now) {
    this.time = now - this.lastUpdate;
    if (this.time > this.ttl) {
        this.sendTimeout(now, now - this.lastUpdate);
        this.STATE = Loop.EXIT;
    }
    return this.STATE;
};

// dummy function, required to be added in loop
Timeout.prototype.render = Function.prototype;

Timeout.prototype.keepAlive = function () {
    this.lastUpdate = Date.now();
    return this.lastUpdate;
};

export default Timeout;
