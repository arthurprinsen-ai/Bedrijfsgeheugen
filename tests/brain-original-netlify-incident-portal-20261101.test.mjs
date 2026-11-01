import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  summarizeOriginalNetlifyIncident,
  ORIGINAL_NETLIFY_INCIDENT_URL,
  ORIGINAL_NETLIFY_INCIDENT_CONTRACT
} from '../brain/observability/original-netlify-incident-readback.mjs';

const sha='a'.repeat(40);
const issue={number:5241,state:'open',updated_at:'2026-11-01T20:32:32Z'};
test('P0 #5241 original open build incident remains visibly open even with exact live release',()=>{
  const x=summarizeOriginalNetlifyIncident({issue,githubHeadSha:sha,publishedSha:sha,manifestVerified:true});
  assert.equal(x.contract,ORIGINAL_NETLIFY_INCIDENT_CONTRACT);
  assert.equal(x.status,'READBACK_COMPLETE');
  assert.equal(x.issueState,'OPEN');
  assert.equal(x.productionCurrent,true);
  assert.equal(x.rootCauseProof,'UNVERIFIED_FULL_BUILD_PHASE');
  assert.match(x.nextAction,/bouwfase/);
  assert.equal(x.issueUrl,ORIGINAL_NETLIFY_INCIDENT_URL);
});
test('P0 #5241 never treats issue closure as provider production proof',()=>{
  const x=summarizeOriginalNetlifyIncident({issue:{...issue,state:'closed'},githubHeadSha:sha,publishedSha:'b'.repeat(40),manifestVerified:true});
  assert.equal(x.issueState,'CLOSED');
  assert.equal(x.productionCurrent,false);
  assert.equal(x.rootCauseProof,'UNVERIFIED_FULL_BUILD_PHASE');
});
test('P0 #5241 unknown GitHub issue or missing provider readback fails closed',()=>{
  for(const i of [null,{...issue,number:5240},{...issue,state:'other'},{...issue,updated_at:'bogus'}]){
    const x=summarizeOriginalNetlifyIncident({issue:i,githubHeadSha:sha,publishedSha:sha,manifestVerified:true});
    assert.equal(x.status,'UNVERIFIED');
    assert.equal(x.productionCurrent,false);
  }
  const x=summarizeOriginalNetlifyIncident({issue,githubHeadSha:sha,publishedSha:sha,manifestVerified:false});
  assert.equal(x.productionCurrent,false);
});
test('P0 #5241 original admin API and Powerhouse delivery portal display the same issue without a new incident store',()=>{
  const api=readFileSync(new URL('../netlify/functions/powerhouse-observability.mjs',import.meta.url),'utf8');
  const portal=readFileSync(new URL('../portal-v2/modules/powerhouse-observability.js',import.meta.url),'utf8');
  assert.match(api,/isPowerhouseAdmin\(user/);
  assert.match(api,/summarizeOriginalNetlifyIncident\(/);
  assert.match(api,/api\.github\.com\/repos\/arthurprinsen-ai\/Bedrijfsgeheugen\/issues\/5241/);
  assert.match(api,/originalReleaseIncident:/);
  assert.match(portal,/data-original-netlify-incident/);
  assert.match(portal,/data-evidence-status/);
  assert.match(portal,/issue\.productionCurrent/);
  assert.match(portal,/issue\.issueState==='OPEN'/);
  assert.match(portal,/href="https:\/\/github\.com\/arthurprinsen-ai\/Bedrijfsgeheugen\/issues\/5241"/);
  assert.doesNotMatch(api,/insert into.*incident/i);
});
