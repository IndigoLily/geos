import { mkStarPath, ready, cnv, ctx, view } from "./drawmap.js";
import { Dir, heldPanKeys, heldZoomKeys, init as inputInit } from "./input.js"

document.body.appendChild(cnv);

function resize() {
  [cnv.width, cnv.height] = view.resize();
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
    Array.from(heldPanKeys)
      .map(key => Dir.fromKey(key))
      .reduce(
        (sum: Dir, current: Dir) => sum.add(current),
        new Dir("")
      ).moveView(view);

    view.scaleExponent += Array.from(heldZoomKeys).reduce((prev:number,current:string) => prev + (current === "+" ? 1 : -1), 0) / 25;

    drawMap(ctx);

    requestAnimationFrame(drawFrame);
  }

  drawFrame();
});
