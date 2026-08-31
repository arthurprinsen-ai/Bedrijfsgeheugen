import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const client=readFileSync('assets/js/portal-rum.js','utf8');
const builder=readFileSync('tools/bouw-powerhouse-auth.mjs','utf8');

test('portal RUM uses real navigation timing and authenticated Brain endpoint',()=>{
  assert.match(client,/performance\.getEntriesByType/);
  assert.match(client,/domInteractive/);
  assert.match(client,/responseEnd/);
  assert.match(client,/netlifyIdentity/);
  assert.match(client,/user\.jwt/);
  assert.match(client,/\/api\/brain-runtime-metric/);
  assert.match(client,/metricName:'interactive_ms'/);
  assert.match(client,/metricName:'cached_ms'/);
});

test('portal RUM is bounded to one pair per browser session and never fabricates samples',()=>{
  assert.match(client,/sessionStorage\.getItem\(SENT_KEY\)/);
  assert.match(client,/if\(!jwt\)return/);
  assert.doesNotMatch(client,/Math\.random\(\)\s*\*\s*\d+.*metric/i);
});

test('auth build injects the RUM client exactly once',()=>{
  assert.match(builder,/portal-rum\.js\?v=1/);
  assert.match(builder,/must be injected exactly once/);
  assert.match(builder,/replace\(\/<\\\/body>/);
});
