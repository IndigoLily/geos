const map = document.getElementById('map');
const mapSize = 1000;
map.querySelectorAll('img').forEach(img => img.width = img.height = `${mapSize}`);

class Vec {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    copy() {
        return new Vec(this.x, this.y);
    }
    add(other) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }
    sub(other) {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }
    scale(fac) {
        this.x *= fac;
        this.y *= fac;
        return this;
    }
}



let mapVec = new Vec(0, 0);
let zoom = 0;

function screenToMap(vec) {
    // stored as *percentage* across and down
    const pos = vec.copy();
    pos.sub(mapVec);
    pos.scale(1/(mapSize * 2**zoom));
    return pos;
}
function mapToScreen(vec) {
    return vec.copy().scale(mapSize * 2**zoom).add(mapVec);
}

function updatePos(x, y) {
    debugger;
    mapVec.x += x;
    mapVec.y = Math.min(0, mapVec.y + y);
    map.style.left = mapVec.x + 'px';
    map.style.top  = mapVec.y + 'px';
}
updatePos(0, 0);

function updateZoom(d) {
    debugger;
    const center = new Vec(innerWidth/2, innerHeight/2);
    const prevPos = screenToMap(center);
    zoom += d;
    console.log(mapToScreen(prevPos));
    //mapVec = center.copy().sub(mapToScreen(prevPos));
    updatePos(0,0);

    map.style.transform = `scale(${2**zoom})`;
}
updateZoom(0);



window.addEventListener('keydown', e => {
    if (e.key === '+') {
        updateZoom(+1);
    } else if (e.key === '-') {
        updateZoom(-1);
    } else if (e.key === 'ArrowUp') {
        updatePos(0, +100);
    } else if (e.key === 'ArrowDown') {
        updatePos(0, -100);
    } else if (e.key === 'ArrowLeft') {
        updatePos(+100, 0);
    } else if (e.key === 'ArrowRight') {
        updatePos(-100, 0);
    } else {
        console.log(e);
    }
});

