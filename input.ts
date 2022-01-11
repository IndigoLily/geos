import { View } from "./view.js"

type Point = { x: number, y: number };

const moveAmount = 10;


// Directions
type NS = ""|"N"|"S";
type EW = ""|"E"|"W";
type DirString = `${NS}${EW}`;

function add<T extends NS|EW>(ns1: T, ns2: T): T {
  if (ns1 === ns2) return ns1;
  if (ns1 === "" || ns2 === "") return ns1 || ns2;
  return "" as T;
}

export class Dir {
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

  moveView(v: View) {
    switch(this.ns) {
      case "N":
        v.y -= moveAmount / v.scale;
        break;
      case "S":
        v.y += moveAmount / v.scale;
        break;
    }

    switch(this.ew) {
      case "W":
        v.x -= moveAmount / v.scale;
        break;
      case "E":
        v.x += moveAmount / v.scale;
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



// Pointer handling
class Pointer {
  readonly id: number;
  oldX: number;
  oldY: number;
  x: number;
  y: number;
  constructor(e: Point & { pointerId: number }) {
    this.id = e.pointerId;
    this.x = e.x;
    this.y = e.y;
    this.oldX = e.x;
    this.oldY = e.y;
  }
}

export const heldPanKeys: Set<string> = new Set();
export const heldZoomKeys: Set<string> = new Set();

export function init(view: View) {
  let pointers: Array<Pointer> = [];
  let oldView: null | typeof view = null;
  let oldMid: null | Point = null;
  let oldDist: null | number = null;

  window.addEventListener("wheel", e => {
    const oldMap = view.screenToMap(e.x, e.y);
    view.scaleExponent -= Math.sign(e.deltaY) / moveAmount;
    const oldPointer = view.mapToScreen(...oldMap);
    view.x += (oldPointer[0] - e.x) / view.scale;
    view.y += (oldPointer[1] - e.y) / view.scale;

    if (pointers.length === 1) {
      oldView = view.clone();
      pointers = [new Pointer({ x:e.x, y:e.y, pointerId:pointers[0].id })];
    }
  });

  window.addEventListener("pointerdown", e => {
    if (e.pointerType === "mouse" && e.button !== 0 && e.button !== 1) {
      return;
    }

    if (pointers.length === 0) {
      pointers.push(new Pointer(e));
      oldView = view.clone();
    } else if (pointers.length === 1) {
      pointers[0].oldX = pointers[0].x;
      pointers[0].oldY = pointers[0].y;
      pointers.push(new Pointer(e));
      oldView = view.clone();
      oldMid = {
        x: (pointers[0].oldX + pointers[1].oldX) / 2,
        y: (pointers[0].oldY + pointers[1].oldY) / 2,
      };
      oldDist = Math.hypot(pointers[0].oldX - pointers[1].oldX, pointers[0].oldY - pointers[1].oldY);
    }

    //console.clear();
    //console.table(pointers);
  });

  window.addEventListener("pointerup", e => {
    //console.clear();
    //console.table(pointers);

    const oldLen = pointers.length;

    pointers = pointers.filter(p => p.id !== e.pointerId);

    if (oldLen === 2 && pointers.length === 1) {
      pointers[0].oldX = pointers[0].x;
      pointers[0].oldY = pointers[0].y;

      oldView = view.clone();

      oldMid = null;
      oldDist = null;
    }

    if (pointers.length === 0) {
      oldView = null;
    }
  });

  window.addEventListener("pointermove", e => {
    for (const p of pointers) {
      if (p.id === e.pointerId) {
        p.x = e.x;
        p.y = e.y;
      }
    }

    if (pointers.length === 1) {
      const dx = pointers[0].oldX - e.x;
      const dy = pointers[0].oldY - e.y;
      view.x = oldView!.x + dx / view.scale;
      view.y = oldView!.y + dy / view.scale;
    }

    if (pointers.length === 2) {
      const newDist = Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
      const ratio = newDist / oldDist!;
      const dx = oldMid!.x - (pointers[0].x + pointers[1].x) / 2;
      const dy = oldMid!.y - (pointers[0].y + pointers[1].y) / 2;

      view.scaleExponent = oldView!.scaleExponent + Math.log2(ratio);
      view.x = oldView!.x + dx / view.scale;
      view.y = oldView!.y + dy / view.scale;
    }
  });



  // Keyboard handling

  window.addEventListener("keydown", ({ key }) => {
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
        console.debug("keydown", key);
        break;
    }
  });

  window.addEventListener("keyup", ({ key }) => {
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
        console.debug("keyup", key);
        break;
    }
  });
}
