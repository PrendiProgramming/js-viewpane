"use strict";

var raf =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    (window as any).mozRequestAnimationFrame ||
    (window as any).msRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 50);
    };

var Loop = {
    EXIT: true,
    CONTINUE: false,

    ENABLED: false,

    animations: [],
    nextAnimations: [],

    add: function (loopObject) {
        if (loopObject.calculate || loopObject.render) {
            Loop.animations.push(loopObject);
            Loop.start();
        }
    },

    start: function () {
        if (Loop.ENABLED === false) {
            Loop.ENABLED = true;
            Loop.tick();
        }
    },

    tick: function () {
        var now = Date.now();
        var i;

        // iterate on current length as new animations may be added
        for (i = 0; i < Loop.animations.length; i += 1) {
            if (Loop.animations[i].calculate(now) !== Loop.EXIT) {
                Loop.nextAnimations.push(Loop.animations[i]);
            }
        }

        swapAnimations();

        for (i = 0; i < Loop.animations.length; i += 1) {
            if (Loop.animations[i].render(now) !== Loop.EXIT) {
                Loop.nextAnimations.push(Loop.animations[i]);
            }
        }

        swapAnimations();

        if (Loop.animations.length > 0) {
            raf.call(window, Loop.tick);
        } else {
            Loop.ENABLED = false;
        }
    },
};

function swapAnimations() {
    var t = Loop.animations;
    t.length = 0;
    Loop.animations = Loop.nextAnimations;
    Loop.nextAnimations = t;
}

export default Loop;
