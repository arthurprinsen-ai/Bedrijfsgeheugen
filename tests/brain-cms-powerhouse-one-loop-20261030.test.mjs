import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {cmsQuality,cmsPowerhouseLoop,cmsSafeUrl} from '../assets/cms-quality-gate.mjs';
const record=(more={})=>({id:'00000000-0000-4000-8000-000000000001',version:1,status:'draft',
 surface:'portal',locale:'nl-NL',route:'*',area:'navigation',element_key:'portal.nav.manage',
 element_type:'text',content:{text:'Beheer'},...more});
test('canonical six content drafts are not published; quality is distinct from human approval',()=>{
 const rows=[record(),record({id:'2',surface:'shared',element_key:'shared.brand.name',content:{text:'Bedrijfsgeheugen'}}),
 record({id:'3',surface:'shared',element_key:'shared.contact.mail',element_type:'link',content:{href:'mailto:info@example.nl',text:'E-mail'}}),
 record({id:'4',surface:'shared',element_key:'shared.contact.phone',element_type:'link',content:{href:'tel:+31612345678',text:'Bel ons'}}),
 record({id:'5',surface:'website',route:'/',area:'seo',element_key:'website.home.description',element_type:'meta',content:{content:'Hulp bij inzicht, data en automatisering voor bedrijven.'}}),
 record({id:'6',surface:'website',route:'/',area:'seo',element_key:'website.home.title',content:{text:'Kennis borgen | Bedrijfsgeheugen'}})];
 const loop=cmsPowerhouseLoop(rows,'2026-10-30T20:30:00Z');
 assert.equal(loop.totals.draft,6);
 assert.equal(loop.totals.published,0);
 assert.equal(loop.totals.qualityBlocked,0);
 assert.equal(loop.status,'PUBLICATION_EVIDENCE_DUE');
 assert.equal(loop.stages.length,8);
 assert.equal(loop.allGreen,false);
 assert.ok(loop.stages.slice(4).every(x=>x.status==='EVIDENCE_DUE'));
 assert.equal(cmsQuality(rows[0]).status,'READY_FOR_EDITOR_REVIEW');
 assert.equal(cmsQuality(rows[0]).humanApprovalRequired,true);
});
test('links prohibit script, protocol-relative, backslash, data, insecure HTTP and control characters',()=>{
 for(const unsafe of ['javascript:alert(1)','data:text/html,<script>','//evil.example.com','http://evil.example.com',
  'vbscript:foo','/foo\\bar','https://good.example.com/\nattack'])
  assert.equal(cmsSafeUrl(unsafe,{link:true}),false,unsafe);
 for(const safe of ['/contact','/portal-v2/','#faq','https://www.bedrijfsgeheugen.nl/','mailto:info@example.nl','tel:+31612345678'])
  assert.equal(cmsSafeUrl(safe,{link:true}),true,safe);
 assert.equal(cmsQuality(record({element_type:'link',content:{text:'Klik hier',href:'javascript:alert(1)'}})).publishEligible,false);
 assert.ok(cmsQuality(record({element_type:'link',content:{text:'Klik hier',href:'/contact'}})).warnings.includes('CTA_COPY_NOT_SPECIFIC'));
});
test('published media requires valid src and alt, and decorative images may opt out',()=>{
 assert.equal(cmsQuality(record({element_type:'image',content:{src:'/img/hero.webp',alt:''}})).publishEligible,false);
 assert.equal(cmsQuality(record({element_type:'image',content:{src:'/img/hero.webp',alt:'Teamoverleg'}})).publishEligible,true);
 assert.equal(cmsQuality(record({element_type:'image',content:{src:'/img/decor.webp',decorative:true,alt:''}})).publishEligible,true);
});
test('dangerous active HTML, event handlers and unsafe attributes block publication',()=>{
 const malicious=['<script>alert(1)</script>','<img src=x onerror=alert(1)>','<svg onload=alert(1)>','<p>javascript:alert(1)</p>'];
 for(const html of malicious)assert.equal(cmsQuality(record({element_type:'html',content:{html}})).publishEligible,false,html);
 assert.equal(cmsQuality(record({element_type:'html',content:{html:'<p>Publicatie met bron</p>'}})).publishEligible,true);
 assert.equal(cmsQuality(record({element_type:'attribute',content:{attributes:{onclick:'alert(1)'}}})).publishEligible,false);
 assert.equal(cmsQuality(record({element_type:'toggle',content:{hidden:'true'}})).publishEligible,false);
});
test('quality findings remain visible but never become revenue, provider readback or automation approval',()=>{
 const item=record({element_type:'text',content:{text:'D'.repeat(260)}});
 const quality=cmsQuality(item);
 assert.equal(quality.status,'REVIEW_WITH_WARNINGS');
 assert.ok(quality.warnings.includes('EDITORIAL_SOURCE_REFS_DUE'));
 assert.equal(quality.publishEligible,true);
 assert.equal(quality.providerReadbackVerified,false);
 assert.equal(quality.revenueVerified,false);
 const loop=cmsPowerhouseLoop([item,record({id:'other',element_type:'image',content:{src:'/a.png'}})],'2026-10-30T20:40:00Z');
 assert.equal(loop.totals.qualityBlocked,1);
 assert.equal(loop.status,'REPAIR_DUE');
 assert.equal(loop.allGreen,false);
 assert.equal(cmsPowerhouseLoop(undefined,null).status,'UNAVAILABLE');
});
test('original CMS netlify route gates publish on saved item quality/version and verifies public projection',async()=>{
 const admin=await readFile(new URL('../netlify/functions/cms-admin.mjs',import.meta.url),'utf8');
 const ui=await readFile(new URL('../assets/cms-admin.js',import.meta.url),'utf8');
 const markup=await readFile(new URL('../cms.html',import.meta.url),'utf8');
 const cockpit=await readFile(new URL('../portal-v2/operating-system/executive-cockpit.js',import.meta.url),'utf8');
 const original=await readFile(new URL('../supabase/functions/portal-state-eu/index.ts',import.meta.url),'utf8');
 assert.match(admin,/hasAdminRole\(user\)/);
 assert.match(admin,/CMS_QUALITY_GATE_BLOCKED/);
 assert.match(admin,/CMS_VERSION_CONFLICT/);
 assert.match(admin,/cmsGateway\(\{action:'cms_public'/);
 assert.match(admin,/PUBLIC_PROJECTION_OBSERVED/);
 assert.match(admin,/cmsPowerhouseLoop\(data\.items,data\.generatedAt\)/);
 assert.match(ui,/expected_version:selected\.version/);
 assert.match(ui,/unsaved=true/);
 assert.match(markup,/id="cmsPowerhouseLoop"/);
 assert.match(markup,/id="cmsQuality"/);
 assert.match(cockpit,/href="\/cms\.html"/);
 assert.match(original,/\.eq\('status','published'\)/);
 assert.doesNotMatch(admin,/setInterval|cron\.schedule|cms_content_items\)\.insert/);
});
