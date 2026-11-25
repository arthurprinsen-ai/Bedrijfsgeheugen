import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const baseline = JSON.parse(read("site/seo-baseline.json"));
const sitemap = read("sitemap.xml");

test("every SEO keyword owner route is listed in sitemap.xml", () => {
  const missing = baseline.keywordOwners
    .map((k) => k.route)
    .filter((route) => {
      const loc = route === "/" ? "https://www.bedrijfsgeheugen.nl/" : `https://www.bedrijfsgeheugen.nl${route}`;
      return !sitemap.includes(`<loc>${loc}</loc>`);
    });
  assert.deepEqual(missing, []);
});

test("the routes added with the 27 oct baseline change are present", () => {
  for (const route of ["/ai-modelwijzer", "/company-brain"]) {
    assert.ok(sitemap.includes(`<loc>https://www.bedrijfsgeheugen.nl${route}</loc>`), route);
  }
});
