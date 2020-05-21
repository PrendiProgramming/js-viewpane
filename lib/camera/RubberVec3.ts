import { vec3 as v } from "gl-matrix";


function minMax(value: number, min: number, max: number): number {
    if (value < min) {
        return min;
    } else if (value > max) {
        return max;
    }
    return value;
}


export default class RubberVec3 {
    vector = v.create();
    rubber = v.create();
    restricted = v.create();

    constructor() {}

    add(vector: v): void {
        v.add(this.vector, this.vector, vector);
        v.copy(this.restricted, this.vector);
        this.restrict(0, -80, 0);
        this.update(0.1);
    }

    restrict(index, min, max): void {
        this.restricted[index] = minMax(this.restricted[index], min, max);
    }

    update(factor: number): void {
        const { restricted, rubber, vector } = this;
        for (let i = 0, l = vector.length; i < l; i += 1) {
            if (vector[i] === restricted[i]) {
                rubber[i] = vector[i];
            } else {
                rubber[i] = restricted[i] + (vector[i] - restricted[i]) * factor;
            }
        }
    }

    remove(): void {
        v.copy(this.vector, this.restricted);
        v.copy(this.rubber, this.restricted);
    }
}
