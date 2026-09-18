import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../portal-v2/index.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../portal-v2/topbar-actions.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../portal-v2/topbar-actions.css',import.meta.url),'utf8');

test('portal header exposes functional notifications, help, account and full menu controls',()=>{
 for(const id of ['portalNotifications','portalHelp','portalMainMenu','portalAccount'])assert.match(html,new RegExp(`id=["']${id}["']`));
 for(const panel of ['portalNotificationsPanel','portalHelpPanel','portalAccountPanel'])assert.match(html,new RegExp(`id=["']${panel}["']`));
 assert.match(html,/topbar-actions\.js/);
 assert.match(html,/topbar-actions\.css/);
});

test('portal topbar actions bind panels, reuse the canonical all-pages menu and leave mobile More router-owned',()=>{
 assert.match(js,/togglePanel/);
 assert.match(js,/portalNotificationsList/);
 assert.match(js,/showPages\.click\(\)/);
 assert.doesNotMatch(js,/byId\('mobileMore'\)\?\.addEventListener/);
 assert.match(js,/event\.key==='Escape'/);
});

test('header controls stay reachable on mobile and demoAI',()=>{
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/\.topactions\{display:flex!important/);
 assert.match(css,/\.portal-demo-ai \.portal-popover/);\n assert.match(css,/@media\(max-width:760px\)\{\.topaction-menu\{display:none!important\}/);
});


test('portal route is registered in the quality surface registry',()=>{
 const registry=JSON.parse(fs.readFileSync(new URL('../config/powerhouse-quality-surface-contracts.json',import.meta.url),'utf8'));
 const surface=registry.surfaces.find(x=>x.id==='route:/');
 assert.equal(surface?.authority,'portal-v2/index.html');
 assert.equal(surface?.evidence_contract,'tests/portal-v2-topbar-actions.test.mjs');
 assert.equal(surface?.required,true);
});
