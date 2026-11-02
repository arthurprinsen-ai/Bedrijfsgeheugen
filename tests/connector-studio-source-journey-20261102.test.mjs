import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourceExperienceState,sourceExperienceSummary} from '../portal-v2/connected-data-sources.js';
import {CONNECTOR_PORTAL_PAGES,connectorPortalSources} from '../assets/js/koppelingen/portal-routing.js';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('configuration or forged proof never claims numeric business values',()=>{
 for(const state of ['Active','Paused','Draft','Invalid']){
  const output=sourceExperienceState({state,dataStatus:'LIVE_RECORDS_VERIFIED',lastAmount:999999,token:'secret'});
  assert.equal(output.hasVerifiedValues,false);
  assert.match(output.evidenceLabel,/niet gecontroleerd/);
  assert.doesNotMatch(JSON.stringify(output),/999999|secret/);
 }
 const summary=sourceExperienceSummary([{state:'Active'},{state:'Draft'}]);
 assert.equal(summary.configured,2);
 assert.equal(summary.activeConfiguration,1);
 assert.equal(summary.liveRecordsVerified,0);
});

test('tenant metadata does not pretend actual data is available',()=>{
 const row={id:'a',name:'Voorbeeld',state:'Active',source:{type:'crm'},dataUse:{mode:'PORTAL_INSIGHTS'},routing:{portalPages:['sales-intelligence'],selectedFields:['orders']}};
 const payload=connectorPortalSources([row],'sales-intelligence');
 assert.equal(payload[0].dataStatus,'LIVE_RECORDS_NOT_VERIFIED');
 assert.equal(sourceExperienceState(payload[0]).hasVerifiedValues,false);
 assert.equal(CONNECTOR_PORTAL_PAGES.some(page=>page.id==='sales-intelligence'),true);
});

test('source cards never use untrusted innerHTML and page routing stays allowlisted',()=>{
 const source=read('portal-v2/connected-data-sources.js');
 assert.match(source,/\.textContent/);
 assert.doesNotMatch(source,/\.innerHTML\s*=/);
 assert.match(source,/CONNECTOR_METADATA_ONLY_NO_LIVE_DATA/);
 assert.match(source,/credentials:'same-origin'/);
 assert.match(source,/cache:'no-store'/);
 assert.match(source,/allowed\.has\(pageId\)/);
 assert.match(source,/aria-label/);
 assert.match(source,/sourceExperienceState/);
 assert.match(source,/data-open-page/);
 const css=read('portal-v2/connected-data-sources.css');
 assert.match(css,/@media\(max-width:360px\)/);
 assert.match(css, /prefers-reduced-motion:reduce/);
 assert.match(css,/focus-visible/);
 assert.match(read('assets/js/koppelingen/view.js'),/data-bg-journey-readout/);
 assert.match(read('portal-v2/index.html'),/connected-data-sources\.css/);
});
