class View {
  x: number = 0;
  y: number = 0;

  #w: number = 1;
  #h: number = 1;
  #wh_min: number = 1;

  #scaleExponent: number = 0;
  #scale: number = 2**this.#scaleExponent;

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

  resize() {
    this.#w = window.innerWidth;
    this.#h = window.innerHeight;
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

export const view = new View();
