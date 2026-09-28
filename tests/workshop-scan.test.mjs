
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../scan.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../assets/scan-workshop.css", import.meta.url), "utf8");
const js = fs.readFileSync(new URL("../assets/scan-workshop.js", import.meta.url), "utf8");
const redirects = fs.readFileSync(new URL("../_redirects", import.meta.url), "utf8");

test("workshop scan exposes complete funnel", () => {
  assert.match(html, /Jouw bedrijf\.\s*Jouw nulmeting\./s);
  assert.match(html, /Download jouw PDF/);
  assert.match(html, /Scores per domein/);
  assert.match(html, /Kies je volgende stap/);
  assert.match(html, /Verdiepende Scan/);
  assert.match(html, /€ 2\.950/);
  assert.match(html, /Control \/ Scale \/ Enterprise/);
  assert.match(html, /reportQr/);
});

test("scan has six domains and eighteen questions", () => {
  for (const domain of ["Strategie & focus","Kennis & continuïteit","Processen & overdracht","Data & systemen","Mensen & uitvoering","AI & automatisering"]) {
    assert.ok(js.includes(domain), domain + " missing");
  }
  const q = [...js.matchAll(/\["(?:strategie|kennis|processen|data|mensen|ai)","/g)];
  assert.equal(q.length, 18);
});

test("scan supports workshop attribution and PDF generation", () => {
  for (const key of ["workshop","partner","event","utm_source","utm_medium","utm_campaign"]) {
    assert.ok(js.includes(key), key + " attribution missing");
  }
  assert.match(js, /html2pdf/);
  assert.match(js, /new QRCode/);
  assert.match(js, /Web3Forms|web3forms/i);
});

test("scan route and responsive/report styles exist", () => {
  assert.match(redirects, /^\/scan\s+\/scan\.html\s+200/m);
  assert.match(css, /#reportRoot/);
  assert.match(css, /@media\(max-width:940px\)/);
});
