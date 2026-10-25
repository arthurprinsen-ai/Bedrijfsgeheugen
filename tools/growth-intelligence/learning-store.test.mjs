import test from "node:test";
import assert from "node:assert/strict";
import {makeGrowthLearningEngine} from "./learning-store.mjs";
const memory=new Map();
const store={get:async k=>memory.get(k),put:async(k,v,{ifAbsent}={})=>{if(ifAbsent&&memory.has(k))return;memory.set(k,v)}};
test("records independently verified paid orders only",async()=>{
 const engine=makeGrowthLearningEngine(store);
 await assert.rejects(()=>engine.recordOutcome({actionId:"a",evidenceId:"e",result:"VERIFIED_PAID",amount:2900}),/PAYMENT/);
 const order={actionId:"a",evidenceId:"e",result:"VERIFIED_PAID",amount:2900,providerVerified:true,paymentReference:"pay_1"};
 assert.equal((await engine.recordOutcome(order)).status,"RECORDED");
 assert.equal((await engine.recordOutcome(order)).status,"DUPLICATE");
});
test("deduplicates learning events",async()=>{
 const engine=makeGrowthLearningEngine(store);
 assert.equal((await engine.updateLearning("cro","scan","LOSE","exp-1")).status,"RECORDED");
 assert.equal((await engine.updateLearning("cro","scan","LOSE","exp-1")).status,"DUPLICATE");
});
