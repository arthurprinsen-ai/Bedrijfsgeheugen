import test from 'node:test';
import assert from 'node:assert/strict';
import {renderConnectorBuilder} from '../portal-next/connector-builder-view.js';

const impact={contract:'powerhouse-cross-domain-change-v1',status:'REVIEW_REQUIRED',changed:true,
 affectedDomains:['privacy','security','supplier_risk','finance','sustainability','csrd_esrs_scope'],
 esrsReview:[{standard:'ESRS_E1',reviewRequired:true}]};
const draft={id:'connector-a',name:'Documenten',templateId:'blank',state:'Draft',runtime:{changeImpact:impact}};
const passingEvidence={configVersion:1,testExecutionId:'x',sourceReadSuccess:true,extractionResult:{ok:true},validationResult:{ok:true},targetSafeTestResult:{ok:true}};
test('an open ESRS review does not bypass missing technical evidence',()=>{
 const html=renderConnectorBuilder({draft,stage:9,testResult:{status:'TEST_PASSED',evidence:{testExecutionId:'x'}}});
 assert.match(html,/Herbeoordeling open/);
 assert.match(html,/data-activate disabled/);
 assert.match(html,/CSRD\/ESRS/);
});
test('technically verified connector may request activation while CSRD review remains explicitly pending',()=>{
 const html=renderConnectorBuilder({draft,stage:9,testResult:{status:'TEST_PASSED',evidence:passingEvidence}});
 assert.match(html,/Technische activatie mogelijk/);
 assert.doesNotMatch(html,/data-activate disabled/);
 assert.match(html,/CSRD\/ESRS-beoordeling blijft open/);
 assert.match(html,/privacy- en datalocatieregels controleren/);
 assert.match(html,/technisch actief betekent niet juridisch goedgekeurd/);
});
test('monitor shows the correct tenant connector review and known ESRS scope candidates without leaking audit metadata',()=>{
 const reviews=[
  {reviewKind:'CROSS_DOMAIN_CHANGE',id:'impact:connector-a:private-identifier',connectorId:'connector-a',status:'pending',actor:'secret-admin',affectedDomains:impact.affectedDomains,esrsReview:impact.esrsReview},
  {reviewKind:'CROSS_DOMAIN_CHANGE',id:'impact:connector-b:secret',connectorId:'connector-b',status:'pending',affectedDomains:['privacy'],esrsReview:[{standard:'ESRS_G1'}]},
  {connector_id:'connector-a',status:'pending',id:'uuid-review-a'}
 ];
 const html=renderConnectorBuilder({draft,stage:10,reviewQueue:reviews});
 assert.match(html,/2 open reviews/);
 assert.match(html,/Herbeoordeling koppeling vereist/);
 assert.match(html,/ESRS_E1/);
 assert.match(html,/CSRD \/ ESRS/);
 assert.match(html,/nog geen wettelijke CSRD-plicht/);
 assert.doesNotMatch(html,/ESRS_G1|secret-admin|private-identifier|uuid-review-a/);
});
test('untrusted review labels and extra sensitive data are not reflected in customer UI',()=>{
 const source={...draft,runtime:{changeImpact:impact}};
 const html=renderConnectorBuilder({draft:source,stage:10,reviewQueue:[{reviewKind:'CROSS_DOMAIN_CHANGE',connectorId:'connector-a',status:'pending',affectedDomains:['<SCRIPT>alert(1)</SCRIPT>','privacy'],esrsReview:[{standard:'<img src=x onerror=alert(1)>'}]}]});
 assert.match(html,/Privacy/);
 for(const forbidden of ['<script>','<img','onerror','alert(1)']) assert.equal(html.toLowerCase().includes(forbidden),false,forbidden);
});
test('legacy connector without a review remains subject to existing test-evidence guard',()=>{
 const html=renderConnectorBuilder({draft:{...draft,runtime:{}},stage:9,testResult:null});
 assert.match(html,/Testbewijs vereist/);
 assert.match(html,/data-activate disabled/);
});
