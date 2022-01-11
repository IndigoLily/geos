export class Point3D {
    constructor(x, y, z) {
        this.x = x ?? 0;
        this.y = y ?? 0;
        this.z = z ?? 0;
    }
    clone() {
        return new Point3D(this.x, this.y, this.z);
    }
    static fromQuaternion(q) {
        return new Point3D(q.x, q.y, q.z);
    }
    normalize() {
        const len = Math.hypot(this.x, this.y, this.z);
        this.x /= len;
        this.y /= len;
        this.z /= len;
        return this;
    }
    rotate(radians, axis) {
        const cos = Math.cos(radians / 2);
        const sin = Math.sin(radians / 2);
        const q = new Quaternion(cos, axis.x * sin, axis.y * sin, axis.z * sin).normalize();
        const qi = new Quaternion(cos, -axis.x * sin, -axis.y * sin, -axis.z * sin).normalize();
        return Point3D.fromQuaternion(q.multiply(Quaternion.fromPoint3D(this)).multiply(qi));
    }
}
export class Quaternion {
    constructor(w, x, y, z) {
        this.w = w ?? 0;
        this.x = x ?? 0;
        this.y = y ?? 0;
        this.z = z ?? 0;
    }
    clone() {
        return new Quaternion(this.w, this.x, this.y, this.z);
    }
    static fromPoint3D(p) {
        return new Quaternion(0, p.x, p.y, p.z);
    }
    normalize() {
        const len = Math.hypot(this.w, this.x, this.y, this.z);
        this.w /= len;
        this.x /= len;
        this.y /= len;
        this.z /= len;
        return this;
    }
    add(that) {
        this.w += that.w;
        this.x += that.x;
        this.y += that.y;
        this.z += that.z;
        return this;
    }
    static add(...qs) {
        if (qs.length === 0) {
            return new Quaternion();
        }
        else if (qs.length === 1) {
            return qs[0].clone();
        }
        else {
            let sum = qs.shift().clone();
            for (const q of qs) {
                sum.add(q);
            }
            return sum;
        }
    }
    multiply(that) {
        const w = this.w * that.w - this.x * that.x - this.y * that.y - this.z * that.z;
        const x = this.w * that.x + this.x * that.w + this.y * that.z - this.z * that.y;
        const y = this.w * that.y + this.y * that.w + this.z * that.x - this.x * that.z;
        const z = this.z * that.z + this.z * that.w + this.x * that.y - this.y * that.x;
        this.w = w;
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
}
