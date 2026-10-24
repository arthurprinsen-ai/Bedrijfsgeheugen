// Canonical publication obligations remain the source of truth for LIVE_PROVEN
// organization-post identity. This bridge ONLY registers posts for measurement.
const URN=/^urn:li:(?:share|ugcPost):[0-9]{10,25}$/;
export const BRAND_SOCIAL_TENANT='bedrijfsgeheugen';

export function verifiedCompanyPost(row,now=new Date()){
  if(!row||row.tenant_id!=='canonical'||row.channel!=='linkedin_company'||row.status!=='LIVE_PROVEN')return null;
  const urn=String(row.external_id||'');
  const observed=Date.parse(row.live_proven_at||'');
  const published=Date.parse(row.published_at||'');
  if(!URN.test(urn)||!Number.isFinite(observed)||!Number.isFinite(published))return null;
  const current=now instanceof Date?now.getTime():Date.parse(now);
  if(!Number.isFinite(current)||observed>current+300000||published>current+300000)return null;
  if(current-published>35*86400000||published>observed+300000)return null;
  const day=String(row.publication_date||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return null;
  return {
    tenant_id:BRAND_SOCIAL_TENANT,
    post_id:'linkedin-company:'+urn,
    platform:'linkedin',external_post_id:urn,
    published_at:new Date(published).toISOString(),
    channel_name:'Bedrijfsgeheugen LinkedIn company',
    channel_kind:'linkedin_company',
    source_campaign_id:'publication:'+day+':linkedin_company',
    learning_status:'pending_measurement'
  };
}
export function verifiedCompanyPostBatch(rows=[],now=new Date(),max=30){
  if(!Array.isArray(rows))throw new TypeError('PUBLICATION_PROOF_ROWS_REQUIRED');
  const cap=Math.max(1,Math.min(30,Math.floor(Number(max)||30)));
  const unique=new Map();
  for(const row of rows){
    const post=verifiedCompanyPost(row,now);
    if(post&&!unique.has(post.external_post_id))unique.set(post.external_post_id,post);
  }
  return [...unique.values()].sort((a,b)=>a.published_at.localeCompare(b.published_at)).slice(-cap);
}
