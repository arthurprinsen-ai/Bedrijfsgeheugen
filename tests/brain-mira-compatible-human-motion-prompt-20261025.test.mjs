import test from 'node:test';
import assert from 'node:assert/strict';
import {planMiraPreventiveRecovery} from '../supabase/functions/_shared/mira-preventive-quality-recovery.mjs';
const resolved={kind:'approved_source_led',winner_recommendation_id:'0a56f150-2954-4355-a3d0-fc65396f8152',scene:'Dutch office real motion',openart_history_id:'qAUQW2ZzqdasS0ePb1PD'};
const job={status:'WAITING_PROOF',republish_forbidden:false,asset_manifest:{openart_project_id:'rUF5anXD47gVokckYjf9',openart_history_id:'qAUQW2ZzqdasS0ePb1PD',openart_reference_id:'Yjqu4D7v76HABNPmQPj1',recommendation_id:resolved.winner_recommendation_id}};
const ob={status:'BLOCKED',external_id:null,live_proven_at:null,evidence:{}};
test('human-motion corrective prompt must request natural continuous movement and preserve strict gate',()=>{
 const p=planMiraPreventiveRecovery({runDate:'2026-10-25',resolved,job:{...job,last_error:'MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED:confidence=0.890:openart=a6sdR46HDe58uRlardNl'},ob});
 assert.equal(p.eligible,true);
 assert.match(p.producer_instructions,/human head, hand, blink/i);
 assert.equal(p.never_lower_thresholds,true);
 assert.equal(p.meta_create_allowed_before_exact_media_pass,false);
 assert.equal(p.independent_temporal_proof_required,true);
});
