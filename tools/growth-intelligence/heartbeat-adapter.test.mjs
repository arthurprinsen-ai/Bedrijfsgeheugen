import test from "node:test";
import assert from "node:assert/strict";
import {ingestSignals,heartbeatGrowthTick} from "./heartbeat-adapter.mjs";
const now=1750000000000,signal={id:"abc",type:"scan_abandonment",observedAt:now,estimatedIncrementalMargin:2900,confidence:0.6,dataQuality:0.8,effortHours:4,risk:0.1};
test("ingest only independently verified and fresh metrics",()=>{
 const r=ingestSignals([{provider:"ga4",verified:true,evidenceId:"evt1",signal},{provider:"ga4",verified:false,evidenceId:"evt2",signal:{...signal,id:"bad"}}],{now});
 assert.equal(r.accepted.length,1);assert.equal(r.quarantined.length,1);
});
test("heartbeat tick proposes only; does not claim deployment or revenue",()=>{
 const r=heartbeatGrowthTick({cycleId:"day-1",events:[{provider:"ga4",verified:true,evidenceId:"evt1",signal}]},{now});
 assert.equal(r.actions.length,1);assert.equal(r.publishReady,false);assert.equal(r.revenueVerified,false);
});


import {createCustomerSignalCards} from "./heartbeat-adapter.mjs";
test("verified external signals yield scoped advice, not autonomous claims",()=>{
 const now=Date.UTC(2026,9,25);
 const events=[
  {provider:"search_console",verified:true,evidenceId:"provider-proof",signal:{id:"market-1",tenantId:"a",type:"search_opportunity",observedAt:now,relevanceExplanation:"Nieuwe relevante zoekvraag"}},
  {provider:"search_console",verified:true,evidenceId:"provider-proof",signal:{id:"market-2",tenantId:"b",type:"search_opportunity",observedAt:now}},
  {provider:"search_console",verified:false,evidenceId:"unproven",signal:{id:"market-3",tenantId:"a",type:"search_opportunity",observedAt:now}}
 ];
 const r=createCustomerSignalCards(events,{tenantId:"a",now});
 assert.equal(r.cards.length,1);
 assert.equal(r.cards[0].automatedActionAllowed,false);
 assert.equal(r.cards[0].sourceEvidence,"search_console:provider-proof");
 assert.deepEqual(r.rejected.map(x=>x.reason).sort(),["SOURCE_NOT_VERIFIED","TENANT_SCOPE_MISMATCH"]);
});
