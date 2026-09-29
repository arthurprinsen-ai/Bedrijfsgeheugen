import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../../pages/scan.html", import.meta.url), "utf8");
const js = fs.readFileSync(new URL("../../assets/scan-workshop.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../../assets/scan-workshop.css", import.meta.url), "utf8");

test("workshop report is personalised with company context", () => {
  assert.match(html, /id="company"/);
  assert.match(html, /id="website"/);
  assert.match(html, /id="reportCompanyLine"/);
  assert.match(html, /id="reportCompanyLine2"/);\n  assert.match(html, /id="phone"/);\n  assert.match(html, /id="reportContactLine"/);\n  assert.match(html, /id="reportContactLine2"/);\n  assert.match(js, /el\("#name"\).*el\("#email"\).*el\("#phone"\)/);
  assert.match(html, /id="reportClientLogo"/);
  assert.match(html, /id="reportClientLogo2"/);
  assert.match(js, /resolveClientLogo/);
  assert.match(js, /websiteFromEmail/);
});

test("client logo is optional and never replaced by a generic placeholder", () => {
  assert.match(js, /clearClientLogo/);
  assert.match(js, /favicon\.svg/);
  assert.match(js, /favicon\.png/);
  assert.match(js, /favicon\.ico/);
  assert.doesNotMatch(js, /logo\.clearbit|google\.com\/s2\/favicons|duckduckgo/i);
  assert.match(css, /report-client-logo\[hidden\]/);
});

test("scan copy emphasizes personal company insight rather than a generic nulmeting", () => {
  assert.match(html, /Jouw bedrijfsbeeld/);
  assert.match(html, /Jouw persoonlijke scanuitkomst/);
});
