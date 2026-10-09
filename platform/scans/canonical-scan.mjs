export const SCAN_CONTRACT='powerhouse-canonical-scan-loop-v1';
const clean=(v,max=500)=>String(v??'').trim().slice(0,max);
const numberIn=(v,min,max)=>{const n=Number(v);return Number.isFinite(n)&&n>=min&&n<=max?n:null};
export function validSubmissionKey(v){return /^[A-Za-z0-9._:-]{12,180}$/.test(String(v||''));}
export function normalizeScanEnvelope(body={}){
  const input=body.scan&&typeof body.scan==='object'&&!Array.isArray(body.scan)?body.scan:{};
  const submissionKey=clean(body.submission_key||input.submission_key,180);
  if(!validSubmissionKey(submissionKey)) throw new Error('INVALID_SUBMISSION_KEY');
  const score=numberIn(input.score,0,100); if(score===null) throw new Error('INVALID_SCORE');
  const niveau=numberIn(input.niveau,1,5);
  const sourceDims=input.dimAvg&&typeof input.dimAvg==='object'?input.dimAvg:input.niveaus;
  const dimensions={};
  for(const [key,value] of Object.entries(sourceDims||{})){const n=numberIn(value,0,5);if(n!==null)dimensions[clean(key,80)]=n;}
  if(!Object.keys(dimensions).length) throw new Error('INVALID_DIMENSIONS');
  const canonical=clean(body.canonical||'https://www.bedrijfsgeheugen.nl/frisse-blik',1000);
  const allowed=['frisse-blik','scan','zelfscan'];
  const path=allowed.find(p=>canonical===`https://www.bedrijfsgeheugen.nl/${p}`||canonical.startsWith(`https://www.bedrijfsgeheugen.nl/${p}?`));
  if(!path)throw new Error('INVALID_CANONICAL');
  const kind=path==='zelfscan'?'bedrijfslek_scan':path==='scan'?'workshop_scan':'frisse_blik';
  return {submissionKey,score,niveau,dimensions,canonical,kind,tenantIdentityStatus:'unverified',companyKey:null};
}
export function buildRuntimeEvent(scan,scanId,at=new Date().toISOString()){
  return {dedupe_key:`scan:${scan.submissionKey}`,event_type:'scan_submitted',source:scan.kind==='bedrijfslek_scan'?'website.bedrijfslek':scan.kind==='workshop_scan'?'website.workshop_scan':'website.frisse_blik',channel:'website',topic_key:'digital_maturity',occurred_at:at,evidence:{scan_id:scanId,submission_key:scan.submissionKey,canonical:scan.canonical},context:{score:scan.score,niveau:scan.niveau,dimensions:scan.dimensions,tenant_identity_status:'unverified',learning_scope:'aggregate_only'},state:'observed',data_quality:'OBSERVED',confidence:0.9};
}
