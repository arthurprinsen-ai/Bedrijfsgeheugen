// Resolve terminal Supabase migration proof against the authoritative source tree.
// A migration identity is (version, name), not just the human-readable name.
// Recover by name only if the exact version is missing and the alternative is unique.
const VALID_PATH=/^supabase\/migrations\/(\d{14})_([a-z0-9_]+)\.sql$/;

export function resolveTerminalMigrationIdentity(item, currentMigrationPaths=[]) {
  const version=String(item?.version??'');
  const name=String(item?.name??'');
  if(!/^\d{14}$/.test(version)||!/^[a-z0-9_]+$/.test(name))
    throw new Error(`SUPABASE_MIGRATION_IDENTITY_INVALID:${version}:${name}`);
  if(!Array.isArray(currentMigrationPaths))
    throw new Error('SUPABASE_MIGRATION_SOURCE_TREE_INVALID');

  const exactPath=`supabase/migrations/${version}_${name}.sql`;
  // Critical: two independently applied, exact, idempotent migrations may
  // legitimately share a name. Never call those paths ambiguous.
  if(currentMigrationPaths.includes(exactPath))
    return {...item,version,name,canonical_path:exactPath,historical_version:version,resolution:'EXACT_VERSION'};

  const matches=currentMigrationPaths.filter(candidate=>{
    const found=String(candidate).match(VALID_PATH);
    return found && found[2]===name;
  });
  if(matches.length>1)
    throw new Error(`SUPABASE_MIGRATION_CANONICAL_IDENTITY_AMBIGUOUS:${name}:${matches.join(',')}`);
  if(matches.length===0)
    return item; // Preserve strict downstream production-readback handling.

  const match=matches[0].match(VALID_PATH);
  if(!match)throw new Error(`SUPABASE_MIGRATION_CANONICAL_IDENTITY_INVALID:${matches[0]}`);
  return {...item,version:match[1],name,canonical_path:matches[0],historical_version:version,resolution:'UNIQUE_NAME'};
}
