// Reader-only shape normalization for legacy JSONB string evidence.
// Never alter authorization, dedupe reservation, provider ID or source lineage.
export function normalizeRecommendationEvidence(row) {
  if (!row || typeof row !== 'object' || typeof row.evidence !== 'string') return row;
  let parsed;
  try { parsed = JSON.parse(row.evidence); } catch { return {...row,evidence:{}}; }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {...row,evidence:{}};
  return {...row,evidence:parsed};
}
