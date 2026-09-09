import { normalizePostFeatures } from './post-features.mjs';

function scalar(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = String(value).trim();
    return text || null;
  }
  if (Array.isArray(value)) return scalar(value[0]);
  if (typeof value === 'object') {
    if ('name' in value) return scalar(value.name);
    if ('plain_text' in value) return scalar(value.plain_text);
    if ('content' in value) return scalar(value.content);
    if ('select' in value) return scalar(value.select);
    if ('rich_text' in value) return scalar(value.rich_text);
    if ('title' in value) return scalar(value.title);
  }
  return null;
}

function read(properties, ...names) {
  for (const name of names) {
    if (!Object.prototype.hasOwnProperty.call(properties, name)) continue;
    const value = scalar(properties[name]);
    if (value) return value;
  }
  return null;
}

export function normalizeNotionPost(page = {}) {
  const properties = page.properties && typeof page.properties === 'object' ? page.properties : {};
  const notionPageId = scalar(page.id ?? page.page_id ?? page.url);
  const platform = read(properties, 'Platform', 'Kanaal', 'Channel')?.toLowerCase() ?? null;
  const postId = read(properties, 'Post ID', 'Post id', 'post_id', 'Content ID', 'Content id');
  const externalPostId = read(properties, 'External Post ID', 'External post id', 'external_post_id');
  const raw = {
    'Hook type': read(properties, 'Hook type', 'Hook Type', 'Haaktype'),
    'Media type': read(properties, 'Media type', 'Media Type', 'Format', 'Vorm'),
    'Narrative type': read(properties, 'Narrative type', 'Narrative Type', 'Verhaaltype'),
    'Emotion': read(properties, 'Emotion', 'Emotie'),
    'CTA type': read(properties, 'CTA type', 'CTA Type', 'CTA-type'),
    'Topic': read(properties, 'Topic', 'Onderwerp'),
    'Proof type': read(properties, 'Proof type', 'Proof Type', 'Bewijstype'),
    'Campaign': read(properties, 'Campaign', 'Campagne', 'Campaign key'),
    notion_page_id: notionPageId,
  };
  return {
    source: 'notion',
    notion_page_id: notionPageId,
    post_id: postId,
    external_post_id: externalPostId,
    platform,
    features: normalizePostFeatures(raw),
  };
}

export { scalar as notionScalar };
