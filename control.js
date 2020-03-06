const map = document.getElementById('map');
const namesClose = document.getElementById('close');
const namesFar   = document.getElementById('far');
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
    const diff = mapToScreen(prevPos).sub(zoomCenter);
    updatePos(-diff.x,-diff.y);

    map.style.transform = `scale(${2**zoom})`;
    if (zoom < 1.5) {
        namesFar.style.display   = 'block';
        namesClose.style.display = 'none';
    } else {
        namesFar.style.display   = 'none';
        namesClose.style.display = 'block';
    }
}
function updateZoomTo(z = 0, zoomCenter = new Vec(0,0)) {
    const prevPos = screenToMap(zoomCenter);
    zoom = Math.min(z, 15);
    mapVec.sub(mapToScreen(prevPos).sub(zoomCenter));
    updatePos(0,0);

    map.style.transform = `scale(${2**zoom})`;
    if (zoom < 1.5) {
        namesFar.style.display   = 'block';
        namesClose.style.display = 'none';
    } else {
        namesFar.style.display   = 'none';
        namesClose.style.display = 'block';
    }
}

function reset() {
    zoom = 0;
    updateZoom();
    mapVec = new Vec(0, 0);
    updatePos((innerWidth-mapSize*2**zoom)/2, 0);
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

let touch1 = null;
let touch2 = null;
let oldMapVec = null;
let oldZoom = undefined;

window.addEventListener('touchstart', e => {
    if (!touch1) {
        touch1 = Array.from(e.touches).find(el => el.identifier === 0);
        touch1 = new Vec(touch1.clientX, touch1.clientY);
        oldMapVec = mapVec.copy();
    } else if (!touch2) {
        touch1 = Array.from(e.touches).find(el => el.identifier === 0);
        touch2 = Array.from(e.touches).find(el => el.identifier === 1);
        touch1 = new Vec(touch1.clientX, touch1.clientY);
        touch2 = new Vec(touch2.clientX, touch2.clientY);
        oldMapVec = mapVec.copy();
        oldZoom = zoom;
    }
});

window.addEventListener('touchend', e => {
    if (Array.from(e.changedTouches).some(el => el.identifier === 0)) {
        touch1 = null;
        oldMapVec = null;
    } else if (Array.from(e.changedTouches).some(el => el.identifier === 1)) {
        touch2 = null;
        oldZoom = undefined;
        touch1 = Array.from(e.touches).find(el => el.identifier === 0);
        touch1 = new Vec(touch1.clientX, touch1.clientY);
        oldMapVec = mapVec.copy();
    }
});

window.addEventListener('touchmove', e => {
    if (touch2) {
        let newTouch1 = Array.from(e.touches).find(el => el.identifier === 0);
        let newTouch2 = Array.from(e.touches).find(el => el.identifier === 1);
        newTouch1 = new Vec(newTouch1.clientX, newTouch1.clientY);
        newTouch2 = new Vec(newTouch2.clientX, newTouch2.clientY);

        const dist1 = Math.hypot(touch1.x    - touch2.x,    touch1.y    - touch2.y);
        const dist2 = Math.hypot(newTouch1.x - newTouch2.x, newTouch1.y - newTouch2.y);

        const oldCenter = touch1   .copy().add(touch2)   .scale(0.5)
        const newCenter = newTouch1.copy().add(newTouch2).scale(0.5)

        //mapVec = oldMapVec.copy().add(newCenter.sub(oldCenter));
        //updatePos(0,0);
        z = oldZoom + Math.log2(dist2/dist1);
        updateZoomTo(z, screenCenter);

    } else if (touch1) {
        let newTouch1 = Array.from(e.touches).find(el => el.identifier === 0);
        newTouch1 = new Vec(newTouch1.clientX, newTouch1.clientY);
        mapVec = oldMapVec.copy().add(newTouch1.sub(touch1));
        updatePos();
    }
});
