import orbitRotation from "../lib/camera/orbitcamera/orbitRotation";
import { vec3 as v, mat4, quat, glMatrix } from "gl-matrix";
import intersectRayPlane from "../lib/math/intersectRayPlane";
glMatrix.setMatrixArrayType(Array);

const s = (p: v, precision = 1) => p.map(x => x.toFixed(precision));

const $vp = document.querySelector(".viewport") as HTMLElement;
$vp.style.perspective = "1000px";

function rayWorld(out: v, clickTarget: v, camera, perspective = 1000): v {
    // clickTarget is in screen/camera-space
    const eye = v.fromValues(0, perspective, 0);
    const clickDirection = v.subtract(v.create(), clickTarget, eye);
    v.normalize(clickDirection, clickDirection);

    // where is our plane-center in camera-space?
    // center is at origin, camera offset is from origin
    const planePosition = mat4.getTranslation(v.create(), camera.viewMatrix);

    const planeNormal = v.transformQuat(
        v.create(),
        v.fromValues(0, 1, 0),
        quat.conjugate(quat.create(), camera.rotationQuat)
    );

    // plane distance from origina
    const distance = -v.dot(planeNormal, planePosition);
    console.log(planePosition, planeNormal);
    // point on plane
    intersectRayPlane(out, eye, clickDirection, planeNormal, distance);
    return out;
}


function getMatrix(position: v, rotateAt: v, rotation: v): [mat4, mat4, quat] {
    const rotationQ = orbitRotation(quat.create(), rotation);
    const toObject = mat4.fromTranslation(mat4.create(), rotateAt);
    const rM = mat4.fromQuat(mat4.create(), rotationQ);
    const cameraMatrix = mat4.create();

    mat4.fromTranslation(cameraMatrix, v.subtract(v.create(), position, rotateAt));
    mat4.multiply(cameraMatrix, rM, cameraMatrix);
    mat4.multiply(cameraMatrix, toObject, cameraMatrix);

    const viewMatrix = mat4.invert(mat4.create(), cameraMatrix);
    return [cameraMatrix, viewMatrix, rotationQ];
}

function rotateAt(nodes, position: v, rotateAt: v, rotation: v) {
    nodes[1].style.transform = `translate3d(${rotateAt.join("px,")}px)`;
    nodes[2].style.transform = `translate3d(${position.join("px,")}px)`;

    const M1 = getMatrix(position, rotateAt, rotation);
    const M2 = getMatrix(v.add(v.create(), v.fromValues(20, 20, 0), position), rotateAt, rotation);

    // nodes[5].style.transform = `matrix3d(${cameraMatrix.join(",")})`;
    nodes[3].style.transform = `matrix3d(${M1[0].join(",")})`;
    nodes[4].style.transform = `matrix3d(${M2[0].join(",")})`;

    nodes[5].style.transform = `matrix3d(${M1[1].join(",")})`;
    nodes[6].style.transform = `matrix3d(${M2[1].join(",")})`;

    const click = v.fromValues(-40, 0, 0);
    const c1 = { cameraMatrix: M1[0], viewMatrix: M1[1], rotationQuat: M1[2], position };
    const p1 = rayWorld(v.create(), click, c1);
    nodes[7].style.transform = `translate3d(${p1.join("px,")}px)`;

    const c2 = { cameraMatrix: M2[0], viewMatrix: M2[1], rotationQuat: M2[2], position };
    const p2 = rayWorld(v.create(), click, c2);
    nodes[8].style.transform = `translate3d(${p2.join("px,")}px)`;

    console.log(p1, p2);
}

const rotation = v.fromValues(0, 0, -30);
const rAtOrigin = Array.from(document.getElementById("transform-1").children) as Array<HTMLElement>;
rotateAt(rAtOrigin, v.fromValues(0,40,0), v.fromValues(0,0,0), rotation);

const rAtCamera = Array.from(document.getElementById("transform-2").children) as Array<HTMLElement>;
rotateAt(rAtCamera, v.fromValues(40,40,0), v.fromValues(40,0,0), rotation);

const rBetween = Array.from(document.getElementById("transform-3").children) as Array<HTMLElement>;
rotateAt(rBetween, v.fromValues(40,40,0), v.fromValues(20,0,0), rotation);



function setScenario() {
    const position = v.fromValues(40, 40, 0);
    const rotation = v.fromValues(0, 0, -30);
    const center = v.fromValues(80,0,0);
    const M = getMatrix(position, center, rotation);

    const $rotateAt = document.querySelector("#scenario-1 .point-rotation") as HTMLElement;
    $rotateAt.style.transform = `translate3d(${center.join("px,")}px)`;

    const $camera = document.querySelector("#scenario-1 .camera") as HTMLElement;
    const rotationM = mat4.fromQuat(mat4.create(), quat.conjugate(quat.create(), M[2] as quat));
    const camPosition = mat4.getTranslation(v.create(), M[0]);
    const camTranslation = mat4.fromTranslation(mat4.create(), camPosition);
    const camInView = mat4.multiply(mat4.create(), camTranslation, rotationM);
    $camera.style.transform = `matrix3d(${camInView.join(",")})`;

    const $plane1 = document.querySelector("#scenario-1 .plane-1") as HTMLElement;
    $plane1.style.transform = `matrix3d(${M[1].join(",")})`;

    const c1 = { cameraMatrix: M[0], viewMatrix: M[1], rotationQuat: M[2], position };
    const point1 = rayWorld(v.create(), v.fromValues(0, 0, 0), c1);
    const $point1 = document.querySelector("#scenario-1 .point-1") as HTMLElement;
    $point1.style.transform = `translate3d(${point1.join("px,")}px)`;

    const point2 = rayWorld(v.create(), v.fromValues(-40, 0, 0), c1);
    const $point2 = document.querySelector("#scenario-1 .point-2") as HTMLElement;
    $point2.style.transform = `translate3d(${point2.join("px,")}px)`;

    const delta = v.subtract(v.create(), point1, point2);
    console.log("delta", delta);
    const cam2Position = v.add(v.create(), position, delta);
    const $cam2 = document.querySelector("#scenario-1 .camera-translate") as HTMLElement;
    $cam2.style.transform = `translate3d(${cam2Position.join("px,")}px)`;

    const MNext = getMatrix(cam2Position, center, rotation);
    const $plane2 = document.querySelector("#scenario-1 .plane-2") as HTMLElement;
    $plane2.style.transform = `matrix3d(${MNext[1].join(",")})`;

    const c2 = { cameraMatrix: MNext[0], viewMatrix: MNext[1], rotationQuat: MNext[2] };
    const point3 = rayWorld(v.create(), v.fromValues(0, 0, 0), c2);
    const $point3 = document.querySelector("#scenario-1 .point-3") as HTMLElement;
    $point3.style.transform = `translate3d(${point3.join("px,")}px)`;
}

setScenario();

