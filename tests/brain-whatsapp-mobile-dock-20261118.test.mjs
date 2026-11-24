import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../assets/bg-app-experience.css',import.meta.url),'utf8');
const build=readFileSync(new URL('../tools/site-shell/apply-cms-runtime.mjs',import.meta.url),'utf8');
const browser=readFileSync(new URL('./integration/portal-v2-website-one-app-phone-tablet.spec.js',import.meta.url),'utf8');
const learning=JSON.parse(readFileSync(new URL('../brain/learning/2026-11-18-whatsapp-mobile-dock-v1.json',import.meta.url),'utf8'));

test('both WhatsApp implementations remain green above the public mobile dock',()=>{
 assert.match(css,/:is\(a\.wa,a\.bg-whatsapp-contact\[data-bg-component="whatsapp-contact"\]\)/);
 assert.match(css,/@media\(max-width:1100px\)/);
 assert.match(css,/bottom:calc\(86px \+ env\(safe-area-inset-bottom,0px\)\)!important/);
 assert.match(css,/background-color:#25D366!important;color:#fff!important/);
 assert.match(css,/z-index:1410!important/);
 assert.match(css,/body\.bg-app-public-has-dock:has\(a\.bg-whatsapp-contact/);
 assert.match(css,/body\.bg-app-public-has-dock\.bg-site-mobile-menu-open/);
 assert.match(build,/bg-app-experience\.css\?v=20261118-wa-dock/);
 assert.match(browser,/\[320,390,820\]/);
 assert.match(browser,/toBeLessThanOrEqual\(values\.navTop-8\)/);
 assert.match(browser,/rgb\(37, 211, 102\)/);
});

test('ONE BRAIN records this screenshot regression and real-browser proof requirement',()=>{
 assert.equal(learning.obligation_id,'site|ux|whatsapp-mobile-dock|20261118-v1');
 assert.equal(learning.status,'FIX_CANDIDATE');
 assert.ok(learning.tests.includes('tests/integration/portal-v2-website-one-app-phone-tablet.spec.js'));
 assert.ok(learning.evaluation.historical_replay.includes('tests/brain-whatsapp-mobile-dock-20261118.test.mjs'));
});
