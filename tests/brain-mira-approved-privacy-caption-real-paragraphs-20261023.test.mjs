import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveMiraFrozenWinner,miraResolvedCaption,miraResolvedEvidence,validateResolvedMiraCaptionForDelivery} from '../supabase/functions/_shared/mira-frozen-winner-contract.mjs';

test('frozen 23 Oct privacy winner emits five actual NL caption paragraphs',()=>{
 const runDate='2026-10-23';
 const id='7880c326-72b8-4ac8-a712-971a9a24de12';
 const url='https://www.klacht.nl/klacht-nl/klacht/verwijdering-van-persoonlijke-gegevens-uit-klachten/';
 const hash='4ecd49bcc431b85a5cc16d3f9fc1cc7604e60cf912ca5b22f8ac72cdff1c9eee';
 const resolved=resolveMiraFrozenWinner(runDate,{
  winner:{recommendation_id:id},
  lineage:{run_date:runDate,winner_recommendation_id:id,state:'WINNER_FROZEN',source_evidence:{source_hash:hash,source_url:url}},
  recommendation:{recommendation_id:id,status:'accepted',evidence:{
   source_backed:true,source_url:url,source_title:'Verwijdering van persoonlijke gegevens uit klachten',
   forced_business_bridge_forbidden:true,office_problem_attribution_forbidden:true
  }},
  job:{asset_manifest:{daily_winner_recommendation_id:id}}
 });
 assert.equal(resolved.ok,true);
 assert.equal(resolved.kind,'approved_source_led');
 const caption=miraResolvedCaption(resolved);
 assert.equal(caption.split('\n\n').length,5,'Instagram must receive genuine paragraph breaks');
 assert.ok(!caption.includes('\\n'),'Literal slash-n characters are not publishable');
 assert.equal(validateResolvedMiraCaptionForDelivery(runDate,caption,miraResolvedEvidence(resolved)).ok,true);
 assert.equal(resolved.openart_history_id,'S2WRHcZAKIV5Cxn2tZLE');
});


test('25 Oct parking caption binds original source and asset; never privacy PH-P032',()=>{
 const date='2026-10-25',id='0a56f150-2954-4355-a3d0-fc65396f8152';
 const url='https://www.nu.nl/auto/6227593/steeds-meer-betaalapps-voor-het-parkeren-dit-zijn-de-verschillen.html';
 const input={
  winner:{recommendation_id:id},
  lineage:{run_date:date,winner_recommendation_id:id,state:'WINNER_FROZEN',source_evidence:{source_hash:'9d111ed60c5510e7fe41e8e9184c4055dd01363dd2ae78dc20c64845a1572665',source_url:url}},
  recommendation:{recommendation_id:id,status:'accepted',evidence:{source_backed:true,source_url:url,source_title:'Steeds meer betaalapps voor het parkeren: dit zijn de ...',forced_business_bridge_forbidden:true,office_problem_attribution_forbidden:true}},
  job:{asset_manifest:{daily_winner_recommendation_id:id}}
 };
 const x=resolveMiraFrozenWinner(date,input);
 assert.equal(x.ok,true);
 assert.equal(x.kind,'approved_source_led');
 assert.equal(x.openart_history_id,'qAUQW2ZzqdasS0ePb1PD');
 assert.match(x.title,/parkeerapps/);
 assert.match(miraResolvedCaption(x),/Een fictieve Mira-situatie/);
 assert.doesNotMatch(miraResolvedCaption(x),/persoonsgegevens|klachten|verzuim/i);
 assert.equal(miraResolvedCaption(x).split('\n\n').length,5);
 assert.equal(validateResolvedMiraCaptionForDelivery(date,miraResolvedCaption(x),miraResolvedEvidence(x)).ok,true);
 assert.equal(resolveMiraFrozenWinner(date,{...input,lineage:{...input.lineage,source_evidence:{...input.lineage.source_evidence,source_hash:'x'.repeat(64)}}}).code,'SOURCE_BACKED_MIRA_SCENE_ROUTE_REQUIRED');
 assert.equal(resolveMiraFrozenWinner(date,{...input,job:{asset_manifest:{daily_winner_recommendation_id:'different'}}}).code,'INSTAGRAM_FROZEN_WINNER_LINEAGE_CONFLICT');
});
