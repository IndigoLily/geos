"use strict";
const cnv = document.body.appendChild(document.createElement("canvas"));
const ctx = cnv.getContext("2d");
let width = 1, height = 1, min = Math.min(width, height), view = { x: 0, y: 0 }, scaleExponent = 0, scale = 1;
const geosDiameter = 14016.2;
const geosRadius = geosDiameter / 2;
function resize() {
    width = cnv.width = window.innerWidth;
    height = cnv.height = window.innerHeight;
    min = Math.min(width, height);
}
window.addEventListener('resize', resize);
const CLR = {
    water: "#AADAFF",
    land: "#FFFFFF",
    forest: "#A7C992",
    desert: "#F5EEBB",
    swamp: "#C1D07E",
    mountain: "#ABABAB",
    volcano: "#CF9D80",
    get lake() { return this.water; },
    get river() { return this.water; },
};
for (const [feature, clr] of Object.entries(CLR)) {
    document.querySelectorAll(`.${feature}-fill`).forEach(el => el.style.backgroundColor = clr);
}
const moveAmount = 5;
function add(ns1, ns2) {
    if (ns1 === ns2)
        return ns1;
    if (ns1 === "" || ns2 === "")
        return ns1 || ns2;
    return "";
}
class Dir {
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
    moveView() {
        switch (this.ns) {
            case "N":
                view.y -= moveAmount / scale;
                break;
            case "S":
                view.y += moveAmount / scale;
                break;
        }
        switch (this.ew) {
            case "W":
                view.x -= moveAmount / scale;
                break;
            case "E":
                view.x += moveAmount / scale;
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
let pointers = [];
function pointerDown(ev) {
    if (ev.button === 0) {
        if (pointers.length === 0) {
            pointers.push({
                view: { x: view.x, y: view.y },
                pointer: { x: ev.x, y: ev.y },
            });
        }
        else if (pointers.length === 1) {
        }
    }
}
cnv.addEventListener('pointerdown', pointerDown);
window.addEventListener('wheel', ({ deltaY }) => {
    scaleExponent -= Math.sign(deltaY) / 10;
    scale = 2 ** scaleExponent;
});
const heldPanKeys = new Set();
const heldZoomKeys = new Set();
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
const mapDataPromise = fetch("map.json").then(response => response.json());
window.onload = async () => Promise.resolve();
Promise.all([window.onload, mapDataPromise]).then(async ([_, mapData]) => {
    resize();
    function drawPaths(kind) {
        const data = mapData[kind];
        if (data === undefined) {
            console.warn(`tried to draw ${kind}, but mapData does not contain that`);
            return;
        }
        ctx.fillStyle = CLR[kind];
        for (const piece of data) {
            ctx.beginPath();
            for (const [x, y] of piece) {
                ctx.lineTo((x / 180 * Math.min(width, height) - view.x) * scale, (y / 180 * Math.min(width, height) - view.y) * scale);
            }
            ctx.closePath();
            ctx.fill();
        }
    }
    function drawFrame() {
        Array.from(heldPanKeys)
            .map(key => Dir.fromKey(key))
            .reduce((sum, current) => sum.add(current), new Dir("")).moveView();
        Array.from(heldZoomKeys);
        ctx.resetTransform();
        ctx.clearRect(0, 0, width, height);
        ctx.translate(width / 2, height / 2);
        drawPaths("land");
        ctx.globalCompositeOperation = 'source-atop';
        drawPaths("forest");
        drawPaths("desert");
        drawPaths("swamp");
        drawPaths("mountain");
        drawPaths("volcano");
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#f00';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(-width / 2, -view.y * scale);
        ctx.lineTo(width / 2, -view.y * scale);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#000';
        ctx.strokeRect((-min - view.x) * scale, (-min / 2 - view.y) * scale, min * 2 * scale, min * scale);
        requestAnimationFrame(drawFrame);
    }
    drawFrame();
    console.log('done');
});
