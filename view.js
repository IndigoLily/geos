var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _View_w, _View_h, _View_min, _View_scaleExponent, _View_scale;
class View {
    constructor() {
        this.x = 0;
        this.y = 0;
        _View_w.set(this, 1);
        _View_h.set(this, 1);
        _View_min.set(this, 1);
        _View_scaleExponent.set(this, 0);
        _View_scale.set(this, 2 ** __classPrivateFieldGet(this, _View_scaleExponent, "f"));
    }
    get scale() {
        return __classPrivateFieldGet(this, _View_scale, "f");
    }
    get scaleExponent() {
        return __classPrivateFieldGet(this, _View_scaleExponent, "f");
    }
    set scaleExponent(n) {
        __classPrivateFieldSet(this, _View_scaleExponent, n, "f");
        __classPrivateFieldSet(this, _View_scale, 2 ** __classPrivateFieldGet(this, _View_scaleExponent, "f"), "f");
    }
    resize() {
        __classPrivateFieldSet(this, _View_w, window.innerWidth, "f");
        __classPrivateFieldSet(this, _View_h, window.innerHeight, "f");
        __classPrivateFieldSet(this, _View_min, Math.min(__classPrivateFieldGet(this, _View_w, "f"), __classPrivateFieldGet(this, _View_h, "f")), "f");
        return [__classPrivateFieldGet(this, _View_w, "f"), __classPrivateFieldGet(this, _View_h, "f")];
    }
    get w() {
        return __classPrivateFieldGet(this, _View_w, "f");
    }
    get h() {
        return __classPrivateFieldGet(this, _View_h, "f");
    }
    get min() {
        return __classPrivateFieldGet(this, _View_min, "f");
    }
    clone() {
        const clone = new View();
        clone.x = this.x;
        clone.y = this.y;
        clone.scaleExponent = __classPrivateFieldGet(this, _View_scaleExponent, "f");
        return clone;
    }
    mapToScreen(x, y) {
        return [
            (x / 180 * this.min - this.x) * this.scale + this.w / 2,
            (y / 180 * this.min - this.y) * this.scale + this.h / 2
        ];
    }
    screenToMap(x, y) {
        return [
            ((x - this.w / 2) / this.scale + this.x) / this.min * 180,
            ((y - this.h / 2) / this.scale + this.y) / this.min * 180
        ];
    }
}
_View_w = new WeakMap(), _View_h = new WeakMap(), _View_min = new WeakMap(), _View_scaleExponent = new WeakMap(), _View_scale = new WeakMap();
;
export const view = new View();
