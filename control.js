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

let screenCenter = new Vec(innerWidth/2, innerHeight/2);
window.addEventListener('resize', e => {
    screenCenter = new Vec(innerWidth/2, innerHeight/2);
});

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

function updatePos(x = 0, y = 0) {
    mapVec.x += x;
    mapVec.y = Math.min(0, mapVec.y + y);
    map.style.left = mapVec.x + 'px';
    map.style.top  = mapVec.y + 'px';
}

function updateZoom(d = 0, zoomCenter = new Vec(0,0)) {
    const prevPos = screenToMap(zoomCenter);
    zoom = Math.min(zoom+d, 15);
    mapVec.sub(mapToScreen(prevPos).sub(zoomCenter));
    updatePos(0,0);

    map.style.transform = `scale(${2**zoom})`;
}

function reset() {
    zoom = 0;
    updateZoom();
    mapVec = new Vec(0, 0);
    updatePos((innerWidth-mapSize)/2, 0);
}

reset();


let mouse = null;
window.addEventListener('mousedown', e => {
    if (!mouse) {
        mouse = e;
    }
});
window.addEventListener('mouseup', e => {
    if (mouse) {
        mouse = null;
    }
});
let movement = null;
window.addEventListener('mousemove', e => {
    if (mouse) {
        const vec = new Vec(e.movementX, e.movementY);
        if (movement === null) {
            movement = vec;
            requestAnimationFrame(() => {
                updatePos(movement.x, movement.y);
                movement = null;
            });
        } else {
            movement.add(vec);
        }
    }
});

window.addEventListener('keydown', e => {
    if (e.key === '+') {
        updateZoom(+1, screenCenter);
    } else if (e.key === '-') {
        updateZoom(-1, screenCenter);
    } else if (e.key === 'ArrowUp') {
        updatePos(0, +100);
    } else if (e.key === 'ArrowDown') {
        updatePos(0, -100);
    } else if (e.key === 'ArrowLeft') {
        updatePos(+100, 0);
    } else if (e.key === 'ArrowRight') {
        updatePos(-100, 0);
    } else if (e.key === 'Home') {
        reset();
    } else {
        console.log(e);
    }
});

window.addEventListener('wheel', e => {
    updateZoom(-Math.sign(e.deltaY)/3, new Vec(e.clientX, e.clientY));
});
