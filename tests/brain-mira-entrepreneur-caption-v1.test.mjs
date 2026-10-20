import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MIRA_CASES,MIRA_CANONICAL_LIBRARY_PATH,MIRA_ENTREPRENEUR_CAPTION_CONTRACT,selectMiraProblem,miraCaption,miraProductionEvidence,validateMiraCaptionForDelivery} from '../supabase/functions/_shared/mira-entrepreneur-caption.mjs';
const src=JSON.parse(readFileSync(MIRA_CANONICAL_LIBRARY_PATH,'utf8'));
const all=new Map(src.problems.map(p=>[p.problem_id,p]));
const orch=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
const publisher=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const router=readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
test('Mira draws every canonically defined problem from the sole PH-P catalog; never invents capabilities or action',()=>{
 assert.ok(MIRA_CASES.length>=35);
 assert.equal(new Set(MIRA_CASES.map(x=>x.id)).size,MIRA_CASES.length);
 for(const c of MIRA_CASES){const p=all.get(c.id);assert.ok(p,c.id);assert.equal(c.description,p.description);assert.ok(p.capabilities.includes(c.capability));assert.ok(p.actions.includes(c.action));assert.ok(p.outcomes.includes(c.metric));assert.ok(c.page&&c.scene&&c.signal);}
});
test('each Amsterdam local date deterministically receives one complete original caption',()=>{
 const date='2026-10-09',problem=selectMiraProblem(date),caption=miraCaption(problem),evidence=miraProductionEvidence(problem);
 assert.match(caption,/Wat hierachter zit:/);assert.match(caption,/Het gevolg kan/);assert.match(caption,/Bedrijfsgeheugen-portaal/);assert.match(caption,/voorgestelde actie/);assert.match(caption,/Wat je daarna volgt:/);assert.match(caption,/fictief AI-personage/);
 assert.equal(validateMiraCaptionForDelivery(date,caption,evidence).ok,true);
 assert.notEqual(selectMiraProblem('2026-10-10').id,problem.id);
 assert.match(caption, /\n\n/);
});
test('no caption, lost cause, wrong portal identity, wrong impact or wrong source is blocked before provider write',()=>{
 const date='2026-10-09',p=selectMiraProblem(date),c=miraCaption(p),e=miraProductionEvidence(p);
 for(const body of ['',c.split('\n\n').slice(0,2).join('\n\n'),c.replace('Bedrijfsgeheugen-portaal','een losse tool')])assert.equal(validateMiraCaptionForDelivery(date,body,e).ok,false);
 for(const mutation of [{canonical_problem_id:'PH-P999'},{portal_page:'fantasy-page'},{portal_capability:'Made Up Capability'},{portal_impact_label:'OBSERVED'},{source_catalog:'random-social-signal'}])assert.equal(validateMiraCaptionForDelivery(date,c,{...e,...mutation}).ok,false);
});
test('single existing writer and orchestrator enforce scene-caption-problem cohesion',()=>{
 assert.match(orch,/miraCaption\(miraBusinessProblem\)/);assert.match(orch,/MIRA_VISUAL_STORY_MISMATCH_REQUIRE_NEW_MATCHED_MEDIA/);
 assert.match(router,/MIRA_MEDIA_MUST_MATCH_CANONICAL_BUSINESS_PROBLEM_AND_SCENE/);assert.match(router,/mira_business_problem_id=miraBusinessProblem.id/);
 assert.match(publisher,/validateMiraCaptionForDelivery\(runDate,art.body/);assert.match(publisher,/MIRA_MEDIA_CAPTION_SCENE_MISMATCH/);
 assert.ok(publisher.indexOf('validateMiraCaptionForDelivery(runDate,art.body')<publisher.indexOf("await consumePublishCapability(db,capability,runDate,row.channel"));
 assert.doesNotMatch(orch,/publishInstagramViaComposio/);
});
