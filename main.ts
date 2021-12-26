import { view } from './view.js'
import { Dir, heldPanKeys, heldZoomKeys } from './input.js'

type FeatureType = "water" | "land" | "forest" | "desert" | "swamp" | "mountain" | "volcano" | "lake" | "river";

const cnv = document.body.appendChild(document.createElement("canvas"));
const ctx = cnv.getContext("2d")!;

//const cityNames: Map<string, HTMLElement> = new Map();

// in km
//const geosDiameter = 14016.2;
//const geosRadius = geosDiameter / 2;

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

  function drawPaths(kind: FeatureType) {
    const paths = mapData.paths[kind];
    if (paths === undefined) {
      console.warn(`tried to draw ${kind}, but mapData does not contain that`);
      return;
    }
    ctx.fillStyle = CLR[kind];

    ctx.beginPath();
    for (const path of paths) {
      //ctx.beginPath();
      const [x,y] = path.slice(0,1)[0];
      ctx.moveTo(...view.mapToScreen(x, y));

      for (const [x,y] of path.slice(1)) {
        ctx.lineTo(...view.mapToScreen(x,y));
      }
      //ctx.closePath();
      //ctx.fill();
    }
    ctx.fill();
  }

  function* chunks<T>(arr: Array<T>, n: number) {
    for (let i = 0; i < arr.length; i += n) {
      yield arr.slice(i, i + n);
    }
  }

  function drawRivers() {
    const paths = mapData.paths.river;
    if (paths === undefined) {
      console.warn(`tried to draw river, but mapData does not contain that`);
      return;
    }

    ctx.save();

    ctx.lineWidth = Math.max(1/Math.sqrt(2), view.scale / 4);
    ctx.strokeStyle = CLR.river;
    ctx.lineCap = 'round';

    ctx.beginPath();
    for (const path of paths) {
      //ctx.beginPath();

      const [x,y] = path.slice(0,1)[0];
      ctx.moveTo(...view.mapToScreen(x, y));

      for (const [[x1,y1],[x2,y2],[x3,y3]] of chunks<[number,number]>(path.slice(1), 3)) {
        ctx.bezierCurveTo(
          ...view.mapToScreen(x1, y1),
          ...view.mapToScreen(x2, y2),
          ...view.mapToScreen(x3, y3)
        );
      }

      //for (const [x,y] of path) {
      //  ctx.lineTo(...view.mapToScreen(x,y));
      //}

      //ctx.stroke();
    }
    ctx.stroke();

    ctx.restore();
  }

  function drawCities() {
    const r = view.min*view.scale**0.5/900;
    if (r > 2.5) {
      ctx.save();

      ctx.fillStyle = '#000';
      ctx.strokeStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${r*4}px serif`;
      ctx.lineWidth = r/2;

      // TODO draw city symbol once in offscreen canvas, then draw that canvas on the main one where the cities go

      for (const city of mapData.cities) {
        //if (city.name === "") {
        //  continue;
        //}

        const screenPoint = view.mapToScreen(...(city.point as [number,number]));
        ctx.beginPath();
        ctx.arc(...screenPoint, r, 0, Math.PI*2);
        ctx.fill();

        screenPoint[1] -= r * 4;
        ctx.strokeText(city.name, ...screenPoint);
        ctx.fillText(city.name, ...screenPoint);
        //const el = cityNames.get(city.name);
        //if (el !== null && el !== undefined) {
        //  [el.style.left, el.style.top] = view.mapToScreen(...city.point as [number,number]).map(p=>p+'px');
        //}
      }

      ctx.restore();
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
    drawRivers();
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

    // border
    ctx.strokeStyle = '#000';
    ctx.strokeRect(
      view.w/2 + (-view.min - view.x) * view.scale,
      view.h/2 + (-view.min/2 - view.y) * view.scale,
      view.min * 2 * view.scale,
      view.min * view.scale
    );

    drawCities();

    requestAnimationFrame(drawFrame);
  }

  drawFrame();

  console.log('done');
});
