import { view } from './view.js'
import { Dir, heldPanKeys, heldZoomKeys } from './input.js'

type FeatureType = "water" | "land" | "forest" | "desert" | "swamp" | "mountain" | "volcano" | "lake" | "river";

const cnv = document.body.appendChild(document.createElement("canvas"));
const ctx = cnv.getContext("2d")!;

const cityNames: Map<string, HTMLElement> = new Map();

// in km
const geosDiameter = 14016.2;
const geosRadius = geosDiameter / 2;

function resize() {
  [cnv.width, cnv.height] = view.resize();
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

  //for (const city of mapData.cities) {
  //  if (city.name !== "") {
  //    const el = document.createElement("span");
  //    el.classList.add("city-name");
  //    el.innerHTML = city.name;
  //    [el.style.left, el.style.top] = view.mapToScreen(...city.point as [number,number]).map(p=>p+'px');
  //    document.body.appendChild(el);
  //    cityNames.set(city.name, el);
  //  }
  //}

  function drawPaths(kind: FeatureType) {
    const data = mapData.paths[kind];
    if (data === undefined) {
      console.warn(`tried to draw ${kind}, but mapData does not contain that`);
      return;
    }
    ctx.fillStyle = CLR[kind];

    for (const piece of data) {
      ctx.beginPath();
      for (const [x,y] of piece) {
        ctx.lineTo(...view.mapToScreen(x,y));
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
      ).moveView();

    view.scaleExponent += Array.from(heldZoomKeys).reduce((prev:number,current:string) => prev + (current === '+' ? 1 : -1), 0) / 25;

    //ctx.resetTransform();
    ctx.clearRect(0, 0, view.w, view.h);
    //ctx.translate(view.w/2, view.h/2);

    drawPaths("land");
    ctx.globalCompositeOperation = 'source-atop';
    drawPaths("forest");
    drawPaths("desert");
    drawPaths("swamp");
    drawPaths("mountain");
    drawPaths("volcano");
    drawPaths("lake");
    ctx.globalCompositeOperation = 'source-over';

    ctx.lineWidth = 1;

    // prime meridian
    ctx.strokeStyle = '#00f';
    ctx.globalAlpha = 1/3;
    ctx.beginPath();
    ctx.moveTo((view.w/2 - view.x * view.scale)|0, 0);
    ctx.lineTo((view.w/2 - view.x * view.scale)|0, view.h);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // equator
    ctx.strokeStyle = '#f00';
    ctx.globalAlpha = 1/3;
    ctx.beginPath();
    ctx.moveTo(0,      (view.h/2 - view.y * view.scale)|0);
    ctx.lineTo(view.w, (view.h/2 - view.y * view.scale)|0);
    ctx.stroke();
    ctx.globalAlpha = 1;

    const r = view.min*view.scale**0.5/1000;
    if (r > 2) {
      ctx.fillStyle = '#000';
      ctx.strokeStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${r*4}px sans-serif`;
      ctx.lineWidth = r/10;
      for (const city of mapData.cities) {
        const screenPoint = view.mapToScreen(...(city.point as [number,number]));
        ctx.beginPath();
        ctx.arc(...screenPoint, r, 0, Math.PI*2);
        ctx.fill();

        ctx.fillText(city.name, screenPoint[0], screenPoint[1] - r * 4);
        ctx.strokeText(city.name, screenPoint[0], screenPoint[1] - r * 4);
        //const el = cityNames.get(city.name);
        //if (el !== null && el !== undefined) {
        //  [el.style.left, el.style.top] = view.mapToScreen(...city.point as [number,number]).map(p=>p+'px');
        //}
      }
    }

    // border
    ctx.strokeStyle = '#000';
    ctx.strokeRect(view.w/2 + (-view.min - view.x) * view.scale, view.h/2 + (-view.min/2 - view.y) * view.scale, view.min * 2 * view.scale, view.min * view.scale)

    requestAnimationFrame(drawFrame);
  }

  drawFrame();

  console.log('done');
});
