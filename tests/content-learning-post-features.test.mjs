import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePostFeatures } from '../lib/content-learning/post-features.mjs';

test('normalizes known post feature aliases without inventing missing facts', () => {
  assert.deepEqual(normalizePostFeatures({
    'Hook type': 'contrarian',
    'Media type': 'Document',
    'Narrative type': 'case',
    Emotion: 'curiosity',
    'CTA type': 'comment',
    Topic: 'AI adoption',
    'Proof type': 'customer evidence',
    Campaign: 'li-ai-adoption-2026-09-09',
    notionPageId: 'abc-123',
  }), {
    hook_type: 'contrarian',
    format: 'document',
    narrative_type: 'case',
    emotion: 'curiosity',
    cta_type: 'comment',
    topic: 'AI adoption',
    proof_type: 'customer evidence',
    campaign_key: 'li-ai-adoption-2026-09-09',
    notion_page_id: 'abc-123',
  });
});

test('keeps absent and blank post characteristics explicitly null', () => {
  assert.deepEqual(normalizePostFeatures({ hook_type: '   ', format: null }), {
    hook_type: null,
    format: null,
    narrative_type: null,
    emotion: null,
    cta_type: null,
    topic: null,
    proof_type: null,
    campaign_key: null,
    notion_page_id: null,
  });
});
