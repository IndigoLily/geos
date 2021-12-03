import { Dir, heldPanKeys, heldZoomKeys, initPointer, initWheel } from './input.js'

type FeatureType = "water" | "land" | "forest" | "desert" | "swamp" | "mountain" | "volcano" | "lake" | "river";

const cnv = document.body.appendChild(document.createElement("canvas"));
const ctx = cnv.getContext("2d")!;

let width = 1, height = 1, min = Math.min(width, height);

const view = new class View {
  x: number = 0;
  y: number = 0;
  #scale: number;
  #scaleExponent: number = 0;
  constructor() {
    this.#scale = 2**this.#scaleExponent;
  }

  get scale() {
    return this.#scale;
  }

  get scaleExponent() {
    return this.#scaleExponent;
  }

  set scaleExponent(n: number) {
    this.#scaleExponent = n;
    this.#scale = 2**this.#scaleExponent;
  }
};

initWheel(view);
initPointer(view);

// in km
const geosDiameter = 14016.2;
const geosRadius = geosDiameter / 2;

function resize() {
  width  = cnv.width  = window.innerWidth;
  height = cnv.height = window.innerHeight;
  min = Math.min(width, height);
}

window.addEventListener('resize', resize);

const CLR: Record<FeatureType, string> = {
  water:    "#8ab4f8ff",
  land:     "#bbe2c6ff",
  forest:   "#94d2a5ff",
  swamp:    "#b5cd98ff",
  desert:   "#f3eddfff",
  mountain: "#bcbfc3ff",
  volcano:  "#d9c2a5ff",
  get lake()  { return this.water },
  get river() { return this.water },
} as const;

for (const [feature, clr] of Object.entries(CLR)) {
  document.querySelectorAll(`.${feature}-fill`).forEach(el => (el as HTMLElement).style.backgroundColor = clr)
}



const mapDataPromise = fetch("map.json").then(response => response.json());
window.onload = async () => Promise.resolve();
Promise.all([window.onload, mapDataPromise]).then(async ([_, mapData]) => {
  resize();

  function drawPaths(kind: FeatureType) {
    const data = mapData[kind];
    if (data === undefined) {
      console.warn(`tried to draw ${kind}, but mapData does not contain that`);
      return;
    }
    ctx.fillStyle = CLR[kind];

    for (const piece of data) {
      ctx.beginPath();
      for (const [x,y] of piece) {
        ctx.lineTo(
          (x / 180 * Math.min(width,height) - view.x) * view.scale,
          (y / 180 * Math.min(width,height) - view.y) * view.scale
        );
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawFrame() {
    Array.from(heldPanKeys)
      .map(key => Dir.fromKey(key))
      .reduce(
        (sum: Dir, current: Dir) => sum.add(current),
        new Dir("")
      ).moveView(view);

    view.scaleExponent += Array.from(heldZoomKeys).reduce((prev:number,current:string) => prev + (current === '+' ? 1 : -1), 0) / 25;

    ctx.resetTransform();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(width/2, height/2);

    drawPaths("land");
    ctx.globalCompositeOperation = 'source-atop';
    drawPaths("forest");
    drawPaths("desert");
    drawPaths("swamp");
    drawPaths("mountain");
    drawPaths("volcano");
    //drawPaths("lake");
    ctx.globalCompositeOperation = 'source-over';

    // prime meridian
    ctx.strokeStyle = '#00f';
    ctx.globalAlpha = 1/3;
    ctx.beginPath();
    ctx.moveTo(-view.x * view.scale, -height/2);
    ctx.lineTo(-view.x * view.scale,  height/2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // equator
    ctx.strokeStyle = '#f00';
    ctx.globalAlpha = 1/3;
    ctx.beginPath();
    ctx.moveTo(-width/2, -view.y * view.scale);
    ctx.lineTo( width/2, -view.y * view.scale);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // border
    ctx.strokeStyle = '#000';
    ctx.strokeRect((-min - view.x) * view.scale, (-min/2 - view.y) * view.scale, min * 2 * view.scale, min * view.scale)

    requestAnimationFrame(drawFrame);
  }

  drawFrame();

  console.log('done');
});
