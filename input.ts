type Point = { x: number, y: number };
type View = Point & { scale: number, scaleExponent: number };

const moveAmount = 10;

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

  moveView(view: View) {
    switch(this.ns) {
      case "N":
        view.y -= moveAmount / view.scale;
        break;
      case "S":
        view.y += moveAmount / view.scale;
        break;
    }

    switch(this.ew) {
      case "W":
        view.x -= moveAmount / view.scale;
        break;
      case "E":
        view.x += moveAmount / view.scale;
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



export function initWheel(view: View) {
  window.addEventListener('wheel', ({ deltaY }) => {
    view.scaleExponent -= Math.sign(deltaY) / moveAmount;
  });
}

export function initPointer(view: View) {
  let pointer1 : null | { id: number, orig: Point, current: Point } = null;
  let pointer2 : null | { id: number, orig: Point, current: Point } = null;

  window.addEventListener('pointerdown', e => {
    if (pointer1 === null) {
      pointer1 = {
        id: e.pointerId,
        orig: { x: e.x, y: e.y },
        current: { x: e.x, y: e.y }
      };
    } else if (pointer2 === null) {
      pointer2 = {
        id: e.pointerId,
        orig: { x: e.x, y: e.y },
        current: { x: e.x, y: e.y }
      };
    }
  });

  window.addEventListener('pointerup', e => {
    if (pointer1?.id === e.pointerId) {
      pointer1 = pointer2;
      pointer2 = null;
    } else if (pointer2?.id === e.pointerId) {
      pointer2 = null;
    }
  });
}



export const heldPanKeys: Set<string> = new Set();
export const heldZoomKeys: Set<string> = new Set();

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
