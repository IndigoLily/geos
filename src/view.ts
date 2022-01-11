export class View {
  x: number;
  y: number;

  #w: number;
  #h: number;
  #wh_min: number;

  #scaleExponent: number;
  #scale: number;

  constructor(x: number = 0, y: number = 0, w: number = 1, h: number = 1, z: number = 0) {
    this.x = x;
    this.y = y;

    this.#w = w;
    this.#h = h;
    this.#wh_min = Math.min(w, h);

    this.#scaleExponent = z;
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

  resize(w?: number, h?: number) {
    this.#w = w ?? window.innerWidth;
    this.#h = h ?? window.innerHeight;
    this.#wh_min = Math.min(this.#w, this.#h);
    return [this.#w, this.#h];
  }

  get w() {
    return this.#w;
  }

  get h() {
    return this.#h;
  }

  get wh_min() {
    return this.#wh_min;
  }

  clone(): View {
    const clone = new View();
    clone.x = this.x;
    clone.y = this.y;
    clone.scaleExponent = this.#scaleExponent;
    return clone;
  }

  mapToScreen(x: number, y: number): [number, number] {
    return [
      (x / 180 * this.wh_min - this.x) * this.scale + this.w/2,
      (y / 180 * this.wh_min - this.y) * this.scale + this.h/2
    ];
  }

  screenToMap(x: number, y: number): [number, number] {
    return [
      ((x - this.w/2) / this.scale + this.x) / this.wh_min * 180,
      ((y - this.h/2) / this.scale + this.y) / this.wh_min * 180
    ];
  }
};

export const defaultView = new View();
