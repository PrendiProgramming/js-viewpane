export default class PositionBoundaries {
    left: number;
    right: number;
    top: number;
    bottom: number;

    constructor() {
        this.reset();
    }

    toString(): string {
        return `(${this.left},${this.top},${this.right},${this.bottom})`;
    }

    reset(): PositionBoundaries {
        this.left = this.right = this.top = this.bottom = 0;
        return this;
    }
}
