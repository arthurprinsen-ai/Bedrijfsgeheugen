// Pure, read-only source-ownership collision projection from the EXISTING Janitor
// open-PR snapshot. PR-body scopes are self-reported, not authoritative file diffs.
const SHA=/^[a-f0-9]{40}$/i;
const get=(body,key)=>{
  const line=String(body||'').split(/\r?\n/).find(x=>x.startsWith(key+': '));
  return line?line.slice(key.length+2).trim():null;
};
export function assessSupervisorOwnerClaims(pulls=[]){
  if(!Array.isArray(pulls))return {status:'PROVIDER_SNAPSHOT_MISSING',
    collisions:null,unverified_scope_prs:null,write_authorized:false};
  const paths=new Map(),unverified=[],invalid=[],writers=[];
  for(const pr of pulls){
    if(pr?.state!=='open'||pr.draft===true)continue;
    const body=String(pr.body||'');
    if(/^(RETIRED:|Retirement-State: RETIRED_DO_NOT_MERGE)/m.test(body)||
       String(pr.title||'').startsWith('RETIRED'))continue;
    const leaseState=get(body,'Writer-Lease-State');
    if(!['TERMINAL_DELIVERY','MAIN_SYNC'].includes(leaseState))continue;
    const number=pr.number,head=pr.head?.sha;
    const owner=get(body,'Writer-Lease-Owner'),leaseHead=get(body,'Writer-Lease-Head');
    const raw=get(body,'Change-Scope');
    const declared=raw?raw.split(',').map(x=>x.trim()).filter(Boolean):[];
    if(!Number.isSafeInteger(number)||number<1||!SHA.test(head||'')||
       leaseHead!==head||!owner){
      invalid.push(number||null);continue;
    }
    if(!declared.length){unverified.push(number);continue;}
    const unique=[...new Set(declared)];
    writers.push({pr_number:number,head_sha:head,owner,declared_paths:unique.length});
    for(const path of unique){
      const others=paths.get(path)||[];
      others.push({pr_number:number,owner,head_sha:head});
      paths.set(path,others);
    }
  }
  const collisions=[...paths.entries()].filter(([,rows])=>
    new Set(rows.map(row=>row.pr_number)).size>1).map(([path,rows])=>({path,writers:rows}))
    .sort((a,b)=>a.path.localeCompare(b.path));
  const fullyObserved=invalid.length===0&&unverified.length===0;
  return {schema:'supervisor-declared-file-ownership-v1',
    status:collisions.length?'DECLARED_MULTI_WRITER_COLLISION':
      fullyObserved?'NO_DECLARED_COLLISION_UNVERIFIED_PROVIDER_DIFF':'PARTIAL_OWNER_DECLARATIONS',
    writers,collisions,invalid_lease_prs:invalid,unverified_scope_prs:unverified,
    authority:'SELF_DECLARED_PR_METADATA_NOT_ACTUAL_CHANGED_FILES',
    // No claim of a GitHub-enforced lock without verified file diff and native CAS.
    write_authorized:false,global_single_writer_proven:false};
}
