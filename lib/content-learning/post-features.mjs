const KEY_ALIASES = Object.freeze({
  hook_type: ['hook_type', 'Hook type', 'Hook Type', 'hook type'],
  format: ['format', 'Format', 'Media type', 'Media Type', 'media_type'],
  narrative_type: ['narrative_type', 'Narrative type', 'Narrative Type', 'narrative type'],
  emotion: ['emotion', 'Emotion'],
  cta_type: ['cta_type', 'CTA type', 'CTA Type', 'cta type'],
  topic: ['topic', 'Topic'],
  proof_type: ['proof_type', 'Proof type', 'Proof Type', 'proof type'],
  campaign_key: ['campaign_key', 'Campaign key', 'Campaign Key', 'Campaign', 'campaign'],
  notion_page_id: ['notion_page_id', 'notionPageId', 'Notion page id', 'Notion Page ID'],
});

function firstPresent(input, keys) {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) continue;
    const raw = input[key];
    if (raw === null || raw === undefined) continue;
    const value = String(raw).trim();
    if (value) return value;
  }
  return null;
}

export function normalizePostFeatures(input = {}) {
  const output = {};
  for (const [target, aliases] of Object.entries(KEY_ALIASES)) {
    let value = firstPresent(input, aliases);
    if (target === 'format' && value) value = value.toLowerCase();
    output[target] = value;
  }
  return output;
}

export { KEY_ALIASES };
