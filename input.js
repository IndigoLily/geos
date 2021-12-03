const moveAmount = 10;
function add(ns1, ns2) {
    if (ns1 === ns2)
        return ns1;
    if (ns1 === "" || ns2 === "")
        return ns1 || ns2;
    return "";
}
export class Dir {
    constructor(dir) {
        this.ns = "";
        this.ew = "";
        if (dir.startsWith("N")) {
            this.ns = "N";
        }
        else if (dir.startsWith("S")) {
            this.ns = "S";
        }
        if (dir.endsWith("E")) {
            this.ew = "E";
        }
        else if (dir.endsWith("W")) {
            this.ew = "W";
        }
    }
    add(other) {
        const ns = add(this.ns, other.ns), ew = add(this.ew, other.ew);
        return new Dir(`${ns}${ew}`);
    }
    moveView(view) {
        switch (this.ns) {
            case "N":
                view.y -= moveAmount / view.scale;
                break;
            case "S":
                view.y += moveAmount / view.scale;
                break;
        }
        switch (this.ew) {
            case "W":
                view.x -= moveAmount / view.scale;
                break;
            case "E":
                view.x += moveAmount / view.scale;
                break;
        }
    }
    static fromKey(key) {
        switch (key) {
            case "ArrowUp":
            case "w":
            case "k":
                return new Dir("N");
            case "ArrowDown":
            case "s":
            case "j":
                return new Dir("S");
            case "ArrowRight":
            case "d":
            case "l":
                return new Dir("E");
            case "ArrowLeft":
            case "a":
            case "h":
                return new Dir("W");
            default:
                return new Dir("");
        }
    }
}
export function initWheel(view) {
    window.addEventListener('wheel', ({ deltaY }) => {
        view.scaleExponent -= Math.sign(deltaY) / moveAmount;
    });
}
export function initPointer(view) {
    let pointer1 = null;
    let pointer2 = null;
    window.addEventListener('pointerdown', e => {
        if (pointer1 === null) {
            pointer1 = {
                id: e.pointerId,
                orig: { x: e.x, y: e.y },
                current: { x: e.x, y: e.y }
            };
        }
        else if (pointer2 === null) {
            pointer2 = {
                id: e.pointerId,
                orig: { x: e.x, y: e.y },
                current: { x: e.x, y: e.y }
            };
        }
        console.log(pointer1, pointer2);
    });
    window.addEventListener('pointerup', e => {
        if (pointer1?.id === e.pointerId) {
            pointer1 = pointer2;
            pointer2 = null;
        }
        else if (pointer2?.id === e.pointerId) {
            pointer2 = null;
        }
        console.log(pointer1, pointer2);
    });
}
export const heldPanKeys = new Set();
export const heldZoomKeys = new Set();
window.addEventListener('keydown', ({ key }) => {
    switch (key) {
        case "ArrowUp":
        case "w":
        case "k":
        case "ArrowDown":
        case "s":
        case "j":
        case "ArrowRight":
        case "d":
        case "l":
        case "ArrowLeft":
        case "a":
        case "h":
            heldPanKeys.add(key);
            break;
        case "+":
        case "-":
            heldZoomKeys.add(key);
            break;
        default:
            console.debug('keydown', key);
            break;
    }
});
window.addEventListener('keyup', ({ key }) => {
    switch (key) {
        case "ArrowUp":
        case "w":
        case "k":
        case "ArrowDown":
        case "s":
        case "j":
        case "ArrowLeft":
        case "a":
        case "h":
        case "ArrowRight":
        case "d":
        case "l":
            heldPanKeys.delete(key);
            break;
        case "+":
        case "-":
            heldZoomKeys.delete(key);
            break;
        default:
            console.debug('keyup', key);
            break;
    }
});
