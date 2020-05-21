export { default as intersectRayPlane } from "./intersectRayPlane";
export { default as zoomAt } from "./zoomAt";
export { default as invertProject } from "./invertProject";
export { default as zoomAtAndMoveVisual } from "./zoomAtAndMoveVisual";
export { default as moveVisual } from "./moveVisual";
export { default as getZWhereSizeFitsViewport } from "./getZWhereSizeFitsViewport";
export { default as lookAtPointOnPlane } from "./lookAtPointOnPlane";
export * as matrix from "./matrix";

export const toDeg = (r: number): number => r * (180/Math.PI);
