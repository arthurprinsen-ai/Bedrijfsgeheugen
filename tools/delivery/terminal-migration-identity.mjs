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
