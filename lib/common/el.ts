export default function el(elementId): HTMLElement|undefined {
    if (elementId && Object.prototype.toString.call(elementId) === "[object String]") {
        return document.getElementById(elementId);
    } else if (elementId && elementId.tagName) {
        return elementId;
    }
    console.log("invalid element id given", elementId);
    return undefined;
}
