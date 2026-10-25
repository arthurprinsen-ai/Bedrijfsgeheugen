import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const page=readFileSync(new URL('../frisse-blik.html',import.meta.url),'utf8');

test('completed Frisse Blik scan exposes one voluntary booking action',()=>{
 const start=page.indexOf('<section class="screen" id="dash">');
 const action=page.indexOf('id="scan-next-step-booking"');
 const lead=page.indexOf('id="leadForm"');
 assert.ok(start>=0 && action>start && action<lead, 'CTA is in the completed result, outside the hidden lead modal');
 assert.equal(page.split('id="scan-next-step-booking"').length-1,1);
 assert.match(page, /id="scanAdviceBooking" onclick="openLead\(\)"/);
});

test('CTA routes through existing validated consent and real Calendly event',()=>{
 assert.match(page, /id="ldOk"/);
 assert.match(page, /!\$\('ldOk'\)\.checked/);
 assert.match(page, /function openLead\(\)/);
 assert.match(page, /function showCalStep\(lead\)/);
 assert.match(page, const match=page.match(/calendly:'([^']+)'/);
 assert.ok(match,'existing provider URL required');
 const eventUrl=new URL(match[1]);
 assert.equal(eventUrl.origin,'https://calendly.com','exact provider origin');
 assert.equal(eventUrl.pathname,'/arthur-prinsen/adviesgesprek-slimmer-geregeld','exact approved advisory booking event'););
 assert.match(page, /calendly\.event_scheduled/);
});

test('conversion prompt never claims a verified meeting or paid order',()=>{
 const element=page.match(/<div class="g hov" id="scan-next-step-booking"[\s\S]*?<\/div>\s*<\/div>/)?.[0]||'';
 assert.ok(element.includes('Plan je adviesgesprek'));
 assert.doesNotMatch(element,/gesprek (?:is|werd) geboekt|betaalde order|betaling bevestigd/i);
});