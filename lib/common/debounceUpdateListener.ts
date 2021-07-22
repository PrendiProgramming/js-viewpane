"use strict";

import Timeout from "./Timeout";

function debounceUpdateListener(options) {
    options.timeout = options.timeout || 500;
    options.debounce = options.debounce || 250;
    options.start = options.start || Function.prototype;
    options.update = options.update || Function.prototype;
    options.end = options.end || Function.prototype;

    var ACTIVE = false;
    var lastEvent = null;
    var lastUpdate = 0;
    var timeout = new Timeout(function onEnd(now, timeout) {
        ACTIVE = false;
        console.log("DEBOUNCE END");
        options.end(lastEvent);
        lastEvent = null;
    }, options.timeout);

    return function updateDebouncer(event) {
        lastEvent = event;

        if (ACTIVE === false) {
            ACTIVE = true;
            options.start(lastEvent);
            return timeout.start();
        }

        var currentTime = timeout.keepAlive();
        if (lastUpdate + options.debounce < currentTime) {
            lastUpdate = currentTime;
            options.update(lastEvent);
        }
    };
}

export default debounceUpdateListener;
