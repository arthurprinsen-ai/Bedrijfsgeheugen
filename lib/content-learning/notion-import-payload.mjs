const text = value => {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s || null;
};
const lower = value => text(value)?.toLowerCase() ?? null;

export function notionRowToImports(row = {}) {
  const common = {
    hook_type: lower(row['Hook type']),
    format: lower(row['Media type']),
    narrative_type: lower(row['Narrative role'] || row['Narrative arc']),
    emotion: lower(row['Emotion']),
    cta_type: lower(row['CTA type']),
    topic: text(row['Contentpijler'] || row['Weekthema']),
    source_campaign_id: text(row['Campagne'] || row['Leadbroncode']),
    notion_page_id: text(row.url),
    bron: 'notion',
  };
  const out = [];
  const linkedinId = text(row['Post ID LinkedIn']);
  if (linkedinId) out.push({ ...common, platform: 'linkedin', external_post_id: linkedinId, post_id: `linkedin:${linkedinId}` });
  const instagramId = text(row['Post ID Instagram']);
  if (instagramId) out.push({ ...common, platform: 'instagram', external_post_id: instagramId, post_id: `instagram:${instagramId}` });
  return out;
}
