type FeatureType = "water" | "land" | "forest" | "desert" | "swamp" | "mountain" | "volcano" | "lake" | "river";
type Point = { x: number, y: number };

const cnv = document.body.appendChild(document.createElement("canvas"));
const ctx = cnv.getContext("2d")!;

let width = 1, height = 1, min = Math.min(width, height), view = {x:0,y:0}, scaleExponent = 0, scale = 1;

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
  water:    "#AADAFF",
  land:     "#FFFFFF",
  forest:   "#A7C992",
  desert:   "#F5EEBB",
  swamp:    "#C1D07E",
  mountain: "#ABABAB",
  volcano:  "#CF9D80",
  get lake()  { return this.water },
  get river() { return this.water },
} as const;

for (const [feature, clr] of Object.entries(CLR)) {
  document.querySelectorAll(`.${feature}-fill`).forEach(el => (el as HTMLElement).style.backgroundColor = clr)
}



// inputs
const moveAmount = 5;

type NS = ""|"N"|"S";
type EW = ""|"E"|"W";
type DirString = `${NS}${EW}`;

function add<T extends NS|EW>(ns1: T, ns2: T): T {
  if (ns1 === ns2) return ns1;
  if (ns1 === "" || ns2 === "") return ns1 || ns2;
  return "" as T;
}

class Dir {
  readonly ns: NS = "";
  readonly ew: EW = "";
  constructor(dir: DirString) {
    if (dir.startsWith("N")) {
      this.ns = "N";
    } else if (dir.startsWith("S")) {
      this.ns = "S";
    }

    if (dir.endsWith("E")) {
      this.ew = "E";
    } else if (dir.endsWith("W")) {
      this.ew = "W";
    }
  }

  add(other: Dir): Dir {
    const ns: NS = add<NS>(this.ns, other.ns),
      ew: EW = add<EW>(this.ew, other.ew);
    return new Dir(`${ns}${ew}`);
  }

  moveView() {
    switch(this.ns) {
      case "N":
        view.y -= moveAmount / scale;
        break;
      case "S":
        view.y += moveAmount / scale;
        break;
    }

    switch(this.ew) {
      case "W":
        view.x -= moveAmount / scale;
        break;
      case "E":
        view.x += moveAmount / scale;
        break;
    }
  }

  static fromKey(key: string): Dir {
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

//let heldLeftMouse = null as null|{oldView:typeof view, oldMouse:typeof view};

let pointers: Array<{view:Point, pointer:Point}> = [];

function pointerDown(ev: PointerEvent) {
  if (ev.button === 0) {
    if (pointers.length === 0) {
      pointers.push({
        view: { x: view.x, y: view.y },
        pointer: { x: ev.x, y: ev.y },
      });
    } else if (pointers.length === 1) {
    }
  }
}

cnv.addEventListener('pointerdown', pointerDown);

//function singlePointerDown(ev: PointerEvent) {
//  if (ev.button === 0) {
//    cnv.removeEventListener('pointerdown', singlePointerDown);
//
//    const oldView = { x: view.x, y: view.y };
//    const oldPointer = { x: ev.x, y: ev.y };
//
//    function singlePointerMove(ev: PointerEvent) {
//      const dx = oldPointer.x - ev.x;
//      const dy = oldPointer.y - ev.y;
//      view.x = oldView.x + dx / scale;
//      view.y = oldView.y + dy / scale;
//    }
//
//    function singlePointerUp(_e: PointerEvent) {
//      window.removeEventListener('pointermove', singlePointerMove);
//      window.removeEventListener('pointerup', singlePointerUp);
//      window.removeEventListener('pointerleave', singlePointerUp);
//      window.removeEventListener('pointercancel', singlePointerUp);
//      window.removeEventListener('pointerout', singlePointerUp);
//      cnv.addEventListener('pointerdown', singlePointerDown);
//    }
//
//    window.addEventListener('pointermove', singlePointerMove);
//
//    window.addEventListener('pointerup', singlePointerUp);
//    window.addEventListener('pointerleave', singlePointerUp);
//    window.addEventListener('pointercancel', singlePointerUp);
//    window.addEventListener('pointerout', singlePointerUp);
//  }
//}
//
//cnv.addEventListener('pointerdown', singlePointerDown);

//window.addEventListener('pointerdown', ({ x, y, button }) => {
//  if (button === 0) {
//    heldLeftMouse = { oldView: {x:view.x, y:view.y}, oldMouse: {x,y} } ;
//  }
//});
//
//window.addEventListener('pointerup', ({ button }) => {
//  if (button === 0) {
//    heldLeftMouse = null;
//  }
//});
//
//window.addEventListener('pointermove', ({ x, y }) => {
//  if (heldLeftMouse) {
//    const dx = heldLeftMouse.oldMouse.x - x;
//    const dy = heldLeftMouse.oldMouse.y - y;
//    view.x = heldLeftMouse.oldView.x + dx / scale;
//    view.y = heldLeftMouse.oldView.y + dy / scale;
//  }
//});

window.addEventListener('wheel', ({ deltaY }) => {
  scaleExponent -= Math.sign(deltaY) / 10;
  scale = 2**scaleExponent;
});

const heldPanKeys: Set<string> = new Set();
const heldZoomKeys: Set<string> = new Set();

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
          (x / 180 * Math.min(width,height) - view.x) * scale,
          (y / 180 * Math.min(width,height) - view.y) * scale
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
      ).moveView();

    Array.from(heldZoomKeys);

    ctx.resetTransform();
    ctx.clearRect(0, 0, width, height);

    ctx.translate(width/2, height/2);
    drawPaths("land");
    ctx.globalCompositeOperation = 'source-atop';
    drawPaths("forest");
    //drawPaths("desert");
    //drawPaths("swamp");
    //drawPaths("mountain");
    //drawPaths("volcano");
    //drawPaths("lake");
    ctx.globalCompositeOperation = 'source-over';

    // equator
    ctx.strokeStyle = '#f00';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(-width/2, -view.y * scale);
    ctx.lineTo( width/2, -view.y * scale);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // border
    ctx.strokeStyle = '#000';
    //ctx.moveTo((-min - view.x) * scale, 0);
    //ctx.lineTo((+min - view.x) * scale, 0);
    //ctx.stroke();
    ctx.strokeRect((-min - view.x) * scale, (-min/2 - view.y) * scale, min * 2 * scale, min * scale)

    requestAnimationFrame(drawFrame);
  }

  drawFrame();

  console.log('done');
});
