import image from "./map.png";
import Camera from "../lib/camera/orbitcamera";
import ray from "../lib/camera/orbitcamera/ray";
import orbitTranslation from "../lib/camera/orbitcamera/orbitTranslation";
import getPointOnMap from "../lib/camera/orbitcamera/getPointOnMap";
import Scene from "./Scene";
import UserInput from "../lib/userinput";
import { vec3 as v, glMatrix, mat4 } from "gl-matrix";
import layoutService from "../lib/service/layoutService";
glMatrix.setMatrixArrayType(Array);

const s = (p: v, precision = 1) => p.map(x => x.toFixed(precision));

// setup world
const world = v.fromValues(3960, 3060, 0);
const worldCenter = v.scale(v.create(), world, 0.5);
const worldOffset = v.scale(v.create(), world, -0.5);
const $world = document.querySelector(".world") as HTMLElement;
$world.setAttribute("data-position", `${JSON.stringify(worldOffset)}`);
$world.style.cssText = `width:${world[0]}px;height:${world[1]}px;`
$world.style.backgroundImage = `url(${image})`;


const $vp = document.querySelector(".viewport") as HTMLElement;
const $camera = document.querySelector(".camera") as HTMLElement;
$vp.style.perspective = "1000px";
// $camera.style.cssText = `position: absolute; top:50%; left:50%; transform-style:preserve-3d; transform:translateZ(${$vp.style.perspective});`;
$camera.style.cssText = `position: absolute; top:50%; left:50%; transform-style:preserve-3d;`;
const camera = new Camera();
const scene = new Scene($camera);
const render = () => {
    camera.calculate(true);
    scene.render(camera.viewMatrix);
};


const nullVector = v.create();
let bound = $vp.getBoundingClientRect();
const screenOffset = v.fromValues(bound.width / 2, bound.height / 2, 0);
const interaction = {
    start: v.create(),
    previous: v.create(),
    now: v.create(),
    end: v.create()
};

layoutService.addObserver("end", () => {
    bound = $vp.getBoundingClientRect();
    v.set(screenOffset, bound.width / 2, bound.height / 2, 0);
});

const $rotationCenter = document.querySelector(".rotation-center") as HTMLElement;
function updateRotationCenter() {
    const pos = v.transformMat4(v.create(), camera.rotationCenter, camera.viewMatrix);
    $rotationCenter.style.transform = `translate3d(${pos.join("px,")}px)`;
}

// click target on screen
function getClickTarget(out: v, pointOnScreen: v, toOrigin = screenOffset) {
    return v.set(out, pointOnScreen[0] - toOrigin[0], pointOnScreen[1] - toOrigin[1], 0);
}

function getClickDirection(out: v, clickTarget: v, perspective = camera.eye[2]) {
    v.set(out, clickTarget[0], clickTarget[1], -perspective);
    return v.normalize(out, out);
}

const input = new UserInput($vp, {
    onStart(origin: v) {
        v.copy(interaction.start, origin);
        v.copy(interaction.now, origin);
        v.copy(interaction.previous, origin);

        const rotationCenter = getClickTarget(v.create(), interaction.start);
        camera.setRotationCenter(rotationCenter);
        // camera.setRotationCenter(v.create());
        updateRotationCenter();
    },

    onUpdate(origin: v, movement = nullVector, rotation = nullVector) {
        v.copy(interaction.now, origin);

        const currentClickTarget = getClickTarget(v.create(), interaction.previous);
        const zoom = v.fromValues(0, 0, movement[2]);

        if (movement !== nullVector) {
            const next = getClickTarget(v.create(), interaction.now);
            const worldMove = orbitTranslation(v.create(), camera, currentClickTarget, next);
            camera.translate(worldMove);
        }

        if (zoom[2] !== 0) {
            // scale factor to z-translation using simple intercept theorem
            const scale = zoom[2];
            const [,,worldZ] = mat4.getTranslation(v.create(), camera.viewMatrix);
            const eyeToCurrent = camera.eye[2] - worldZ;
            const zTranslation = (scale * eyeToCurrent - eyeToCurrent);

            // fetch zoom direction and scale zoom-vector so that z = zTranslsation of scale
            const zoomDirection = getClickDirection(v.create(), currentClickTarget);
            v.scale(zoomDirection, zoomDirection, zTranslation/-zoomDirection[2]);

            // apply movement
            camera.translate(zoomDirection);
        }

        if (rotation !== nullVector) {
            camera.rotate(rotation);
        }

        render();
        v.copy(interaction.previous, interaction.now);
    },

    onEnd() {
        v.copy(interaction.end, interaction.now);

        camera.removeRubberband();
        camera.calculate();
        render();

        // click target on screen
        const target = getClickTarget(v.create(), interaction.now, screenOffset);
        const targetOnMap = getPointOnMap(v.create(), camera, target, worldCenter);
        // console.log("target on map", s(targetOnMap));

        // can construct all points from single corner (negate)
        const topLeft = v.scale(v.create(), worldCenter, -1);
        v.transformQuat(topLeft, topLeft, camera.rotationQuat);

        // const topLeftTranslated = v.fromValues(-1000, -650, 0);
        // v.transformMat4(topLeftTranslated, topLeftTranslated, camera.viewMatrix);
        // console.log(topLeft, topLeftTranslated);
    }
});

render();

// @ts-ignore
window.render = render;
// @ts-ignore
window.camera = camera;
// @ts-ignore
window.scene = scene;
