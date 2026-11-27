import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {originalLinkedInSourceAngles,prepareOriginalLinkedInEditorialDecision} from '../supabase/functions/_shared/linkedin-editorial-strategy.mjs';
const source=readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
test('original runtime invokes shared selector after existing arbitration with explicit own tenant and exact obligation readback',()=>{
 assert.ok(source.indexOf('const editorialExperiment=arbitrateOriginalEditorialExperiment(')<source.indexOf('originalEditorialDecision=prepareOriginalLinkedInEditorialDecision('));
 assert.ok(source.includes(".eq('tenant_id',tenant).eq('platform','linkedin').eq('channel_kind',channel)"));
 assert.ok(source.includes(".eq('channel',channel).in('external_id',ids).not('live_proven_at','is',null)"));
 assert.ok(source.includes("original_editorial_strategy:originalEditorialBrief"));
 assert.ok(source.includes("receipt_state:originalEditorialBrief?'DRAFT_CONTEXT_ONLY':'NO_NEW_EDITORIAL_SELECTION'"));
 assert.ok(source.includes("draft_body_sha256:await digest(bodyText),learningApplied:false,authorizesPublication:false"));
});
test('existing source gates permit only compatible angles; no invented first-person story, no commercial cross-channel',()=>{
 assert.deepEqual(originalLinkedInSourceAngles({channel:'linkedin_personal',verified:false,builder:true}),[]);
 assert.deepEqual(originalLinkedInSourceAngles({channel:'linkedin_personal',verified:true,founderPerspective:true}),['thought_leadership','kennisdeling','opinie']);
 assert.deepEqual(originalLinkedInSourceAngles({channel:'linkedin_personal',verified:true,evidence:{personal_truth_verified:true}}),[]);
 assert.deepEqual(originalLinkedInSourceAngles({channel:'linkedin_company',verified:true}),['herkenning','educatie']);
 assert.deepEqual(originalLinkedInSourceAngles({channel:'instagram_company',verified:true}),[]);
});
test('active experiment defers new pillar/format and no source never confers publication',()=>{
 const source={channel:'linkedin_company',verified:true,sourceId:'id',sourceRevision:'rev',eligiblePillars:['educatie'],eligibleFormats:['tekstpost']};
 const input={channel:'linkedin_company',runDate:'2026-11-24',source,at:'2026-11-24T12:00:00Z'};
 assert.equal(prepareOriginalLinkedInEditorialDecision({...input,experimentOwner:'ORIGINAL_LINKEDIN_LOOP'}).selection.pillar,null);
 const draft=prepareOriginalLinkedInEditorialDecision({...input,experimentOwner:'NO_NEW_EXPERIMENT'});
 assert.equal(draft.selection.format,'tekstpost');assert.equal(draft.learningApplied,false);assert.equal(draft.authorizesPublication,false);
});
