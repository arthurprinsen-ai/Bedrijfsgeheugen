// Canonical publication obligations remain the source of truth for personal LinkedIn
// side-effect existence. Decision linkedin-personal-provider-ack-truth-v1: the provider
// create acknowledgement is authoritative for existence; independent public readback is
// optional (ACL-limited). This bridge ONLY registers posts for measurement: no views,
// no reach, no outcome claim. Measurement stays with the provider reaction readback.
const URN=/^urn:li:(?:share|ugcPost):([0-9]{10,25})$/;
export const PERSONAL_SOCIAL_TENANT='canonical';
const DAY=86400000;

export function verifiedPersonalPost(row,now=new Date()){
  if(!row||row.tenant_id!=='canonical'||row.channel!=='linkedin_personal')return null;
  if(row.status!=='PUBLISHED'&&row.status!=='LIVE_PROVEN')return null;
  const ev=row.evidence||{};
  // A bare URN is not proof: the provider create acknowledgement must be recorded.
  if(row.status==='PUBLISHED'&&ev.provider_publication_ack_verified!==true)return null;
  if(row.status==='LIVE_PROVEN'&&!Number.isFinite(Date.parse(row.live_proven_at||'')))return null;
  const m=URN.exec(String(row.external_id||''));
  if(!m)return null;
  const published=Date.parse(row.published_at||'');
  if(!Number.isFinite(published))return null;
  const current=now instanceof Date?now.getTime():Date.parse(now);
  if(!Number.isFinite(current)||published>current+300000||current-published>35*DAY)return null;
  const day=String(row.publication_date||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return null;
  return {
    tenant_id:PERSONAL_SOCIAL_TENANT,
    post_id:'linkedin-personal:'+m[1],
    platform:'linkedin',external_post_id:m[0],
    published_at:new Date(published).toISOString(),
    channel_name:'Arthur Prinsen LinkedIn personal',
    channel_kind:'linkedin_personal',
    source_campaign_id:'publication:'+day+':linkedin_personal',
    learning_status:'pending_measurement'
  };
}

export function verifiedPersonalPostBatch(rows=[],now=new Date(),max=30){
  if(!Array.isArray(rows))throw new TypeError('PUBLICATION_PROOF_ROWS_REQUIRED');
  const cap=Math.max(1,Math.min(30,Math.floor(Number(max)||30)));
  const unique=new Map();
  for(const row of rows){
    const post=verifiedPersonalPost(row,now);
    if(post&&!unique.has(post.external_post_id))unique.set(post.external_post_id,post);
  }
  return [...unique.values()].sort((a,b)=>a.published_at.localeCompare(b.published_at)).slice(-cap);
}
