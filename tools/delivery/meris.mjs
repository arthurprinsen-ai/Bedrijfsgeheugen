// MERIS-1: advisory, deterministic release ranking. No write authority.
export function rankCandidates(candidates) {
  if (!Array.isArray(candidates)) throw new Error('INVALID_CANDIDATES');
  const seen = new Set();
  for (const c of candidates) {
    if (!c.id || seen.has(c.id)) throw new Error('INVALID_OR_DUPLICATE_ID');
    seen.add(c.id);
  }
  const sha = /^[a-f0-9]{40}$/;
  const valid = c => ['value','duration','failureProbability','rework','uncertainty'].every(k => Number.isFinite(c[k]) && c[k]>=0) && c.duration>0 && c.failureProbability<=1;
  const overlap = (a,b) => a.some(x=>b.some(y=>x===y||x.startsWith(y+'/')||y.startsWith(x+'/')));
  const eligible=[], deferred=[];
  for (const c of candidates) {
    const reason = !valid(c)?'INVALID_ESTIMATE': !sha.test(c.head||'')||!sha.test(c.base||'')?'IDENTITY_MISSING':c.ownerAuthorized!==true?'OWNER_UNVERIFIED':c.mergeable!==true?'MERGEABILITY_UNPROVEN':c.testedHead!==c.head||c.currentBase!==c.base?'STALE_EVIDENCE':c.requiredChecksGreen!==true?'CHECKS_NOT_GREEN':!Array.isArray(c.paths)||!c.paths.length||c.paths.some(p=>typeof p!=='string'||!p||p.startsWith('/')||p.split('/').includes('..'))?'SCOPE_UNPROVEN':null;
    if(reason) deferred.push({id:c.id,reason}); else eligible.push(c);
  }
  const ranked=eligible.map(c=>({id:c.id,score:c.value*(1-c.failureProbability)/(c.duration+c.failureProbability*c.rework+c.uncertainty),paths:c.paths})).sort((a,b)=>b.score-a.score||String(a.id).localeCompare(String(b.id)));
  const wave=[];
  for(const c of ranked) if(!wave.some(x=>overlap(x.paths,c.paths))) wave.push(c);
  return {mode:'SHADOW_ONLY',mergeAuthorized:false,ranked:ranked.map(({id,score})=>({id,score})),independentValidationWave:wave.map(x=>x.id),deferred};
}
