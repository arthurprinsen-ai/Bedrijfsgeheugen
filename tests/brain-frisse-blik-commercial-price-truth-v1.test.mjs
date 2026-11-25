import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../frisse-blik.html',import.meta.url),'utf8');
const match=page.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);

test('Frisse Blik main product metadata never advertises an unverified zero price',()=>{
 assert.ok(match,'structured data required');
 const json=JSON.parse(match[1]);
 assert.equal(json.name,'Frisse Blik Scan');
 assert.equal(json.offers,undefined,'do not fabricate a free offer or numeric price');
 assert.ok(!/gratis scan/i.test(page.match(/<meta property="og:description" content="([^"]+)"/)?.[1]||''));
 assert.match(page,/vaste prijs vooraf/i);
 assert.match(page,/gratis oriënteren kan via de afzonderlijke zelfscan/i);
});
test('canonical scan intent and existing customer path remain intact',()=>{
 assert.match(page,/<link rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/frisse-blik">/);
 assert.match(page,/href="\/frisse-blik"/);
 assert.match(page,/href="\/zelfscan"/);
 assert.match(page,/<meta name="robots" content="index, follow">/);
});
