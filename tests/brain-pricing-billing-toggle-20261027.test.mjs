import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../prijzen.html", import.meta.url), "utf8");
const offers = JSON.parse(readFileSync(new URL("../config/commercial-offers-v1.json", import.meta.url), "utf8"));

test("pricing page offers a monthly and yearly billing toggle", () => {
  assert.match(html, /class="billing-toggle"/);
  assert.match(html, /data-billing="monthly"/);
  assert.match(html, /data-billing="yearly"/);
  assert.match(html, /2 maanden gratis/);
});

test("yearly prices on the page equal ten monthly fees from the canonical catalogue", () => {
  const fmt = (cents) => `€ ${(cents / 100).toLocaleString("nl-NL")}`;
  for (const code of ["starter", "pro", "groei"]) {
    const plan = offers.saas.find((p) => p.code === code);
    assert.ok(plan.direct_checkout);
    const yearly = fmt(plan.monthly_price_cents * 10);
    assert.ok(html.includes(`${code}:{m:'${fmt(plan.monthly_price_cents)}',y:'${yearly}'`), `${code} yearly price drift`);
  }
});

test("plan CTAs carry the chosen billing cycle to the checkout", () => {
  assert.match(html, /afsluiten\?plan='\+m\[1\]\+\(yearly\?'&billing=yearly':''\)/);
});

test("static default stays monthly so the page works without JavaScript", () => {
  assert.match(html, /<div class="price">€ 99 <small>\/ maand<\/small><\/div>/);
});
