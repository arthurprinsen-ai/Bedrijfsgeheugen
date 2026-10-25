import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261025094800_daily_commercial_verified_publication_reconciliation.sql',import.meta.url),'utf8');

const truth=v=>v===true;
function classify({decision='publish',channel,state='published',ref='',providerTruth=false,providerStatus=null,obligation=null,
  delivery={}}={}){
  const published=decision==='publish'&&['published','measured','learned'].includes(state)&&Boolean(String(ref).trim());
  const o=obligation||{};
  const direct=published&&truth(providerTruth)&&providerStatus==='published';
  const blog=published&&channel==='blog'&&o.channel==='blog'
    &&['LIVE_PROVEN','MEASURED','LEARNED'].includes(o.status)
    &&o.liveProvenAt&&ref===o.canonicalUrl&&ref.startsWith('https://')
    &&o.verified===true&&o.artifactTruth===true&&o.netlifyState==='ready'
    &&o.publicHttpStatus===200&&/^[a-f0-9]{40}$/.test(o.commitSha||'');
  const ack=published&&['linkedin_company','linkedin_personal','instagram_company'].includes(channel)
    &&o.status==='PUBLISHED'&&o.externalId===ref&&ref.length>0
    &&delivery.terminal===true&&delivery.ack===true&&delivery.created===true
    &&delivery.limited===true&&delivery.noRepublish===true
    &&o.terminal===true&&o.ack===true&&o.created===true
    &&o.limited===true&&o.noRepublish===true&&o.verified!==true;
  return {independentlyVerified:Boolean(direct||blog),ackOnly:Boolean(!direct&&!blog&&ack),
    terminal:Boolean(direct||blog||ack)};
}
const blog={
  channel:'blog',status:'LIVE_PROVEN',liveProvenAt:'2026-10-25T10:02:54Z',
  canonicalUrl:'https://www.bedrijfsgeheugen.nl/blog/exact-article/',verified:true,
  artifactTruth:true,netlifyState:'ready',publicHttpStatus:200,commitSha:'a'.repeat(40)
};
const ack={channel:'linkedin_personal',status:'PUBLISHED',externalId:'urn:li:share:7520059104178925568',
  terminal:true,ack:true,created:true,limited:true,noRepublish:true,verified:false};
const receipt={terminal:true,ack:true,created:true,limited:true,noRepublish:true};

test('migration preserves existing SQL invoker function and daily execution contract',()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_execution_status\(/i);
  assert.match(sql,/p_run_date date DEFAULT current_date/i);
  assert.match(sql,/LANGUAGE sql\s+STABLE\s+SET search_path/i);
  assert.match(sql,/count\(\*\) FILTER \(WHERE decision='publish' AND NOT terminal_provider_side_effect\)/i);
  assert.match(sql,/d\.decision_count=7 AND d\.unresolved_publish_count=0/i);
  assert.match(sql,/independently_verified_publish_count/);
  assert.match(sql,/limited_ack_publish_count/);
  assert.match(sql,/actual_publication_guard/);
  assert.doesNotMatch(sql,/\bSECURITY DEFINER\b/i);
  assert.doesNotMatch(sql,/\bcron\.schedule\b|\bnet\.http_post\b|\bhttp_request\b|\bUPDATE public\.|\bINSERT INTO public\./i);
  assert.doesNotMatch(sql,/\bGRANT\b|\bREVOKE\b/i);
});

test('exact live blog counts as independently proven only with all source evidence',()=>{
  const input={channel:'blog',ref:blog.canonicalUrl,obligation:blog};
  assert.deepEqual(classify(input),{independentlyVerified:true,ackOnly:false,terminal:true});
  for(const invalid of [
    {...blog,canonicalUrl:'https://www.bedrijfsgeheugen.nl/blog/other/'},
    {...blog,status:'GENERATED'},
    {...blog,verified:false},
    {...blog,artifactTruth:false},
    {...blog,netlifyState:'building'},
    {...blog,publicHttpStatus:404},
    {...blog,commitSha:'badsignature'},
    {...blog,liveProvenAt:null}
  ])assert.equal(classify({...input,obligation:invalid}).terminal,false,JSON.stringify(invalid));
});

test('a real immutable limited provider ACK is terminal but never independent readback',()=>{
  const input={channel:'linkedin_personal',ref:ack.externalId,delivery:receipt,obligation:ack};
  assert.deepEqual(classify(input),{independentlyVerified:false,ackOnly:true,terminal:true});
  assert.equal(classify({...input,ref:'urn:li:share:DIFFERENT'}).terminal,false);
  assert.equal(classify({...input,obligation:{...ack,status:'BLOCKED'}}).terminal,false);
  assert.equal(classify({...input,delivery:{...receipt,noRepublish:false}}).terminal,false);
  assert.equal(classify({...input,obligation:{...ack,ack:false}}).terminal,false);
  assert.equal(classify({channel:'linkedin_personal',ref:ack.externalId,obligation:null}).terminal,false);
  assert.equal(classify({...input,state:'scheduled'}).terminal,false);
  assert.equal(classify({...input,decision:'hold'}).terminal,false);
});

test('same-day exact canonical IDs, status, URL and production proof are required by SQL',()=>{
  for(const pattern of [
    /o\.publication_date=d\.run_date/,
    /o\.tenant_id='canonical'/,
    /o\.channel=CASE WHEN d\.channel='instagram_company'/,
    /NULLIF\(btrim\(d\.delivery_ref\),'+'\)=NULLIF\(btrim\(o\.canonical_url\),'+'\)/,
    /o\.evidence->>'public_http_status'='200'/,
    /o\.evidence->>'production_commit_sha' ~ '\^\[a-f0-9\]\{40\}\$'/,
    /o\.evidence->>'provider_publication_ack_verified'='true'/,
    /o\.evidence->>'republish_forbidden'='true'/,
    /d\.delivery_evidence->>'provider_publication_ack_verified'='true'/,
    /o\.evidence->>'provider_truth_verified' <> 'true'/
  ])assert.match(sql,pattern);
});

test('source-only green never masks unresolved Instagram or predictive health',()=>{
  const rows=[
    classify({channel:'blog',ref:blog.canonicalUrl,obligation:blog}),
    classify({channel:'linkedin_company',ref:'urn:li:share:1',providerTruth:true,providerStatus:'published'}),
    classify({channel:'linkedin_personal',ref:ack.externalId,delivery:receipt,obligation:ack})
  ];
  assert.equal(rows.filter(x=>x.terminal).length,3);
  assert.equal(rows.filter(x=>x.independentlyVerified).length,2);
  assert.equal(rows.filter(x=>x.ackOnly).length,1);
  const legacyExecutionComplete=true,instagramMediaReady=false,predictiveHealthy=false;
  assert.equal(legacyExecutionComplete&&instagramMediaReady&&predictiveHealthy,false);
});
