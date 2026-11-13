import {isSourceQualifiedSocialSnapshot} from './social-learning-window-ack.mjs';

/** A priority hint must satisfy the SAME tenant, post and provider identity
 * that the ORIGINAL downstream BRAIN measurement ACK requires.
 * A timed numeric observation from a different provider post is not evidence.
 * Neither this module nor its caller writes metrics or creates a scheduler. */
export function originalBoundWindowSnapshot(post,snapshot){
  const tenant=String(post?.tenantId??post?.tenant_id??'').trim();
  const postId=String(post?.postId??post?.post_id??'').trim();
  const providerId=String(post?.externalPostId??post?.external_post_id??'').trim();
  const event=String(snapshot?.source_event_id??snapshot?.sourceEventId??'');
  const source=String(snapshot?.source??'').trim();
  if(!tenant||!postId||!providerId||!event||!source)return false;
  if(String(snapshot?.tenant_id??snapshot?.tenantId??'')!==tenant||
     String(snapshot?.post_id??snapshot?.postId??'')!==postId)return false;
  // Exact event-bound provider identity, not ambiguous substring matching.
  if(!event.includes(':'+providerId+':'))return false;
  return isSourceQualifiedSocialSnapshot(snapshot,providerId);
}

/** Deterministic source-time windows; never widen the hard ±6h contract.
 * This only schedules the EXISTING hourly reader's bounded fair selection.
 * Final learning and original consumer ACK require their own source proof. */
export function tagDuePostsWithObservedWindows(due=[],snapshots=[],{toleranceHours=6}={}){
  const requested=Number(toleranceHours);
  const tolerance=Number.isFinite(requested)&&requested>=0?
    Math.min(6,requested):6;
  const byId=new Map();
  for(const s of snapshots){
    if(!s||!s.post_id||!['OBSERVED','PROVIDER_OBSERVED','PROVIDER_OBSERVED_LINKED'].includes(String(s.data_quality)))continue;
    const observed=Date.parse(s.observed_at||'');
    if(!Number.isFinite(observed))continue;
    const arr=byId.get(s.post_id)||[];arr.push({observed,s});byId.set(s.post_id,arr);
  }
  return due.map(p=>{
    const published=Date.parse(p.publishedAt||'');
    const window=Number(p.dueWindow||p.windowHours);
    const target=published+window*3600000;
    const match=Number.isFinite(published)&&[24,48,72].includes(window)&&
      (byId.get(p.postId)||[]).some(({observed,s})=>
        originalBoundWindowSnapshot(p,s)&&Math.abs(observed-target)<=tolerance*3600000);
    return {...p,hasWindowSnapshot:match};
  });
}
