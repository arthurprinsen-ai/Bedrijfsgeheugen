import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildMiraEntrepreneurCaption,miraProblemIdFromSource,MIRA_PORTAL_PROBLEMS} from '../supabase/functions/_shared/instagram-entrepreneur-story-v1.mjs';

test('each approved catalog problem has distinct scene, cause, consequence, portal action and measurement',()=>{
 assert.ok(Object.keys(MIRA_PORTAL_PROBLEMS).length>=10);
 for(const [id,problem] of Object.entries(MIRA_PORTAL_PROBLEMS)){
  for(const k of ['scene','cause','effect','portal','action','metric','pointe']) assert.ok(problem[k]?.length>20,id+':'+k);
  const result=buildMiraEntrepreneurCaption({topic_key:'',evidence:{portal_problem_id:id,audience:'ondernemers',source_backed:true}});
  assert.equal(result.problem_id,id);
  assert.match(result.caption,/Het probleem ontstaat omdat/);
  assert.match(result.caption,/Daardoor/);
  assert.match(result.caption,/In het Bedrijfsgeheugen-portaal/);
  assert.match(result.caption,/volgende stap/);
  assert.match(result.caption,/controleren/);
  assert.match(result.caption,/Mira is een fictief AI-personage/);
  assert.match(result.caption,/geen echte klantcase/);
 }
});
test('reject unsupported and conflicting problem mappings; no invented clients',()=>{
 assert.equal(miraProblemIdFromSource({topic_key:'excel-chaos',evidence:{portal_problem_id:'PH-P002'}}),null);
 assert.throws(()=>buildMiraEntrepreneurCaption({evidence:{portal_problem_id:'PH-P999',audience:'ondernemers',source_backed:true}}),/STORED_ENTREPRENEUR/);
 assert.throws(()=>buildMiraEntrepreneurCaption({evidence:{portal_problem_id:'PH-P002',audience:'consument',source_backed:true}}),/ENTREPRENEUR_SOURCE/);
});
test('mira radar is entrepreneur-first and does not fall back to random consumer complaints',()=>{
 const radar=readFileSync('supabase/functions/powerhouse-mira-problem-radar/index.ts','utf8');
 assert.match(radar,/Nederland ondernemers/);
 assert.match(radar,/portal_problem_id/);
 assert.match(radar,/audience:'ondernemers'/);
 assert.doesNotMatch(radar,/Nederland klacht irritant app account wachtwoord/);
});
test('the canonical orchestrator requires mapped source and caption as actual Instagram body',()=>{
 const orchestrator=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
 assert.match(orchestrator,/buildMiraEntrepreneurCaption/);
 assert.match(orchestrator,/MIRA_ENTREPRENEUR_CAPTION/);
 assert.match(orchestrator,/mira_portal_story/);
 assert.doesNotMatch(orchestrator,/Schrijf Mira daily-life caption passend bij de reeds bewezen finale media. Geen interne kantoorproblemen of geforceerde businessmoraal/);
});
test('frozen winners remain immutable; source-backed candidates require portal ID and no bridge ban',()=>{
 const sql=readFileSync('supabase/migrations/20261009150500_mira_entrepreneur_portal_caption_v1.sql','utf8');
 assert.match(sql,/WINNER_ALREADY_FROZEN/);
 assert.match(sql,/portal_problem_id/);
 assert.match(sql,/audience/);
 assert.match(sql,/forced_business_bridge_forbidden',false/);
 assert.doesNotMatch(sql,/office_problem_attribution_forbidden',true/);
});

test('all scripted entrepreneurs problems are grounded in the existing 40-problem library',()=>{
 const catalog=JSON.parse(readFileSync('config/powerhouse-problem-library.json','utf8'));
 const byId=new Map(catalog.problems.map(x=>[x.problem_id,x]));
 for(const [id,problem] of Object.entries(MIRA_PORTAL_PROBLEMS)){
  const existing=byId.get(id);
  assert.ok(existing,'missing canonical catalog problem '+id);
  assert.equal(problem.name,existing.name,'drift in canonical catalog title '+id);
  assert.ok(existing.actions?.length>0,id+' missing existing actions');
 }
});
test('publisher passes exact caption evidence and reviewer protects structured captions',()=>{
 const publisher=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
 const reviewer=readFileSync('supabase/functions/bg-pre-publish-review/index.ts','utf8');
 const router=readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
 assert.match(publisher,/mira_portal_story: art.generation_evidence\?\.mira_portal_story/);
 assert.match(reviewer,/MIRA_ENTREPRENEUR_CAPTION_INCOMPLETE/);
 assert.match(reviewer,/MIRA_STORED_PROBLEM_SOURCE_REQUIRED/);
 assert.match(router,/editorialProblem/);
 assert.match(router,/frozenWinner/);
 assert.match(router,/MIRA_CREATIVE_PROBLEM_MISMATCH/);
});
