var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _View_w, _View_h, _View_wh_min, _View_scaleExponent, _View_scale;
export class View {
    constructor(x = 0, y = 0, w = 1, h = 1, z = 0) {
        _View_w.set(this, void 0);
        _View_h.set(this, void 0);
        _View_wh_min.set(this, void 0);
        _View_scaleExponent.set(this, void 0);
        _View_scale.set(this, void 0);
        this.x = x;
        this.y = y;
        __classPrivateFieldSet(this, _View_w, w, "f");
        __classPrivateFieldSet(this, _View_h, h, "f");
        __classPrivateFieldSet(this, _View_wh_min, Math.min(w, h), "f");
        __classPrivateFieldSet(this, _View_scaleExponent, z, "f");
        __classPrivateFieldSet(this, _View_scale, 2 ** __classPrivateFieldGet(this, _View_scaleExponent, "f"), "f");
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
    resize(w, h) {
        __classPrivateFieldSet(this, _View_w, w ?? window.innerWidth, "f");
        __classPrivateFieldSet(this, _View_h, h ?? window.innerHeight, "f");
        __classPrivateFieldSet(this, _View_wh_min, Math.min(__classPrivateFieldGet(this, _View_w, "f"), __classPrivateFieldGet(this, _View_h, "f")), "f");
        return [__classPrivateFieldGet(this, _View_w, "f"), __classPrivateFieldGet(this, _View_h, "f")];
    }
    get w() {
        return __classPrivateFieldGet(this, _View_w, "f");
    }
    get h() {
        return __classPrivateFieldGet(this, _View_h, "f");
    }
    get wh_min() {
        return __classPrivateFieldGet(this, _View_wh_min, "f");
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
            (x / 180 * this.wh_min - this.x) * this.scale + this.w / 2,
            (y / 180 * this.wh_min - this.y) * this.scale + this.h / 2
        ];
    }
    screenToMap(x, y) {
        return [
            ((x - this.w / 2) / this.scale + this.x) / this.wh_min * 180,
            ((y - this.h / 2) / this.scale + this.y) / this.wh_min * 180
        ];
    }
}
_View_w = new WeakMap(), _View_h = new WeakMap(), _View_wh_min = new WeakMap(), _View_scaleExponent = new WeakMap(), _View_scale = new WeakMap();
;
export const defaultView = new View();
