class View {
  x: number = 0;
  y: number = 0;

  #w: number = 1;
  #h: number = 1;
  #min: number = 1;

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
    this.#min = Math.min(this.#w, this.#h);
    return [this.#w, this.#h];
  }

  get w() {
    return this.#w;
  }

  get h() {
    return this.#h;
  }

  get min() {
    return this.#min;
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
      (x / 180 * this.min - this.x) * this.scale + this.w/2,
      (y / 180 * this.min - this.y) * this.scale + this.h/2
    ];
  }

  screenToMap(x: number, y: number): [number, number] {
    return [
      ((x - this.w/2) / this.scale + this.x) / this.min * 180,
      ((y - this.h/2) / this.scale + this.y) / this.min * 180
    ];
  }
};

export const view = new View();
