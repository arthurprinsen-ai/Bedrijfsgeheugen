import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync as read} from 'node:fs';
import {cmsQuality,cmsPowerhouseLoop} from '../assets/cms-quality-gate.mjs';

const html=read('cms.html','utf8');
const studio=read('assets/cms-studio.mjs','utf8');
const admin=read('netlify/functions/cms-admin.mjs','utf8');
const publicApi=read('netlify/functions/cms-public.mjs','utf8');

test('canonical CMS studio is attached to original authenticated CMS, not another publisher',()=>{
  assert.match(html,/src="\/assets\/cms-admin\.js"/);
  assert.match(html,/src="\/assets\/cms-studio\.mjs"/);
  assert.match(studio,/import \{ cmsQuality, cmsSafeUrl \} from '\.\/cms-quality-gate\.mjs'/);
  assert.doesNotMatch(studio,/\bfetch\s*\(|\bsetInterval\s*\(|\bsetTimeout\s*\(|\/api\/cms-public|supabase\.co/);
  assert.match(studio,/originale CMS-workflow/);
  assert.match(admin,/hasAdminRole\(user\)/);
  assert.match(admin,/CMS_VERSION_CONFLICT/);
  assert.match(admin,/CMS_QUALITY_GATE_BLOCKED/);
  assert.match(publicApi,/action:'cms_public'/);
});
test('studio uses accessible structured forms, advanced rescue and a safe in-frame draft preview',()=>{
  assert.match(studio,/setAttribute\('aria-label','Visuele contenteditor'\)/);
  assert.match(studio,/new Event\('input',\{bubbles:true\}\)/);
  assert.match(studio,/className='cms-studio-advanced'/);
  assert.match(studio,/frame\.contentWindow\.location\.origin!==location\.origin/);
  assert.match(studio,/cmsSafeUrl\(value\.href,\{link:true\}\)/);
  assert.match(studio,/cmsSafeUrl\(value\.src\)/);
  assert.match(studio,/\['text','link','image','meta','toggle'\]\.includes\(type\)/);
  assert.match(studio,/Dit verandert de echte website NIET/);
  assert.match(html,/<option value="structured">Gestructureerde briefing<\/option>/);
});
test('server-side authority blocks invalid content; read-only Powerhouse loop cannot fake outcomes',()=>{
  const valid={id:'00000000-0000-4000-8000-000000000001',version:1,surface:'website',locale:'nl-NL',route:'/',
    element_key:'website.home.hero',area:'hero',element_type:'text',content:{text:'Een heldere boodschap voor ondernemers.'},status:'draft'};
  const ok=cmsQuality(valid);assert.equal(ok.publishEligible,true);assert.equal(ok.humanApprovalRequired,true);
  assert.equal(ok.providerReadbackVerified,false);assert.equal(ok.revenueVerified,false);
  const bad=cmsQuality({...valid,element_type:'link',content:{text:'Bekijk aanbod',href:'javascript:alert(1)'}});
  assert.equal(bad.publishEligible,false);
  assert.ok(bad.errors.includes('LINK_URL_UNSAFE'));
  const loop=cmsPowerhouseLoop([valid],'2026-11-02T08:00:00Z');
  assert.equal(loop.allGreen,false);
  assert.equal(loop.stages.find(x=>x.id==='leads_and_orders').status,'EVIDENCE_DUE');
  assert.equal(loop.stages.find(x=>x.id==='verified_learning').status,'EVIDENCE_DUE');
});
