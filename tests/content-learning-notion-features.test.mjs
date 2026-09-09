import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNotionPost } from '../lib/content-learning/notion-post-features.mjs';

test('maps Notion post properties to canonical content features without inference', () => {
  const result = normalizeNotionPost({
    id: 'page-123',
    properties: {
      'Post ID': 'linkedin:abc',
      'Platform': 'LinkedIn',
      'Hook type': 'proof',
      'Media type': 'Document',
      'Narrative type': 'case',
      'Emotion': 'curiosity',
      'CTA type': 'comment',
      'Topic': 'AI adoption',
      'Campaign': 'li-ai-adoption-01'
    }
  });
  assert.equal(result.post_id, 'linkedin:abc');
  assert.equal(result.platform, 'linkedin');
  assert.equal(result.features.hook_type, 'proof');
  assert.equal(result.features.format, 'document');
  assert.equal(result.features.narrative_type, 'case');
  assert.equal(result.features.cta_type, 'comment');
  assert.equal(result.features.topic, 'AI adoption');
  assert.equal(result.features.campaign_key, 'li-ai-adoption-01');
  assert.equal(result.features.notion_page_id, 'page-123');
  assert.equal(result.source, 'notion');
});

test('keeps absent characteristics null instead of inventing them', () => {
  const result = normalizeNotionPost({ id: 'page-2', properties: { 'Post ID': 'x:2' } });
  assert.equal(result.features.hook_type, null);
  assert.equal(result.features.cta_type, null);
  assert.equal(result.features.topic, null);
});
