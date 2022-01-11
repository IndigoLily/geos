import { mkStarPath, ready, cnv as mapCnv, ctx, view } from "./drawmap";
import { Dir, heldPanKeys, heldZoomKeys, init as inputInit } from "./input"
import * as globe from './globe';

console.debug(globe);

document.body.appendChild(mapCnv);

let globeMode = false;

function setGlobeMode(isOn: boolean) {
  globeMode = isOn;

  if (isOn) {
    mapCnv.remove();
    document.body.appendChild(globe.cnv);

    view.resize(1024, 512);
    view.x = 0;
    view.y = 0;
  } else {
    globe.cnv.remove();
    document.body.appendChild(mapCnv);
  }

  resize();
}

window.addEventListener("click", () => {
  setGlobeMode(!globeMode);
});

setGlobeMode(true);

//(window as any).setGlobeMode = setGlobeMode;

function resize() {
  if (globeMode) {
    [globe.cnv.width, globe.cnv.height] = [window.innerWidth, window.innerHeight];
    globe.renderer.setSize(window.innerWidth, window.innerHeight);
    globe.camera.aspect = window.innerWidth / window.innerHeight;
    globe.camera.updateProjectionMatrix();
  } else {
    [mapCnv.width, mapCnv.height] = view.resize();
  }
}
window.addEventListener("resize", resize);

{
  const legendCapitalCanvas = document.getElementById("capital") as HTMLCanvasElement;
  const legendCapitalCtx = legendCapitalCanvas.getContext("2d")!;
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
        .reduce(
          (sum: Dir, current: Dir) => sum.add(current),
          new Dir("")
        ).moveView(view);

      view.scaleExponent += Array.from(heldZoomKeys).reduce((prev:number,current:string) => prev + (current === "+" ? 1 : -1), 0) / 25;
    }

    drawMap(ctx);

    if (globeMode) {
      globe.render();
    }

    requestAnimationFrame(drawFrame);
  }

  drawFrame();
});
