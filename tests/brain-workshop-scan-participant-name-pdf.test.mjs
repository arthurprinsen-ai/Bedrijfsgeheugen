import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html=fs.readFileSync(new URL("../pages/scan.html",import.meta.url),"utf8");
const js=fs.readFileSync(new URL("../assets/scan-workshop.js",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../assets/scan-workshop.css",import.meta.url),"utf8");

test("personal workshop PDF visibly contains participant name on both pages",()=>{
  assert.match(html,/id="reportPersonName"/);
  assert.match(html,/id="reportPersonName2"/);
  assert.match(js,/participantName=el\("#name"\)\.value\.trim\(\)/);
  assert.match(js,/reportPersonName/);
  assert.match(js,/reportPersonName2/);
  assert.match(css,/\.report-person/);
});

test("PDF filename is personalized by company and participant",()=>{
  assert.match(js,/companySlug/);
  assert.match(js,/nameSlug/);
  assert.match(js,/Bedrijfsgeheugen-scanrapport-"\+companySlug\+"-"\+nameSlug/);
});

test("participant name remains part of the private portal intake",()=>{
  assert.match(js,/contact_name:el\("#name"\)\.value\.trim\(\)/);
});
