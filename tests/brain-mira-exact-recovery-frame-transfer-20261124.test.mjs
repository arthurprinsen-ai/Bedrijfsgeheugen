import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RECOVERY as a,frameHash,eligibleRecoveryFrame,signRecoveryFrame,verifyRecoveryFrame} from '../supabase/functions/powerhouse-instagram-media-router/exact-recovery-frame-transfer.mjs';
import {MIRA_MASTER_REFERENCE_ID as master,MIRA_MASTER_REFERENCE_URL as masterUrl} from '../supabase/functions/_shared/mira-canonical-face.mjs';
const hash=frameHash('start');
const fixture=()=>({runDate:a.date,localDate:a.date,position:'start',
 job:{id:a.job,tenant_id:'canonical',channel:'instagram',publication_date:a.date,post_type:'reel',status:'WAITING_PROOF',attempts:1,last_error:a.rejection,republish_forbidden:false,asset_manifest:{rejected_openart_history_id:a.history,openart_history_id:a.history,rejected_asset_url:a.url,openart_project_id:a.project,openart_reference_id:master,openart_reference_url:masterUrl,recommendation_id:a.winner,daily_winner_recommendation_id:a.winner}},
 ob:{tenant_id:'canonical',channel:'instagram',publication_date:a.date,status:'BLOCKED',last_error:a.rejection,evidence:{}},
 winner:{recommendation_id:a.winner},lineage:{winner_recommendation_id:a.winner,state:'WINNER_FROZEN',source_evidence:{source_hash:a.sourceHash}},
 resolved:{kind:'approved_frozen_library_mapping',winner_recommendation_id:a.winner,problem:{id:a.problem,scene:a.scene}},
 proof:{fingerprint:'instagram-vision-proof:'+a.date+':'+hash,publication_date:a.date,provider:'openart',provider_status:'prepublish_verified',identity_gate_result:'FAIL',exact_media_sha256:hash,proof_lineage:{verification_role:'video_frame',media_type:'video_frame',instagram_visual:{verified:true,semantic_verified:true,format_verified:true,width:1080,height:1920,master_reference_sha256:a.masterSha,canonical_reference_id:master,canonical_reference_url:masterUrl,face_identity_match:true,face_identity_confidence:.95,identity_comparison_method:'two_image_vision'}}}});
test('only exact current-day input candidate; never promotes final video',()=>{
 const f=fixture();assert.equal(eligibleRecoveryFrame(f),true);
 for(const mutate of [x=>x.localDate='2026-11-25',x=>x.position='end',x=>x.ob.external_id='published',x=>x.ob.evidence.veto={active:true},x=>x.job.attempts=2,x=>x.job.republish_forbidden=true,x=>x.job.asset_manifest.rejected_asset_url='https://example.org/a.mp4',x=>x.lineage.source_evidence.source_hash='wrong',x=>x.resolved.problem.scene='wrong',x=>x.proof.exact_media_sha256='wrong',x=>x.proof.proof_lineage.verification_role='static_image',x=>x.proof.proof_lineage.instagram_visual.face_identity_confidence=.92]){const g=fixture();mutate(g);assert.equal(eligibleRecoveryFrame(g),false)}
});
test('HMAC binds exact position and expiry; no forged or expired capability',async()=>{
 const token='test-secret-only',expires=1300,signature=await signRecoveryFrame(token,'start',expires);
 assert.equal(await verifyRecoveryFrame(token,'start',expires,signature,1000),true);
 for(const [t,p,e,s,n] of [['other','start',expires,signature,1000],[token,'middle',expires,signature,1000],[token,'end',expires,signature,1000],[token,'start',expires+1,signature,1000],[token,'start',expires,signature,1300],[token,'start',expires,signature,600]])assert.equal(await verifyRecoveryFrame(t,p,e,s,n),false);
});
test('router checks proof and SHA, provides no spend or publish authority',()=>{
 const s=readFileSync(new URL('../supabase/functions/powerhouse-instagram-media-router/index.ts',import.meta.url),'utf8');
 assert.ok(s.includes('verifyRecoveryFrame(token,position,expires,signature)'));
 assert.ok(s.includes('authorized_to_spend:false'));
 assert.ok(s.includes('if(await digest(bytes)!==hash)'));
 assert.ok(s.indexOf("if((frameRead||action==='issue_recovery_frame')")<s.indexOf("if(historical&&"));
 assert.ok(s.includes("if(input.action==='read_recovery_frame')"));
});
