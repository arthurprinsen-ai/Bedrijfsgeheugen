import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../portal-v2/index.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../portal-v2/topbar-actions.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../portal-v2/topbar-actions.css',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../portal-v2/app.js',import.meta.url),'utf8');
const hubs=fs.readFileSync(new URL('../portal-v2/hubs.js',import.meta.url),'utf8');
const navigation=fs.readFileSync(new URL('../portal-v2/navigation-model.js',import.meta.url),'utf8');
const navigationCss=fs.readFileSync(new URL('../portal-v2/navigation.css',import.meta.url),'utf8');

test('portal header exposes functional notifications, help, account and full menu controls',()=>{
 for(const id of ['portalNotifications','portalHelp','portalAccount','portalFullMenuToggle'])assert.match(html,new RegExp(`id=["']${id}["']`));
 for(const panel of ['portalNotificationsPanel','portalHelpPanel','portalAccountPanel'])assert.match(html,new RegExp(`id=["']${panel}["']`));
 assert.match(html,/topbar-actions\.js/);
 assert.match(html,/topbar-actions\.css/);
});

test('portal topbar actions bind panels, reuse the canonical all-pages menu and leave mobile More router-owned',()=>{
 assert.match(js,/togglePanel/);
 assert.match(js,/portalNotificationsList/);
 assert.match(js,/showPages\.click\(\)/);
 assert.doesNotMatch(js,/portalMainMenu/);
 assert.doesNotMatch(js,/byId\('mobileMore'\)\?\.addEventListener/);
 assert.match(js,/event\.key==='Escape'/);
});

test('header controls stay reachable on mobile and desktop-only menu cannot be re-enabled by stronger mobile shell selectors',()=>{
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/\.topactions\{display:flex!important/);
 assert.match(css,/\.portal-demo-ai \.portal-popover/);
 assert.match(css,/\.topactions \.searchrow>\.topaction-menu/);
 assert.match(css,/\.portal-demo-ai \.topactions \.searchrow>\.topaction-menu\{display:none!important\}/);
});

test('portal route is registered in the quality surface registry',()=>{
 const registry=JSON.parse(fs.readFileSync(new URL('../config/powerhouse-quality-surface-contracts.json',import.meta.url),'utf8'));
 const surface=registry.surfaces.find(x=>x.id==='route:/');
 assert.equal(surface?.authority,'portal-v2/index.html');
 assert.equal(surface?.evidence_contract,'tests/portal-v2-topbar-actions.test.mjs');
 assert.equal(surface?.required,true);
});


test('full portal hamburger exposes all registered pages through one canonical menu',()=>{
 assert.match(html,/id=["']portalFullMenuToggle["']/);
 assert.match(app,/portalFullMenuToggle/);
 assert.match(app,/navigatePortal\('hub:portal'\)/);
 assert.match(hubs,/pages:Object\.freeze\(allPageIds\(\)\)/);
 assert.match(hubs,/if\(hubId==='portal'\) return listPortalGroups\(\)/);
 assert.match(navigation,/id:'more', label:'Meer', target:'hub:portal'/);
 assert.match(navigationCss,/\.portal-hamburger\{display:inline-flex/);
 assert.match(navigationCss,/\.allpages \.groups\{grid-template-columns:1fr!important/);
});
