import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

/**
 * Bewaakt dat een readback niet rood kan gaan omdat hij te vroeg keek.
 *
 * Op 10 september 2026 ging production-dom-readback rood met een 404 op
 * /portal-v2/ van de deploy preview. Er was niets mis: de readback wachtte
 * dertig pogingen van tien seconden en de preview was net iets later klaar.
 * Kort erna was diezelfde URL gewoon bereikbaar.
 *
 * Dat is dezelfde ziekte als de flakey Chromium-installatie uit #1345: een
 * check die rood staat om een reden buiten de code, en die je daarmee leert
 * rood te negeren. Deze test houdt twee dingen vast:
 *   1. wie op een deploy preview wacht, doet dat via het gedeelde script;
 *   2. dat script houdt een venster aan dat past bij hoe lang een deploy duurt.
 */

const WORKFLOW_DIR = '.github/workflows';
const SCRIPT = 'tools/ci/wait-for-url.sh';

const workflows = () => readdirSync(WORKFLOW_DIR)
  .filter(name => name.endsWith('.yml') || name.endsWith('.yaml'))
  .map(name => [name, readFileSync(`${WORKFLOW_DIR}/${name}`, 'utf8')]);

test('het gedeelde wachtscript bestaat en is diagnosticeerbaar', () => {
  assert.ok(existsSync(SCRIPT), 'het gedeelde wachtscript ontbreekt');
  const bron = readFileSync(SCRIPT, 'utf8');
  assert.match(bron, /POGINGEN:-(\d+)/, 'het aantal pogingen is niet instelbaar');
  assert.match(bron, /INTERVAL:-(\d+)/, 'het interval is niet instelbaar');
  const pogingen = Number(bron.match(/POGINGEN:-(\d+)/)[1]);
  const interval = Number(bron.match(/INTERVAL:-(\d+)/)[1]);
  assert.ok(pogingen * interval >= 600,
    `het standaardvenster is ${pogingen * interval}s; een deploy preview heeft er soms meer dan tien minuten nodig`);
  assert.match(bron, /laatste status/, 'bij mislukking wordt de laatste HTTP-status niet gemeld');
  assert.match(bron, /pogingen \(\$\{verstreken\}s\)/, 'bij succes wordt niet gelogd hoeveel tijd het kostte');
});

test('wie op een deploy preview wacht, doet dat niet met een eigen krappe lus', () => {
  const overtreders = [];
  for (const [naam, bron] of workflows()) {
    if (!/deploy-preview-/.test(bron)) continue;
    // Een eigen curl-lus op de preview-URL is precies wat misging.
    const eigenLus = /for\s+\w+\s+in\s+\$\(seq 1 (\d+)\);[\s\S]{0,200}?curl[^\n]*deploy-preview-|for\s+\w+\s+in\s+\$\(seq 1 (\d+)\);[\s\S]{0,200}?curl[^\n]*READBACK_URL/;
    const match = bron.match(eigenLus);
    if (match) overtreders.push(`${naam} (eigen lus van ${match[1] || match[2]} pogingen)`);
  }
  assert.deepEqual(overtreders, [],
    `deze workflows pollen zelf op een deploy preview; gebruik ${SCRIPT} zodat het venster en de foutmelding op één plek staan`);
});


// The old preview readiness failure was a 30-attempt EXTERNAL fetch. A short
// loopback-only http.server startup probe is not a provider preview poll.
const shortPreviewLoop = /for\s+\w+\s+in\s+\$\(\s*seq\s+1\s+30\s*\)\s*;\s*do\b[\s\S]{0,1000}?\bdone\b/g;
const usesShortLegacyPreviewPolling = source => [...source.matchAll(shortPreviewLoop)]
  .some(([loop]) => /\bcurl\b[^\n]*(?:deploy-preview-|PORTAL_ALIAS_URL|READBACK_URL)/.test(loop));

test('het regressie-orakel onderscheidt externe preview-polling van lokale serverstart', () => {
  const localStartup = 'for i in $(seq 1 30); do\n curl -fsS http://127.0.0.1:4173/portaal/demo/\n sleep 1\ndone';
  const badAlias = 'for i in $(seq 1 30); do\n curl -fsS "$PORTAL_ALIAS_URL/portal-v2/"\n sleep 10\ndone';
  const badDirect = 'for i in $(seq 1 30); do\n curl -fsS https://deploy-preview-42--bedrijfsgeheugen.netlify.app/portal-v2/\n sleep 10\ndone';
  assert.equal(usesShortLegacyPreviewPolling(localStartup), false, 'lokale serverbootstrap is geen deploy-preview');
  assert.equal(usesShortLegacyPreviewPolling(badAlias), true, 'de oude preview-aliaslus moet rood blijven');
  assert.equal(usesShortLegacyPreviewPolling(badDirect), true, 'de oude directe preview-lus moet rood blijven');
});

test('de readback van Portal V2 gebruikt het gedeelde script', () => {
  const bron = readFileSync(`${WORKFLOW_DIR}/portal-v2-production-dom-readback.yml`, 'utf8');
  assert.match(bron, /tools\/ci\/wait-for-url\.sh/, 'de readback wacht niet via het gedeelde script');
  assert.equal(usesShortLegacyPreviewPolling(bron), false, 'de oude korte EXTERNE preview-lus staat er nog');
});
