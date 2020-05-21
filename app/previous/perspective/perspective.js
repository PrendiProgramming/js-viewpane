var columnDimensions = {
    w: 80,
    h: 640,
    d: 80
};

function createFig(box, type) {
    "use strict";
    var fig = document.createElement("figure");
    fig.className = type;
    box.appendChild(fig);
    return fig;
}

function createBox(w, h, d) {
    "use strict";
    var box = document.createElement("div");
    box.className = "box";
    box.style.cssText = "position: absolute; transform-style: preserve-3d;";
    var front = createFig(box, "front");
    front.style.cssText = "width: " + w + "px; height: " + h + "px; transform: translateZ(" + (d/2) + "px);";
    var back = createFig(box, "back");
    back.style.cssText = "width: " + w + "px; height: " + h + "px; transform: translateZ(" + (-d/2) + "px) rotateY(180deg);";
    var left = createFig(box, "left");
    left.style.cssText = "width: " + d + "px; height: " + h + "px; transform: translateX(" + (-d/2) + "px) rotateY(270deg);";
    var right = createFig(box, "right");
    right.style.cssText = "width: " + d + "px; height: " + h + "px; transform: translateX(" + (d/2) + "px) rotateY(-270deg);";
    var top = createFig(box, "top");
    top.style.cssText = "width: " + w + "px; height: " + d + "px; transform: translateY(" + (-d/2) + "px) rotateX(-90deg);";
    var bottom = createFig(box, "bottom");
    bottom.style.cssText = "width: " + w + "px; height: " + d + "px; transform: translateY(" + (h - d/2) + "px) rotateX(90deg);";

    return box;
}

function createColumn(viewpaneEl, x, y, z) {
    "use strict";
    var w = columnDimensions.w; var h = columnDimensions.h; var d = columnDimensions.d;
    var box = createBox(w, h, d);
    box.className += " column";
    box.style.transform = "translate3d(" + x + "px, " + y + "px, " + z + "px)";
    viewpaneEl.appendChild(box);

    var pedestral = createBox(260, 40, 260);
    pedestral.className += " pedestral";
    pedestral.style.transform = "translate3d(" + (x - 90) + "px, " + (y + h) + "px, " + (z) + "px)";
    viewpaneEl.appendChild(pedestral);
}
