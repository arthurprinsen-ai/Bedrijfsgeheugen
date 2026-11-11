import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyBusinessOSPositioning} from '../tools/site-shell/apply-business-os-positioning.mjs';

const html='<html><head></head><body><main><div class="wrap hero"><h1>Oorspronkelijke H1</h1></div><section class="bgvf" data-bg-business-value-first="v1"><h2>Waarde</h2></section></main></body></html>';
test('one-roof offer stays below existing H1 and before value-first section',()=>{
 const output=applyBusinessOSPositioning(html,{locale:'nl',page:'home'});
 assert.ok(output.indexOf('Oorspronkelijke H1')<output.indexOf('data-bg-business-os-journey'));
 assert.ok(output.indexOf('data-bg-business-os-journey')<output.indexOf('data-bg-business-value-first'));
 assert.equal((output.match(/data-bg-business-os-journey="v1"/g)||[]).length,1);
 assert.match(output,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/zelfscan"/);
 assert.match(output,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/prijzen"/);
 assert.match(output,/data-bg-conversion="bedrijfslek"/);
 assert.match(output,/prefers-reduced-motion/);
 assert.equal(applyBusinessOSPositioning(output,{locale:'nl',page:'home'}),output);
});
test('pricing inserts after hero, before original SaaS prices without changing billing',()=>{
 const original='<html><head></head><body><main><section class="hero"><h1>Kies software</h1></section><section id="prijzen-pakketten"><div class="price">€ 299 / maand</div></section></main></body></html>';
 const out=applyBusinessOSPositioning(original,{locale:'nl',page:'price'});
 assert.ok(out.indexOf('Kies software')<out.indexOf('data-bg-business-os-journey'));
 assert.ok(out.indexOf('data-bg-business-os-journey')<out.indexOf('id="prijzen-pakketten"'));
 assert.match(out,/€ 299 \/ maand/);
 assert.match(out,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/prijzen#prijzen-pakketten"/);
 assert.equal(applyBusinessOSPositioning(out,{locale:'nl',page:'price'}),out);
});
test('English uses the same canonical conversion path and never invents prices',()=>{
 const output=applyBusinessOSPositioning(html,{locale:'en',page:'home'});
 assert.match(output,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/en\/zelfscan"/);
 assert.match(output,/One home for your business/);
 assert.doesNotMatch(output,/€\s*(?:99|299|749)/);
});
test('canonical builder owns the one-roof pass and original invoices / pricing remain authoritative',()=>{
 const build=readFileSync(new URL('../tools/ci/netlify-build-entry.mjs',import.meta.url),'utf8');
 const code=readFileSync(new URL('../tools/site-shell/apply-business-os-positioning.mjs',import.meta.url),'utf8');
 assert.match(build,/\['business-os-positioning','tools\/site-shell\/apply-business-os-positioning\.mjs'\]/);
 assert.ok(build.indexOf("'daily-steering-positioning'")<build.indexOf("'business-os-positioning'"));
 assert.ok(build.indexOf("'business-os-positioning'")<build.indexOf("'sitemap'"));
 assert.doesNotMatch(code,/setInterval|cron\.schedule|update\s+public\.|create\s+table|service_role/);
 assert.match(code,/data-bg-funnel-stage/);
});
