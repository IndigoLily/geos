import {View} from "./view.js";

export const cnv = document.createElement("canvas");
export const ctx = cnv.getContext("2d")!;

cnv.width = 1024;
cnv.height = cnv.width / 2;

export const view = new View(0, 0, cnv.width, cnv.height);



const starRatio = (3 - Math.sqrt(5)) / 2;
export function mkStarPath(R: number) {
  const starPath = new Path2D();
  const r = R * starRatio;

  for (let i = 0; i < 5; i++) {
    let a = (i / 5 - 1 / 20) * Math.PI * 2;
    starPath.lineTo(Math.cos(a) * R, Math.sin(a) * R);

    a += 1 / 10 * Math.PI * 2;
    starPath.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }

  return starPath;
}



type FeatureType = "water" | "reef" | "land" | "forest" | "desert" | "swamp" | "mountain" | "volcano" | "lake" | "river";
const CLR: Record<FeatureType, string> = {
  water: "#8ab4f8ff",
  reef: "#8adcf8ff",
  land: "#bbe2c6ff",
  forest: "#94d2a5ff",
  swamp: "#b5cd98ff",
  desert: "#f3eddfff",
  mountain: "#bcbfc3ff",
  volcano: "#d9c2a5ff",
  get lake() {return this.water},
  get river() {return this.water},
} as const;

for (const [feature, clr] of Object.entries(CLR)) {
  document.querySelectorAll(`.${feature}-fill`).forEach(el => (el as HTMLElement).style.backgroundColor = clr)
}



const mapDataPromise = fetch("map.json").then(response => response.json());
//export type MapData = {
//  paths: Record<FeatureType, Array<Array<[number, number]>>>,
//  cities: Array<{
//    name: string,
//    position: "above" | "below" | "left" | "right",
//    point: [number, number],
//    is_capital: boolean,
//  }>,
//  countries: Array<{
//    name: string,
//    point: [number, number],
//  }>,
//};

window.onload = async () => Promise.resolve();

export const ready =
  Promise.all([window.onload, mapDataPromise])
    .then(async ([_, mapData]) => {
      console.debug(mapData);

      function drawPaths(ctx: CanvasRenderingContext2D, kind: FeatureType) {
        const paths = mapData.paths[kind];
        if (paths === undefined) {
          console.warn(`tried to draw ${kind}, but mapData does not contain that`);
          return;
        }
        ctx.fillStyle = CLR[kind];

        ctx.beginPath();
        for (const path of paths) {
          const [x, y] = path.slice(0, 1)[0];
          ctx.moveTo(...view.mapToScreen(x, y));

          for (const [x, y] of path.slice(1)) {
            ctx.lineTo(...view.mapToScreen(x, y));
          }
        }
        ctx.fill();
      }

      function* chunks<T>(arr: Array<T>, n: number) {
        for (let i = 0; i < arr.length; i += n) {
          yield arr.slice(i, i + n);
        }
      }

      function drawRivers(ctx: CanvasRenderingContext2D) {
        const paths = mapData.paths.river;
        if (paths === undefined) {
          console.warn(`tried to draw river, but mapData does not contain that`);
          return;
        }

        ctx.save();

        ctx.lineWidth = Math.max(1 / Math.sqrt(2), view.scale / 4);
        ctx.strokeStyle = CLR.river;
        ctx.lineCap = "round";

        ctx.beginPath();
        for (const path of paths) {
          const [x, y] = path.slice(0, 1)[0];
          ctx.moveTo(...view.mapToScreen(x, y));

          for (const [[x1, y1], [x2, y2], [x3, y3]] of chunks<[number, number]>(path.slice(1), 3)) {
            ctx.bezierCurveTo(
              ...view.mapToScreen(x1, y1),
              ...view.mapToScreen(x2, y2),
              ...view.mapToScreen(x3, y3)
            );
          }
        }
        ctx.stroke();

        ctx.restore();
      }

      function drawNames(ctx: CanvasRenderingContext2D) {
        const r = view.wh_min * view.scale ** 0.5 * devicePixelRatio ** 0.2 / 900;

        ctx.save();
        ctx.fillStyle = "#000";
        ctx.strokeStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (r > 3) { // draw cities
          ctx.font = `${r * 4}px serif`;
          ctx.lineWidth = r / 2;

          const starPath = mkStarPath(r * 3);

          for (const city of mapData.cities) {
            if (city.name === "") {
              continue;
            }

            const screenPoint = view.mapToScreen(...(city.point as [number, number]));

            // city dot
            // TODO draw city symbol once in offscreen canvas, then draw that canvas on the main one where the cities go
            // TODO do once per zoom change, not once per frame
            if (city.is_capital) {
              ctx.translate(...screenPoint);
              ctx.fill(starPath);
              ctx.setTransform(1, 0, 0, 1, 0, 0);
            } else {
              ctx.beginPath();
              ctx.arc(...screenPoint, r, 0, Math.PI * 2);
              ctx.fill();
            }

            // city name
            switch (city.position) {
              case "above":
                screenPoint[1] -= r * (city.is_capital ? 6 : 4);
                break;
              case "below":
                screenPoint[1] += r * (city.is_capital ? 6 : 4);
                break;
              case "left":
                screenPoint[0] -= r * (city.is_capital ? 4 : 2) + ctx.measureText(city.name).width / 2;
                break;
              case "right":
                screenPoint[0] += r * (city.is_capital ? 4 : 2) + ctx.measureText(city.name).width / 2;
                break;
              default:
                throw `Invalid city position: ${city.position}`;
            }
            ctx.strokeText(city.name, ...screenPoint);
            ctx.fillText(city.name, ...screenPoint);
          }
        } else { // draw countries
          ctx.font = `${r * 10}px serif`;
          ctx.lineWidth = r;

          for (const country of mapData.countries) {
            if (country.name === "") {
              continue;
            }

            const screenPoint = view.mapToScreen(...(country.point as [number, number]));

            ctx.strokeText(country.name, ...screenPoint);
            ctx.fillText(country.name, ...screenPoint);
          }
        }

        ctx.restore();
      }

      return function drawMap(ctx: CanvasRenderingContext2D) {
        ctx.clearRect(0, 0, view.w, view.h);

        drawPaths(ctx, "reef");
        drawPaths(ctx, "land");
        ctx.globalCompositeOperation = "source-atop";
        drawPaths(ctx, "forest");
        drawPaths(ctx, "desert");
        drawPaths(ctx, "swamp");
        drawPaths(ctx, "mountain");
        drawPaths(ctx, "volcano");
        drawPaths(ctx, "lake");
        drawRivers(ctx);
        ctx.globalCompositeOperation = "source-over";

        ctx.lineWidth = 1;

        // prime meridian
        ctx.strokeStyle = "#00f";
        ctx.globalAlpha = 1 / 3;
        ctx.beginPath();
        ctx.moveTo((view.w / 2 - view.x * view.scale) | 0, 0);
        ctx.lineTo((view.w / 2 - view.x * view.scale) | 0, view.h);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // equator
        ctx.strokeStyle = "#f00";
        ctx.globalAlpha = 1 / 3;
        ctx.beginPath();
        ctx.moveTo(0, (view.h / 2 - view.y * view.scale) | 0);
        ctx.lineTo(view.w, (view.h / 2 - view.y * view.scale) | 0);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // border
        ctx.strokeStyle = "#000";
        ctx.strokeRect(
          view.w / 2 + (-view.wh_min - view.x) * view.scale,
          view.h / 2 + (-view.wh_min / 2 - view.y) * view.scale,
          view.wh_min * 2 * view.scale,
          view.wh_min * view.scale
        );

        drawNames(ctx);
      }
    });
