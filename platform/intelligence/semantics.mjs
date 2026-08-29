export const INTELLIGENCE_TYPES = Object.freeze({ FACT:'Fact', OBSERVATION:'Observation', HYPOTHESIS:'Hypothesis', RECOMMENDATION:'Recommendation', DECISION:'Decision', ACTION:'Action' });

export function createIntelligenceItem(input) {
  for (const field of ['id','tenantId','type','text']) if (!input?.[field]) throw new TypeError(`${field} is required`);
  if (![INTELLIGENCE_TYPES.FACT, INTELLIGENCE_TYPES.DECISION, INTELLIGENCE_TYPES.ACTION].includes(input.type)) {
    if (!input.provenance || typeof input.confidence !== 'number') throw new TypeError('AI-derived intelligence requires provenance and confidence');
  }
  return Object.freeze({ ...input, truthClass: input.type === INTELLIGENCE_TYPES.FACT ? 'SourceTruth' : (input.type === INTELLIGENCE_TYPES.DECISION || input.type === INTELLIGENCE_TYPES.ACTION ? 'BusinessTruth' : 'AIInterpretation') });
}

export function materialityScore(item) {
  const n = key => Number(item?.[key] ?? 0);
  return n('relevance')*.25 + n('impact')*.25 + n('urgency')*.2 + n('confidence')*.15 + n('responsibility')*.1 + n('novelty')*.05;
}

export function rankAttention(items, limit = 7) {
  const bounded = Math.max(3, Math.min(7, limit));
  return Object.freeze(items.filter(x => x.permitted !== false).map(x => Object.freeze({ ...x, materialityScore: materialityScore(x) })).sort((a,b)=>b.materialityScore-a.materialityScore).slice(0,bounded));
}
