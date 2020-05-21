import Loop from "../common/loop";
import withObservable from "../common/withObservable";
import Scene from "../Scene";
import { ObserverNotify, ObserverAdd, ObserverRemove } from "../types";
import { vec3 as v } from "gl-matrix";
import Camera from "./Camera";

const FRICTION = 0.95;
const FPS = 1000/50;


export enum EVENT {
    START = "start",
    STOP = "stop"
}


export default class SpeedSnapAnimation {
    scene: Scene;
    camera: Camera;
    friction: number;
    from: v;
    work: v;
    speedVector: v;
    rubberband: v;
    loopState: boolean;
    startTime: number;
    duration: number;

    notify: ObserverNotify<EVENT>;
    addObserver: ObserverAdd<EVENT>;
    removeObserver: ObserverRemove<EVENT>;


    constructor(scene: Scene, options) {
        withObservable.call(this, [EVENT.START, EVENT.STOP]);

        this.scene = scene;
        this.camera = scene.camera;
        this.friction = options.friction || FRICTION;

        this.from = v.create();
        this.work = v.create();
        this.speedVector = v.create();
        this.rubberband = v.create();
    }

    start(speedVector: v, origin: v): void {
        this.camera.convertToWorldTranslation(this.speedVector, speedVector, origin);

        const startSpeed = v.length(this.speedVector);
        const speedDuration = FPS * (- Math.log(startSpeed) / Math.log(FRICTION));
        this.startTime = Date.now();
        this.duration = Math.max(400, speedDuration);

        this.notify(EVENT.START);
        this.loopState = Loop.CONTINUE;
        Loop.add(this);
    }

    stop(): void {
        this.loopState = Loop.EXIT;
    }

    calculate(now: number): boolean {
        const speedMovement = this.speedVector;
        const timeProgress = Math.min(1, (now - this.startTime) / this.duration);
        // !animate rubberband on time
        const rubberband = this.camera.getRubberband(this.rubberband);
        v.scale(rubberband, rubberband, timeProgress);
        // !animate speed by friction
        v.scale(speedMovement, speedMovement, FRICTION);
        // ! ensure speed does not pull too much on rubberband
        // since rubberband only increases over time
        // if (rubberband[0]) {speedMovement.x *= 0.25;}
        if (rubberband[0]) {speedMovement[0] *= timeProgress;}
        if (rubberband[1]) {speedMovement[1] *= timeProgress;}

        if (timeProgress >= 1) {
            this.camera.translate(v.fromValues(rubberband[0], rubberband[1], rubberband[2]));
            this.stop();

        } else {
            v.subtract(this.work, rubberband, speedMovement);
            this.camera.translate(v.fromValues(this.work[0], this.work[1], this.work[2]));
        }

        this.scene.calculate();
        return Loop.CONTINUE;
    }

    render(): boolean {
        this.scene.render();

        if (this.loopState === Loop.EXIT) {
            this.notify(EVENT.STOP);
        }

        return this.loopState;
    }
}
