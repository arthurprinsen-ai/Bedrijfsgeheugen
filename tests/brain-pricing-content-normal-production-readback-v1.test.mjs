import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyLiveSite } from '../tools/site-shell/live-contract.mjs';

const shell = (body, sha) => `<!doctype html><html><body><meta data-bg-release-sha="${sha}">${body}</body></html>`;

test('live pricing contract rejects legacy commercial copy', () => {
  const source = shell('<div class="bgx-vraagbalk"></div><div class="bgx-rekenaar"></div><div class="bgx-rol"></div><h3>Transform</h3><p>Per jaar</p><p>2 maanden gratis</p>', 'x');
  assert.throws(() => verifyLiveSite({home:source,pricing:source,content:source,expectedCommit:'x'}));
});


test('pricing page keeps mobile controls clickable and exposes monthly/yearly billing', async () => {
  const fs = await import('node:fs/promises');
  const pricing = await fs.readFile(new URL('../prijzen.html', import.meta.url), 'utf8');
  assert.match(pricing, /data-bg-billing="monthly"/);
  assert.match(pricing, /data-bg-billing="yearly"/);
  assert.match(pricing, /2 maanden voordeel/);
  assert.match(pricing, /data-yearly="€ 14\.950"/);
  assert.match(pricing, /data-yearly="€ 24\.950"/);
  assert.match(pricing, /data-yearly="vanaf € 49\.950"/);
  assert.match(pricing, /touch-action:manipulation/);
  assert.match(pricing, /card\.hidden=!active;card\.style\.display=active\?'':'none'/);
});


test('pricing page exposes lifecycle segmentation for growth recovery M&A and portfolio', async () => {
  const fs = await import('node:fs/promises');
  const pricing = await fs.readFile(new URL('../prijzen.html', import.meta.url), 'utf8');
  for (const stage of ['grow','loss','crisis','buy','sell','portfolio']) {
    assert.match(pricing, new RegExp('data-bg-stage="' + stage + '"'));
    assert.match(pricing, new RegExp('data-bg-stage-panel="' + stage + '"'));
  }
  assert.match(pricing, /Herstelscan/);
  assert.match(pricing, /13-weeks cashflow/);
  assert.match(pricing, /Operational &amp; Data DD|Operational & Data DD/);
  assert.match(pricing, /Exit Readiness Scan/);
  assert.match(pricing, /Portfolio Control/);
  assert.match(pricing, /Normalized EBITDA/);
  assert.match(pricing, /key-person risk/i);
  assert.match(pricing, /Juridisch insolventieadvies/);
});
