import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizePortalProjection, portalProjectionToState } from '../../platform/read-models/portal-server-state.mjs';

const ALL_CAPABILITY_STATE={
  portal:{
    profile:{employees:31,hourlyCost:73,maturity:{sturing:5}},
    dataAi:{maturity:4},
    aiScan:{hourlyRate:91},
    inputs:{companyName:'Parity BV'},
    metrics:{revenue:4321,nps:37},
    businessCase:{target:5},
    valueFinance:{multiple:6.2},
    people:{absence:3.4},
    market:{industry:'productie-parity-probe'},
    research:{filter:'productie-parity-probe'},
    compliance:{policies:['vastgesteld']},
    aiCapabilities:[4],
    strategy:{horizon:'6 maanden',dna:{ambitie:'productie-parity-probe'}},
    canvases:{bmc:{answer:'productie-parity-probe'}},
    finalConclusion:{text:'productie-parity-probe'},
    dueDiligence:{findings:[{area:'Parity',finding:'productie-parity-probe',evidence:'runtime',materiality:1,redFlag:false,owner:'test'}]},
    freshness:{what:'productie-parity-probe'},
    changes:{toTasks:{theme:'productie-parity-probe'}},
    advice:{modelFilter:'productie-parity-probe'},
    offer:{scope:'productie-parity-probe'},
    roadmap:{draft:{title:'productie-parity-probe'},items:[{id:'a1',title:'Borg kennis'}]}
  }
};

test('native Portal V2 full functional state survives server sanitization and readback exactly',()=>{
  const record=sanitizePortalProjection(ALL_CAPABILITY_STATE,{tenantId:'tenant:1',userId:'user:1',now:()=> '2026-09-09T09:45:00.000Z'});
  assert.deepEqual(record.data.portal,ALL_CAPABILITY_STATE.portal);
  const state=portalProjectionToState(record,{id:'user:1',email:'a@example.com'});
  assert.deepEqual(state.portal,ALL_CAPABILITY_STATE.portal);
});

test('server roundtrip retains every protected capability persistence slice used by V2',()=>{
  const record=sanitizePortalProjection(ALL_CAPABILITY_STATE,{tenantId:'tenant:1',userId:'user:1',now:()=> '2026-09-09T09:45:00.000Z'});
  const state=portalProjectionToState(record,{id:'user:1',email:'a@example.com'});
  const probes=[
    state.portal.profile.maturity.sturing,
    state.portal.profile.employees,
    state.portal.dataAi.maturity,
    state.portal.aiScan.hourlyRate,
    state.portal.inputs.companyName,
    state.portal.profile.hourlyCost,
    state.portal.businessCase.target,
    state.portal.metrics.nps,
    state.portal.valueFinance.multiple,
    state.portal.people.absence,
    state.portal.market.industry,
    state.portal.research.filter,
    state.portal.compliance.policies[0],
    state.portal.aiCapabilities[0],
    state.portal.strategy.horizon,
    state.portal.canvases.bmc.answer,
    state.portal.finalConclusion.text,
    state.portal.dueDiligence.findings[0].finding,
    state.portal.strategy.dna.ambitie,
    state.portal.freshness.what,
    state.portal.changes.toTasks.theme,
    state.portal.advice.modelFilter,
    state.portal.offer.scope,
    state.portal.roadmap.draft.title
  ];
  assert.equal(probes.length,24);
  assert.equal(probes.every(value=>value!==undefined&&value!==null),true);
});
