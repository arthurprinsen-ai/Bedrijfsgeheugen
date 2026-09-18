import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FINGERPRINT='powerhouse-security-operations-closure-v1';
const REQUIRED_IAM_PROVIDERS=['GitHub','Netlify','Notion','Buffer'];
const PRESENT=v=>v!==undefined&&v!==null&&v!=='';

export function assertIsolatedRestoreTarget({targetEnvironment='',productionProjectRef=''}){
  const target=String(targetEnvironment).toLowerCase();
  const prod=String(productionProjectRef).toLowerCase();
  const unsafe=target==='production'||target==='prod'||target.includes('production')||(prod&&target.includes(prod));
  if(unsafe) throw new Error('DR restore target must be an isolated non-production environment');
  return true;
}

export function validateOwnerMfa(mfa={}){
  const obligations=[];
  if(mfa.mfa_enabled!==true) obligations.push('Owner MFA: authoritative management-plane readback must show mfa_enabled=true');
  if(!PRESENT(mfa.evidence)) obligations.push('Owner MFA: evidence reference is required');
  if(mfa.mfa_enabled===true&&!PRESENT(mfa.verified_at)) obligations.push('Owner MFA: verified_at is required');
  return {ok:obligations.length===0,gaps:[],obligations};
}

export function validateDrProof(dr={}){
  const obligations=[];
  if(dr.isolated_target!==true||dr.production_target===true) obligations.push('DR: restore must run in an isolated non-production target');
  if(dr.restore_completed!==true) obligations.push('DR: successful restore completion proof is required');
  if(dr.application_smoke!==true) obligations.push('DR: application smoke/readback after restore is required');
  if(dr.data_integrity!==true) obligations.push('DR: restored data integrity/fingerprint proof is required');
  if(!Number.isFinite(dr.rto_seconds)||dr.rto_seconds<0) obligations.push('DR: measured RTO is required');
  if(!Number.isFinite(dr.rpo_seconds)||dr.rpo_seconds<0) obligations.push('DR: measured RPO is required');
  if(!PRESENT(dr.evidence)) obligations.push('DR: run evidence is required');
  if(obligations.length===0&&!PRESENT(dr.verified_at)) obligations.push('DR: verified_at is required');
  return {ok:obligations.length===0,gaps:[],obligations};
}

export function validateCredentialRotations(rotations=[]){
  const obligations=[];
  if(!Array.isArray(rotations)||rotations.length===0) obligations.push('Credential rotation: inventory contains no credentials');
  for(const [i,c] of (rotations||[]).entries()){
    const id=c?.credential_id||`credential[${i}]`;
    if(c?.rotated!==true) obligations.push(`${id}: rotation not proven`);
    if(c?.consumer_reconnected!==true) obligations.push(`${id}: consumer reconnect not proven`);
    if(c?.old_credential_rejected!==true) obligations.push(`${id}: old credential rejection not proven`);
    if(c?.runtime_healthy!==true) obligations.push(`${id}: runtime health after rotation not proven`);
    if(c?.rollback_proven!==true) obligations.push(`${id}: rollback/readback not proven`);
    if(!PRESENT(c?.evidence)) obligations.push(`${id}: evidence reference missing`);
  }
  return {ok:obligations.length===0,gaps:[],obligations};
}

export function validateIamReview(review={}){
  const obligations=[]; const providers=Array.isArray(review.providers)?review.providers:[];
  for(const required of REQUIRED_IAM_PROVIDERS) if(!providers.some(p=>p?.provider===required)) obligations.push(`${required}: IAM inventory missing`);
  for(const [i,p] of providers.entries()){
    const id=p?.provider||`provider[${i}]`;
    if(p?.inventory_complete!==true) obligations.push(`${id}: IAM inventory incomplete`);
    if(p?.access_levels_reviewed!==true) obligations.push(`${id}: access levels not reviewed`);
    if(p?.service_accounts_reviewed!==true) obligations.push(`${id}: service accounts not reviewed`);
    if(p?.unused_access_reviewed!==true) obligations.push(`${id}: unused accounts/tokens not reviewed`);
    if(!['verified','manual_attested'].includes(p?.mfa_status)) obligations.push(`${id}: MFA status requires verified provider readback or manual attestation`);
    if(p?.least_privilege!==true) obligations.push(`${id}: least privilege not proven`);
    if(!PRESENT(p?.evidence)) obligations.push(`${id}: IAM evidence reference missing`);
  }
  if(!PRESENT(review.reviewed_at)) obligations.push('IAM: reviewed_at is required');
  if(!PRESENT(review.next_review_at)) obligations.push('IAM: next_review_at is required');
  return {ok:obligations.length===0,gaps:[],obligations};
}

export function validateEngineeringGates(gates={}){
  const gaps=[]; const obligations=[];
  const pool=gates.auth_db_pool||{};
  if(pool.classification!=='engineering_gate'||pool.current_mode!=='fixed'||pool.current_value!==10||pool.scale_change_blocked_until_percentage_test!==true) gaps.push('Auth DB pool gate must preserve fixed=10 as current state and block scale changes until percentage-based testing');
  for(const needed of ['load-test','connection-saturation','rollback']) if(!(pool.evidence_required||[]).includes(needed)) gaps.push(`Auth DB pool gate missing required evidence: ${needed}`);
  const indexes=gates.unused_indexes||{};
  if(indexes.classification!=='engineering_gate'||indexes.zero_scans_not_sufficient!==true) gaps.push('Unused-index gate must state that zero scans alone are insufficient');
  for(const needed of ['representative-workload','query-plan-before-after','rollback-plan']) if(!(indexes.drop_requires||[]).includes(needed)) gaps.push(`Unused-index gate missing required evidence: ${needed}`);
  return {ok:gaps.length===0,gaps,obligations};
}

function validateDatabaseHardening(db={}){
  const gaps=[];
  if(db.status!=='LIVE & BEWEZEN') gaps.push('Database hardening must retain LIVE & BEWEZEN status');
  const expected={tables:121,deny_all:103,policy_tables:18,policy_required_missing:0,rls_disabled:0};
  for(const [k,v] of Object.entries(expected)) if(db[k]!==v) gaps.push(`Database hardening invariant mismatch: ${k} expected ${v}`);
  return {ok:gaps.length===0,gaps,obligations:[]};
}

export function buildSecurityOperationsReport(input={}){
  const checks={
    database_hardening:validateDatabaseHardening(input.database_hardening),
    owner_mfa:validateOwnerMfa(input.owner_mfa),
    dr_restore:validateDrProof(input.dr_restore),
    credential_rotations:validateCredentialRotations(input.credential_rotations),
    iam_review:validateIamReview(input.iam_review),
    engineering_gates:validateEngineeringGates(input.engineering_gates),
  };
  const gaps=Object.values(checks).flatMap(x=>x.gaps);
  const open_obligations=Object.values(checks).flatMap(x=>x.obligations);
  return {fingerprint:FINGERPRINT,status:gaps.length===0&&open_obligations.length===0?'LIVE & BEWEZEN':'DEELS LIVE',database_hardening_status:input.database_hardening?.status||'UNKNOWN',gaps,open_obligations,checks:Object.fromEntries(Object.entries(checks).map(([k,v])=>[k,v.ok?'GREEN':'OPEN']))};
}

function main(){
  const here=path.dirname(fileURLToPath(import.meta.url));
  const root=path.resolve(here,'..');
  const manifestPath=process.env.SECURITY_OPERATIONS_MANIFEST||path.join(root,'powerhouse/assurance/security-operations-closure.json');
  const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  const report=buildSecurityOperationsReport(manifest);
  process.stdout.write(`${JSON.stringify(report,null,2)}\n`);
  if(process.argv.includes('--check')&&report.gaps.length>0) process.exitCode=1;
  if(process.argv.includes('--require-live')&&report.status!=='LIVE & BEWEZEN') process.exitCode=2;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) main();
