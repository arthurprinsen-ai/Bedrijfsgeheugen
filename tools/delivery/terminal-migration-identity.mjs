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
