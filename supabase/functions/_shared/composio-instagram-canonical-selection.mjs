// Select only a provider-verified Business/Creator identity. Aliases never override identity.
export const CANONICAL_INSTAGRAM_USERNAME='bedrijfsgeheugen.nl';
export const CANONICAL_INSTAGRAM_ALIASES=Object.freeze([
  'bedrijfsgeheugen-mira-canonical',
  'bedrijfsgeheugen-nl-canonical',
]);

export function selectVerifiedCanonicalInstagramConnection(healthyConnections){
  const verified=(Array.isArray(healthyConnections)?healthyConnections:[]).filter((entry)=>
    String(entry?.identity?.username??'').trim().toLowerCase()===CANONICAL_INSTAGRAM_USERNAME
  );
  const canonical=verified.filter((entry)=>
    CANONICAL_INSTAGRAM_ALIASES.includes(String(entry?.account?.alias??'').trim())
  );
  const selectable=canonical.length?canonical:verified;
  // Never choose arbitrarily among several canonical candidates.
  return {
    selectable,
    canonical_alias_selected:selectable.length===1&&canonical.length===1,
  };
}
