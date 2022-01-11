import { mkStarPath, ready, cnv as mapCnv, ctx, view } from "./drawmap";
import { Dir, heldPanKeys, heldZoomKeys, init as inputInit } from "./input";
import * as globe from './globe';
console.debug(globe);
document.body.appendChild(mapCnv);
let globeMode = false;
window.setGlobeMode = function (isOn) {
    globeMode = isOn;
    if (isOn) {
        globe.cnv.style.visibility = "";
        view.resize(1024, 512);
        view.x = 0;
        view.y = 0;
    }
    else {
        globe.cnv.style.visibility = "hidden";
        resize();
    }
};
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
    resize();
    inputInit(view);
    function drawFrame() {
        if (!globeMode) {
            Array.from(heldPanKeys)
                .map(key => Dir.fromKey(key))
                .reduce((sum, current) => sum.add(current), new Dir("")).moveView(view);
            view.scaleExponent += Array.from(heldZoomKeys).reduce((prev, current) => prev + (current === "+" ? 1 : -1), 0) / 25;
        }
        drawMap(ctx);
        if (globeMode) {
            globe.render();
        }
        requestAnimationFrame(drawFrame);
    }
    drawFrame();
});
