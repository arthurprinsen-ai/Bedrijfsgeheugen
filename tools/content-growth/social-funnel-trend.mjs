// ONE BRAIN daily content learning: descriptive, age-aligned 48h social funnel scorecard.
// Reuses existing authorized provider snapshots and existing daily workflow (no extra scheduler).
// Insufficient observations never mean zero engagement or proven loss/growth.
const channels=['linkedin_personal','linkedin_company','instagram'];
const metrics=['impressions','reach','views','reactions','likes','comments','shares','saved','clicks'];
const qualifying=new Set(['OBSERVED','PROVIDER_OBSERVED']);
const numeric=x=>(typeof x==='number'&&Number.isFinite(x)&&x>=0)?x:null;
const timestamp=x=>{const n=Date.parse(String(x||''));return Number.isFinite(n)?n:null;};
const median=a=>{const sorted=[...a].sort((x,y)=>x-y),m=Math.floor(sorted.length/2);return sorted.length?sorted.length%2?sorted[m]:(sorted[m-1]+sorted[m])/2:null;};
export function socialChannel(row){
  if(row?.tenant_id==='canonical'&&row?.platform==='linkedin'&&row?.channel_kind==='linkedin_personal')return 'linkedin_personal';
  if(row?.tenant_id==='bedrijfsgeheugen'&&row?.platform==='linkedin'&&(!row?.channel_kind||row?.channel_kind==='linkedin_company'))return 'linkedin_company';
  if(row?.tenant_id==='bedrijfsgeheugen'&&row?.platform==='instagram')return 'instagram';
  return null; // Never mix unknown identities or separate tenants.
}
export function buildChannelTrends(rows=[],{now=new Date(),minSample=5}={}){
  const clock=now instanceof Date?now.getTime():Date.parse(now);
  if(!Number.isFinite(clock))throw new TypeError('INVALID_TREND_CLOCK');
  const support=Math.max(5,Math.floor(Number(minSample)||5)); // no underpowered winner claims
  const valid=Array.isArray(rows)?rows.slice(0,300):[];
  return channels.map(channel=>{
    const owned=valid.filter(row=>socialChannel(row)===channel);
    const recent=[],prior=[];
    let eligible=0;
    for(const row of owned){
      const published=timestamp(row.published_at), observed=timestamp(row.trend_observed_at);
      if(published===null||published>clock||clock-published<54*3600000)continue;
      eligible++;
      if(observed===null||observed>clock||observed-published<42*3600000||observed-published>54*3600000||
        !qualifying.has(row.trend_data_quality)||!row.trend_metrics||typeof row.trend_metrics!=='object')continue;
      const age=clock-published;
      if(age<7*86400000)recent.push(row.trend_metrics);
      else if(age<28*86400000)prior.push(row.trend_metrics);
    }
    const comparison={};
    for(const key of metrics){
      const a=recent.map(m=>numeric(m[key])).filter(n=>n!==null);
      const b=prior.map(m=>numeric(m[key])).filter(n=>n!==null);
      const sufficient=a.length>=support&&b.length>=support;
      const current=sufficient?median(a):null,baseline=sufficient?median(b):null;
      const direction=!sufficient?'INSUFFICIENT_COMPARABLE_SAMPLE':current>baseline?'RISING':current<baseline?'FALLING':'FLAT';
      comparison[key]={direction,median_recent_48h:current,median_baseline_48h:baseline,
        recent_samples:a.length,baseline_samples:b.length,
        relative_change_pct:sufficient&&baseline>0?Math.round((current/baseline-1)*10000)/100:null};
    }
    const measured=Object.values(comparison).filter(x=>x.direction!=='INSUFFICIENT_COMPARABLE_SAMPLE');
    return {channel,measurement:'48H_SINCE_PUBLICATION_PLUS_MINUS_6H',period:'7D_VS_PREVIOUS_21D',
      posts_registered:owned.length,mature_posts_28d:eligible,
      recent_aligned_snapshots:recent.length,baseline_aligned_snapshots:prior.length,
      trend_evidence_state:measured.length?'COMPARABLE_DESCRIPTIVE_METRICS':'INSUFFICIENT_COMPARABLE_48H_PROVIDER_EVIDENCE',
      metrics:comparison,commercial_outcome:'NOT_INFERRED_FROM_ENGAGEMENT',
      identity_scope:'OWNED_CHANNEL_ONLY',viewer_identity:'NOT_AVAILABLE_OR_NOT_PERMITTED'};
  });
}
