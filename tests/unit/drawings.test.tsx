// Every drawing must render the same shapes and labels as the legacy page (colors renamed to tokens only).
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { loadLegacyDrawings, retoken } from "../../scripts/lib-legacy.ts";
import { Drawing, QattSVG, WeaveSVG } from "../../src/study/drawings";

// Normalize both sides to a list of elements with sorted attributes.
function shape(svg: string) {
  const s = svg.replace(/\s+/g, " ").replace(/> </g, "><").replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  return [...s.matchAll(/<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>|([^<]+)/g)].map((m) => {
    if (m[5] !== undefined) return "TEXT:" + m[5].trim();
    const attrs = [...m[3].matchAll(/([a-zA-Z0-9-:]+)="([^"]*)"/g)].map((a) => `${a[1].toLowerCase().replace(/-/g, "")}=${a[2].trim()}`).sort();
    return `${m[1]}${m[2].toLowerCase()} ${attrs.join(" ")}${m[4]}`.trim();
  }).filter((x) => x !== "TEXT:").map((x) => x.replace(/^(\w+)(.*)\/$/, "$1$2"));
}
// React writes <rect .../> while the legacy markup sometimes writes <rect ...></rect>; drop closing tags of empty elements.
const flat = (a: string[]) => a.filter((x) => !/^\/(rect|path|circle|ellipse|line)$/.test(x));
const L = loadLegacyDrawings();

describe("drawings match the legacy page", () => {
  for (const name of Object.keys(L.SVG)) {
    it(name, () => {
      expect(flat(shape(renderToStaticMarkup(<Drawing name={name} />)))).toEqual(flat(shape(retoken(L.SVG[name]()))));
    });
  }
  it("Al-Qatt builder, every layer combination, both palettes", () => {
    for (let m = 0; m < 16; m++) for (const mono of [true, false]) {
      const on = [0, 1, 2, 3].map((b) => !!(m & (1 << b)));
      expect(flat(shape(renderToStaticMarkup(<QattSVG on={on} mono={mono} />)))).toEqual(flat(shape(retoken(L.qattSVG(on, mono)))));
    }
  });
  it("weave grids", () => {
    for (const rule of ["plain", "twill", "satin"])
      expect(flat(shape(renderToStaticMarkup(<WeaveSVG rule={rule} label="Twill" />)))).toEqual(flat(shape(retoken(L.weaveSVG(rule, "Twill")))));
  });
});
