// A personal-only observational preference; never a hard quota or a treatment claim.
export function personalLengthPreference(channel, analysis) {
  if(channel!=='linkedin_personal'||analysis?.contract!=='personal_exact_copy_observational_length_v1'
    ||analysis.causal_effect_proven!==false||analysis.variant_assignment_proven!==false||analysis.metric!=='reactions'
    ||!Array.isArray(analysis.cohorts))return null;
  const bands=['130-159','160-179','180-200'];
  const eligible=analysis.cohorts.filter(c=>bands.includes(c?.length_group)&&Number.isInteger(c.n)&&c.n>=4
    &&typeof c.median_reactions==='number'&&Number.isFinite(c.median_reactions)&&c.median_reactions>=0);
  if(new Set(eligible.map(c=>c.length_group)).size<2||new Set(eligible.map(c=>c.length_group)).size!==eligible.length)return null;
  const winner=[...eligible].sort((a,b)=>b.median_reactions-a.median_reactions||b.n-a.n||a.length_group.localeCompare(b.length_group))[0];
  if(winner.length_group!==analysis.preferred_length)return null;
  return {contract:analysis.contract,preferred_length:winner.length_group,sample_size:winner.n,metric:'reactions',
    causal_effect_proven:false,variant_assignment_proven:false};
}
export function personalLengthGuide(preference){
  return preference ? ' OBSERVATIONELE REDACTIEVOORKEUR: als het ene geverifieerde persoonlijke bronverhaal deze natuurlijke lengte verdient, streef naar '+preference.preferred_length+' woorden. Geen verplicht quotum: nooit feiten toevoegen, schrappen die nodig zijn voor de waarheid, een vaste slotvraag afdwingen of goedgekeurde bevroren copy wijzigen. Bronwaarheid en natuurlijkheid gaan voor. Noem de analyse niet in de publieke tekst.' : '';
}
export function personalLengthDraftReceipt(preference,body){
  if(!preference)return null;
  const count=String(body||'').trim().split(/\s+/u).filter(Boolean).length;
  const [lo,hi]=preference.preferred_length.split('-').map(Number);
  return {...preference,draft_word_count:count,draft_in_preferred_band:count>=lo&&count<=hi,
    state:'MODEL_GUIDANCE_DRAFT_ONLY',provider_application_verified:false};
}
