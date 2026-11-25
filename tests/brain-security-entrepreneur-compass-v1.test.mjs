import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildSafetyCompass} from '../portal-v2/modules/security-trust-workspace.js';
const at=Date.parse('2026-11-02T15:00:00Z');
const observed_at='2026-11-02T14:00:00Z',expires_at='2026-11-03T14:00:00Z';
const snap='2026-11-02T14:30:00Z';
const summary={postureStatus:'VERIFIED_NO_OPEN_FINDINGS',evidenceCoverage:100};
const all=()=>buildSafetyCompass(summary,[],snap,[],at).areas.flatMap(area=>area.checks.map(([provider_key,control_key])=>({provider_key,control_key,status:'PASS',evidence_available:true,observed_at,expires_at})));

test('veiligheidskompas treats evidence coverage as coverage, never a safety score',()=>{
 const m=buildSafetyCompass({postureStatus:'EVIDENCE_PARTIAL',evidenceCoverage:92},[],snap,[],at);
 assert.equal(m.coverage,92);
 assert.equal(m.overall,'EVIDENCE_PARTIAL');
 assert.equal(m.areas.every(a=>a.status==='EVIDENCE_PARTIAL'),true);
 assert.equal(m.verifiedSources,0);
 assert.equal(m.snapshotFresh,true);
 assert.match(m.explanation,/ontbrekend of verlopen bewijs/i);
});
test('positive customer copy requires every required source and fresh snapshot',()=>{
 const sources=all(),good=buildSafetyCompass(summary,sources,snap,[],at);
 assert.equal(good.overall,'VERIFIED_NO_OPEN_FINDINGS');
 assert.equal(good.areas.every(a=>a.status==='VERIFIED'),true);
 assert.equal(good.verifiedSources,sources.length);
 assert.match(good.title,/actueel bevestigd/i);
 assert.match(good.explanation,/doorlopend proces/i);
 assert.equal(buildSafetyCompass(summary,sources,'2026-10-29T11:00:00Z',[],at).overall,'EVIDENCE_PARTIAL');
});
test('open risk, stale, negated status and missing evidence cannot turn green',()=>{
 const sources=all(),archive=sources.find(o=>o.control_key==='ARCHIVE_PREVIEW_ACCESS');
 archive.status='FAIL';
 const withRisk=buildSafetyCompass(summary,sources,snap,[{title:'private'}],at);
 assert.equal(withRisk.overall,'ACTION_REQUIRED');
 assert.equal(withRisk.findingCount,1);
 assert.equal(withRisk.areas.find(a=>a.id==='leveranciers').status,'ACTION_REQUIRED');
 assert.match(withRisk.explanation,/niet automatisch een datalek/i);
 for(const changed of [{status:'NOT_VERIFIED'},{evidence_available:false},{expires_at:'2026-11-02T14:00:00Z'}]){
  const trial=all();Object.assign(trial[0],changed);
  const m=buildSafetyCompass(summary,trial,snap,[],at);
  assert.equal(m.overall,'EVIDENCE_PARTIAL');
  assert.equal(m.areas.find(a=>a.id==='toegang').status,'EVIDENCE_PARTIAL');
 }
});
test('customer does not receive technical incident or privileged evidence HTML',()=>{
 const src=readFileSync('portal-v2/modules/security-trust-workspace.js','utf8');
 assert.match(src,/renderSecurity\(root,security,sovereignty,scope,internal\)/);
 assert.match(src,/adminView\?renderSecurityAdminMetrics/);
 assert.match(src,/adminView\?\(findings\.map/);
 assert.match(src,/adminView\?\(observations\.map/);
 assert.match(src,/data-safety-customer-evidence/);
 assert.match(src,/data-safety-customer-findings/);
 assert.match(src,/securityOverallPosture\(summary,rows,generatedAt,nowMs\)/);
 assert.match(src,/data-safety-compass/);
 assert.match(src,/https:\/\/www\.bedrijfsgeheugen\.nl\/portal-v2\/\?page=gebruikers/);
 assert.match(src,/https:\/\/www\.bedrijfsgeheugen\.nl\/portal-v2\/\?page=data-ai-passport/);
 assert.doesNotMatch(src,/100% veilig|gecertificeerd door Bedrijfsgeheugen|gegarandeerd veilig/i);
});
test('mobile and assistive technology get status labels without color-only claims',()=>{
 const css=readFileSync('portal-v2/security-trust-workspace.css','utf8');
 const js=readFileSync('portal-v2/modules/security-trust-workspace.js','utf8');
 assert.match(css,/\.safety-compass/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(js,/aria-labelledby="safety-compass-title"/);
 assert.match(js,/Aandacht nodig/);
 assert.match(js,/Nog niet volledig bewezen/);
 assert.match(js,/Hoe bepalen jullie deze status\?/);
});
