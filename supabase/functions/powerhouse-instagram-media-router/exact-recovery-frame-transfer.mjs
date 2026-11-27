// Temporary input-only transport for the exact 24 November original recovery.
// No storage, arbitrary URL, approval, claim or provider write is introduced.
import {miraFaceProofValid,MIRA_MASTER_REFERENCE_ID,MIRA_MASTER_REFERENCE_URL} from '../_shared/mira-canonical-face.mjs';
export const RECOVERY=Object.freeze({
 date:'2026-11-24',job:'b1ea15d9-7c9b-4667-8ac4-f9cc43147e4b',winner:'8ba73daa-dcde-46d8-b8b0-73d00f021fda',
 sourceHash:'69d8f1c71aa665e5c270128b2186b357a153a112fe5aee5400d3fd5a9350a789',
 history:'YIsid7ndXoQRyMBHsGvq',project:'rUF5anXD47gVokckYjf9',problem:'PH-P013',
 scene:'Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: bestelfrequentie daalt. Ze zoekt wie het oppakt.',
 url:'https://cdn.openart.ai/openart-ai/production/2026-11/create-video/WZvuT1BzGx566fWaFo8F/7c2612e6c43241c9b6483659a452d42f-metadata_hvshGrR7_2bb022a75eda_1795534889437_c5ea0c1a.mp4',
 masterSha:'e32863f391e01dba910bf396ad13eb23c4a74b53f2614f1563b0fc332b1dd4e2',
 rejection:'VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH:end:face=0.920:openart=YIsid7ndXoQRyMBHsGvq',
 frames:Object.freeze({start:'a41ffc48bd38ebf1243eece87045a73c795c6d14b284c3e74bf457f32fa3cf6a',middle:'5fa6b869cde5827a1e16817edbdb0d51d5f846f481c9c8aebce5cf7ced5bd032'})
});
const enc=new TextEncoder();
export function frameHash(position){return position==='start'||position==='middle'?RECOVERY.frames[position]:null}
export function eligibleRecoveryFrame({runDate,localDate,job,ob,winner,lineage,resolved,position,proof}={}){
 const a=RECOVERY,m=job?.asset_manifest||{},v=proof?.proof_lineage?.instagram_visual||{};
 const hash=frameHash(position);
 return Boolean(hash&&runDate===a.date&&localDate===a.date&&job?.id===a.job&&job?.tenant_id==='canonical'&&job?.channel==='instagram'&&job?.publication_date===a.date&&job?.post_type==='reel'&&job?.status==='WAITING_PROOF'&&job?.attempts===1&&job?.last_error===a.rejection&&job?.republish_forbidden===false&&m.rejected_openart_history_id===a.history&&m.openart_history_id===a.history&&m.rejected_asset_url===a.url&&m.openart_project_id===a.project&&m.openart_reference_id===MIRA_MASTER_REFERENCE_ID&&m.openart_reference_url===MIRA_MASTER_REFERENCE_URL&&m.recommendation_id===a.winner&&m.daily_winner_recommendation_id===a.winner&&m.automatic_generation_budget_exhausted!==true&&ob?.tenant_id==='canonical'&&ob?.channel==='instagram'&&ob?.publication_date===a.date&&ob?.status==='BLOCKED'&&ob?.last_error===a.rejection&&!ob?.external_id&&!ob?.live_proven_at&&ob?.evidence?.veto?.active!==true&&ob?.evidence?.mira_source_veto_active!==true&&ob?.evidence?.republish_forbidden!==true&&winner?.recommendation_id===a.winner&&lineage?.winner_recommendation_id===a.winner&&lineage?.state==='WINNER_FROZEN'&&lineage?.source_evidence?.source_hash===a.sourceHash&&resolved?.kind==='approved_frozen_library_mapping'&&resolved?.winner_recommendation_id===a.winner&&resolved?.problem?.id===a.problem&&resolved?.problem?.scene===a.scene&&proof?.fingerprint==='instagram-vision-proof:'+a.date+':'+hash&&proof?.publication_date===a.date&&proof?.provider==='openart'&&proof?.provider_status==='prepublish_verified'&&proof?.exact_media_sha256===hash&&proof?.proof_lineage?.verification_role==='video_frame'&&proof?.proof_lineage?.media_type==='video_frame'&&v.verified===true&&v.semantic_verified===true&&v.format_verified===true&&v.width===1080&&v.height===1920&&v.master_reference_sha256===a.masterSha&&miraFaceProofValid(v,'image'));
}
function payload(position,expires){return enc.encode('mira-input-only-v1|'+RECOVERY.date+'|'+RECOVERY.job+'|'+RECOVERY.winner+'|'+RECOVERY.history+'|'+frameHash(position)+'|'+expires)}
async function key(token,usage){return crypto.subtle.importKey('raw',enc.encode(token),{name:'HMAC',hash:'SHA-256'},false,[usage])}
export async function signRecoveryFrame(token,position,expires){
 if(!token||!frameHash(position)||!Number.isSafeInteger(expires))throw Error('INVALID_FRAME_CAPABILITY');
 const sig=await crypto.subtle.sign('HMAC',await key(token,'sign'),payload(position,expires));
 return Array.from(new Uint8Array(sig),x=>x.toString(16).padStart(2,'0')).join('');
}
export async function verifyRecoveryFrame(token,position,expires,signature,now=Math.floor(Date.now()/1000)){
 if(!token||!frameHash(position)||!Number.isSafeInteger(expires)||expires<=now||expires>now+600||!/^([0-9a-f]{64})$/.test(signature))return false;
 return crypto.subtle.verify('HMAC',await key(token,'verify'),Uint8Array.from(signature.match(/../g),x=>parseInt(x,16)),payload(position,expires));
}
