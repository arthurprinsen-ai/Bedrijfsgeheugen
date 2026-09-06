import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePortalFlowState, hasVerifiedExecution, shouldRenderFlow } from '../portal-next/portal-flow-state.js';
test('geen bron betekent geen datastroom',()=>{const s=normalizePortalFlowState({source:null});assert.equal(shouldRenderFlow('source-to-datahub',s),false)});
test('geen module betekent wel brain-flow maar geen portaal-output',()=>{const s=normalizePortalFlowState({source:{id:'documenten',status:'running'},datahub:{status:'verified'},brain:{status:'running'},module:null});assert.equal(shouldRenderFlow('source-to-datahub',s),true);assert.equal(shouldRenderFlow('brain-to-module',s),false)});
test('completed zonder evidence is niet verified execution',()=>{const s=normalizePortalFlowState({powerhouse:[{id:'agent-1',status:'completed',evidence:[]}]});assert.equal(hasVerifiedExecution(s),false)});
test('paused/disabled met recovery obligation wordt blocked',()=>{const s=normalizePortalFlowState({powerhouse:[{id:'agent-1',status:'disabled',recoveryObligation:{open:true}}]});assert.equal(s.powerhouse[0].status,'blocked')});
