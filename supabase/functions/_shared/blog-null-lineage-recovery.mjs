// Pure, testable CAS guard for canonical blog metadata only.
// Does not publish, change sender authority, or provide LIVE_PROVEN.
const clean=(v)=>String(v??'').trim();
export function canRebindUnsentBlog(record,evidence={}) {
  if(!record || clean(record.status)!=='GENERATED') return false;
  if(clean(record.external_id)||record.published_at||record.live_proven_at) return false;
  for(const key of ['provider_create_success','republish_forbidden','possible_provider_side_effect','provider_publication_ack_verified','provider_truth_verified']){
    if(evidence?.[key]===true) return false;
  }
  return true;
}
export function originalBlogSlugGuard(query,originalSlug) {
  if(originalSlug===null||originalSlug===undefined) return query.is('slug',null);
  return query.eq('slug',originalSlug);
}
