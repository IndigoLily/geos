import { mkStarPath, ready, cnv as mapCnv, ctx, view } from "./drawmap";
import { Dir, heldPanKeys, heldZoomKeys } from "./input";
import * as globe from './globe';
console.debug(globe);
document.body.appendChild(mapCnv);
let globeMode = false;
function resize() {
    if (globeMode) {
        [globe.cnv.width, globe.cnv.height] = [window.innerWidth, window.innerHeight];
        globe.renderer.setSize(window.innerWidth, window.innerHeight);
        globe.camera.aspect = window.innerWidth / window.innerHeight;
        globe.camera.updateProjectionMatrix();
    }
    else {
        [mapCnv.width, mapCnv.height] = view.resize();
    }
}
window.addEventListener("resize", resize);
{
    const legendCapitalCanvas = document.getElementById("capital");
    const legendCapitalCtx = legendCapitalCanvas.getContext("2d");
    const r = legendCapitalCanvas.width / 2;
    legendCapitalCtx.fillStyle = "#000";
    legendCapitalCtx.translate(r, r);
    legendCapitalCtx.fill(mkStarPath(r));
}
ready.then(drawMap => {
    function setGlobeMode(isOn) {
        globeMode = isOn;
        if (globeMode) {
            mapCnv.remove();
            document.body.appendChild(globe.cnv);
            view.resize(1024 * 8, 1024 * 4);
            view.x = 0;
            view.y = 0;
            drawMap(ctx, true);
            globe.mapTexture.needsUpdate = true;
        }
        else {
            globe.cnv.remove();
            document.body.appendChild(mapCnv);
        }
        resize();
    }
    window.addEventListener("click", () => {
        setGlobeMode(!globeMode);
    });
    setGlobeMode(true);
    function drawFrame() {
        if (globeMode) {
            globe.render();
        }
        else {
            Array.from(heldPanKeys)
                .map(key => Dir.fromKey(key))
                .reduce((sum, current) => sum.add(current), new Dir("")).moveView(view);
            view.scaleExponent += Array.from(heldZoomKeys).reduce((prev, current) => prev + (current === "+" ? 1 : -1), 0) / 25;
            drawMap(ctx);
        }
        requestAnimationFrame(drawFrame);
    }
    drawFrame();
});
