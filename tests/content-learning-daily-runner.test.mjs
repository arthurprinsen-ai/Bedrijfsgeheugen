import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGa4ToolRequest, extractGa4Report } from '../lib/content-learning/composio-ga4.mjs';
import { notionRowToImports } from '../lib/content-learning/notion-import-payload.mjs';

test('builds a bounded Composio GA4 report request with campaign attribution', () => {
  const request = buildGa4ToolRequest({ property: 'properties/123', startDate: '2026-09-08', endDate: '2026-09-09' });
  assert.equal(request.tool_slug, 'GOOGLE_ANALYTICS_RUN_REPORT');
  assert.equal(request.arguments.property, 'properties/123');
  assert.deepEqual(request.arguments.dimensions.map(x => x.name), ['date','pagePath','sessionCampaignName']);
  assert.deepEqual(request.arguments.metrics.map(x => x.name), ['sessions','activeUsers','eventCount']);
  assert.equal(request.arguments.limit, 250000);
});

test('extracts the actual GA4 report from a Composio execute response', () => {
  const report = { dimensionHeaders:[{name:'date'}], metricHeaders:[{name:'sessions'}], rows:[] };
  assert.equal(extractGa4Report({ data: report }), report);
  assert.equal(extractGa4Report({ data: { data: report } }), report);
  assert.throws(() => extractGa4Report({ data: {} }), /GA4_REPORT_MISSING/);
});

test('turns one Notion calendar row into platform-specific imports using real post ids', () => {
  const imports = notionRowToImports({
    url: 'https://notion.so/page',
    'Hook type': 'Probleem',
    'Media type': 'Carrousel',
    'CTA type': 'Scan',
    'Campagne': 'Kennisrisico',
    'Contentpijler': 'Kennisverlies',
    'Post ID LinkedIn': 'li-123',
    'Post ID Instagram': 'ig-456'
  });
  assert.equal(imports.length, 2);
  assert.deepEqual(imports.map(x => x.platform).sort(), ['instagram','linkedin']);
  assert.equal(imports[0].hook_type, 'probleem');
  assert.equal(imports[0].format, 'carrousel');
  assert.equal(imports[0].cta_type, 'scan');
  assert.equal(imports[0].topic, 'Kennisverlies');
  assert.equal(imports[0].source_campaign_id, 'Kennisrisico');
});
