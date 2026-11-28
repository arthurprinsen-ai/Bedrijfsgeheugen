/**
 * Reconcile historical migration lineage to the protected-main source tree.
 * Exact (version, name) always takes precedence over a same-name timestamp alias.
 * A same-name fallback is allowed only if it is unique; ambiguity fails closed.
 * This never mutates migrations or the Supabase production ledger.
 */
const VALID_VERSION=/^\d{14}$/;
const VALID_NAME=/^[a-z0-9_]+$/;
const SQL_PATH=/^supabase\/migrations\/(\d{14})_([a-z0-9_]+)\.sql$/;

export function resolveTerminalMigrationIdentities(items=[], currentPaths=[]){
  const exactPaths=new Set();
  const pathsByName=new Map();
  for(const path of currentPaths){
    const match=String(path).match(SQL_PATH);
    if(!match) continue;
    exactPaths.add(path);
    const candidates=pathsByName.get(match[2])||[];
    candidates.push({version:match[1],path});
    pathsByName.set(match[2],candidates);
  }

  return items.map(item=>{
    const version=String(item.version||'');
    const name=String(item.name||'');
    if(!VALID_VERSION.test(version)||!VALID_NAME.test(name))
      throw new Error(`SUPABASE_MIGRATION_IDENTITY_INVALID:${version}:${name}`);

    const exactPath=`supabase/migrations/${version}_${name}.sql`;
    if(exactPaths.has(exactPath))
      return {...item,version,canonical_path:exactPath,historical_version:version};

    const matches=pathsByName.get(name)||[];
    if(matches.length>1)
      throw new Error(`SUPABASE_MIGRATION_CANONICAL_IDENTITY_AMBIGUOUS:${name}:${matches.map(x=>x.path).join(',')}`);
    if(matches.length===0) return item;

    return {...item,version:matches[0].version,canonical_path:matches[0].path,historical_version:version};
  });
}

/**
 * A retired, never-merged predecessor is not a migration release. Permit
 * its changed SQL only if its direct successor explicitly adopts every
 * exact migration path on a protected merged commit and that same Git blob
 * remains current on protected main. Old draft bytes may differ; only the
 * successor's source and independent Supabase APPLIED readback are authority.
 * Does not waive any terminal provider, identity, ACL or evidence gate.
 */
export function verifyRetiredMigrationSupersession({
  retiredPrNumber, retiredState, retiredMerged, retiredBody,
  successorPrNumber, successorBody, migrationFiles,
  mergedMigrationBlobs, currentMainBlobs
}={}){
  if(retiredState!=='closed'||retiredMerged!==false)
    throw new Error(`SUPERSEDES_PREDECESSOR_NOT_RETIRED:${retiredPrNumber}`);
  if(!Number.isInteger(retiredPrNumber)||retiredPrNumber<1||
     !Number.isInteger(successorPrNumber)||successorPrNumber<1||
     !String(successorBody||'').split(/\r?\n/).some(line=>line.trim()===`Supersedes: ${retiredPrNumber}`)||
     !/^Writer-Lease-State:\s*SUPERSEDED\s*$/m.test(String(retiredBody||'')))
    throw new Error(`SUPERSEDES_MIGRATION_OWNER_LINK_UNPROVEN:${retiredPrNumber}`);
  if(!Array.isArray(migrationFiles)) throw new Error('SUPERSEDES_MIGRATION_FILE_LIST_MISSING');
  const results=[];
  for(const file of migrationFiles){
    const name=String(file?.filename||'');
    if(!/^supabase\/migrations\/\d{14}_[a-z0-9_]+\.sql$/.test(name)||
       !/^[0-9a-f]{40}$/i.test(String(file.sha||'')))
      throw new Error(`SUPERSEDES_MIGRATION_FILE_IDENTITY_INVALID:${name}`);
    const adopted=mergedMigrationBlobs?.[name];
    const mergedSha=String(adopted?.sha||'');
    const currentSha=String(currentMainBlobs?.[name]||'');
    if(!/^[0-9a-f]{40}$/i.test(mergedSha)||!Number.isInteger(adopted?.source_pr))
      throw new Error(`UNMERGED_SUPERSEDES_MIGRATION_NOT_ADOPTED:${retiredPrNumber}:${name}`);
    if(mergedSha!==currentSha)
      throw new Error(`SUPERSEDES_MIGRATION_SOURCE_DRIFT:${retiredPrNumber}:${name}`);
    results.push({path:name,retired_pr:retiredPrNumber,successor_pr:successorPrNumber,
      adopted_pr:adopted.source_pr,source_sha:mergedSha,
      retired_blob_sha:file.sha,retired_blob_identical:file.sha===mergedSha});
  }
  return results;
}

/** An open one-path regulatory source observation can be non-migration evidence
 * only if its direct merged successor adopted the exact bytes, still on main.
 * This is NOT permission to close or release the original writer. */
export function verifyOpenRegulatoryPredecessor({predecessor,successor,files,originalBlob,successorBlob,currentBlob,obligation,headRecheck}={}){
 const fail=()=>{throw Error('OPEN_REGULATORY_PREDECESSOR_UNPROVEN');};
 const sha=/^[0-9a-f]{40}$/;
 const path='data/regulatory-source-state.json';
 const line=(body,key,value)=>String(body||'').split(/\r?\n/).filter(l=>l.startsWith(key+':')).length===1&&String(body||'').split(/\r?\n/).includes(key+': '+value);
 if(!predecessor||!successor||!/^regulatory-source-watch-[1-9]\d*$/.test(obligation)||
    predecessor.state!=='open'||predecessor.merged!==false||successor.state!=='closed'||successor.merged!==true||
    !Number.isSafeInteger(predecessor.number)||predecessor.number<1||!Number.isSafeInteger(successor.number)||successor.number<=predecessor.number||
    !sha.test(predecessor.head?.sha)||headRecheck!==predecessor.head.sha||!sha.test(successor.merge_commit_sha)||
    predecessor.changed_files!==1||!Array.isArray(files)||files.length!==1||files[0]?.filename!==path||
    !['added','modified'].includes(files[0]?.status)||!sha.test(originalBlob)||files[0].sha!==originalBlob||
    originalBlob!==successorBlob||originalBlob!==currentBlob||
    !line(predecessor.body,'Obligation-ID',obligation)||!line(successor.body,'Obligation-ID',obligation)||
    !line(predecessor.body,'Regulatory-Candidate-Type','source-observation')||
    !line(predecessor.body,'Writer-Lease-State','TERMINAL_DELIVERY')||
    !line(predecessor.body,'Writer-Lease-Head',predecessor.head.sha)||
    !line(predecessor.body,'Writer-Lease-Obligation',obligation)||
    !line(predecessor.body,'Writer-Lease-NonOwner-Action','DEFER')||
    !line(successor.body,'Supersedes',String(predecessor.number)))fail();
 return {status:'OPEN_REGULATORY_NON_MIGRATION_PROVEN',predecessor:predecessor.number,successor:successor.number,source_blob:originalBlob,predecessor_head:predecessor.head.sha,successor_merge:successor.merge_commit_sha,writer_lease_released:false};
}
