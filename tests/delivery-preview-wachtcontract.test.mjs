import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

/**
 * Wachten op een deploy preview: doe het op het signaal, niet op een gok.
 *
 * Op 10 september 2026 ging portal-v2-production-dom-readback rood met een 404
 * op /portal-v2/, terwijl portal-v2-live-preview op exact dezelfde preview
 * gewoon slaagde. Het verschil: de readback bouwde zelf een URL in de vorm
 * deploy-preview-<PR>--bedrijfsgeheugen.netlify.app en pollde die vijf minuten
 * blind, terwijl de andere workflows wachten op het Netlify-statussignaal
 * netlify/bedrijfsgeheugen/deploy-preview en de URL gebruiken die Netlify zelf
 * meldt.
 *
 * Een check die rood gaat omdat hij te vroeg op de verkeerde plek kijkt, meet
 * niets — en leert je rood te negeren. Deze bewaking houdt beide fouten tegen.
 */

const WORKFLOW_DIR = '.github/workflows';
const NETLIFY_STATUS = 'netlify/bedrijfsgeheugen/deploy-preview';

function workflows() {
  return readdirSync(WORKFLOW_DIR)
    .filter(name => name.endsWith('.yml') || name.endsWith('.yaml'))
    .map(name => ({ naam: name, bron: readFileSync(`${WORKFLOW_DIR}/${name}`, 'utf8') }));
}

test('geen enkele workflow bouwt zelf een deploy-preview-URL', () => {
  const gokkers = workflows()
    // Let op de vorm: zowel ${VAR} als ${{ inputs.x }} telt als zelf samenstellen.
    // Een eerdere versie van dit patroon miste ${{ ... }} en gaf daarmee valse
    // geruststelling: de test stond groen terwijl vier plekken de URL nog gokten.
    .filter(wf => /deploy-preview-\$\{/.test(wf.bron))
    .map(wf => wf.naam);
  assert.deepEqual(gokkers, [],
    'Deze workflows raden de preview-URL in plaats van hem van Netlify te vragen. ' +
    `Wacht op het statussignaal ${NETLIFY_STATUS} en gebruik de target_url die daarin staat.`);
});

test('wie de preview daadwerkelijk bezoekt, gebruikt de door Netlify gemelde URL', () => {
  // Een workflow die alleen wacht tot de preview klaar is (om andere jobs te
  // laten starten) heeft de URL niet nodig. Een workflow die er zelf naartoe
  // navigeert wel — en moet hem dan van Netlify krijgen, niet zelf verzinnen.
  for (const wf of workflows()) {
    if (!wf.bron.includes(NETLIFY_STATUS)) continue;
    const bezoekt = /PREVIEW_URL|PORTAL_READBACK_URL|PRODUCTION_URL/.test(wf.bron);
    if (!bezoekt) continue;
    assert.match(wf.bron, /target_url/,
      `${wf.naam} navigeert naar de preview maar haalt de URL niet uit de gemelde target_url`);
  }
});

test('de readback wacht op het signaal en niet op een zelfbedachte URL', () => {
  const bron = readFileSync(`${WORKFLOW_DIR}/portal-v2-production-dom-readback.yml`, 'utf8');
  assert.match(bron, new RegExp(NETLIFY_STATUS.replace(/\//g, '\\/')),
    'de readback wacht niet op het Netlify-statussignaal');
  assert.match(bron, /wait-for-url\.sh/, 'de readback gebruikt het gedeelde wachtscript niet');
  assert.doesNotMatch(bron, /seq 1 30/, 'de readback hanteert nog het oude wachtvenster van vijf minuten');
});

test('het gedeelde wachtscript meldt bruikbaar wat er misging', () => {
  const script = readFileSync('tools/ci/wait-for-url.sh', 'utf8');
  assert.match(script, /WACHT_POGINGEN:-72/, 'het standaardvenster is korter dan twaalf minuten');
  assert.match(script, /laatste_status/, 'het script meldt de laatste HTTP-status niet');
  assert.match(script, /verstreken/, 'het script meldt niet hoe lang het heeft gewacht');
  assert.match(script, /404/, 'het script legt niet uit wat een 404 na het volledige venster betekent');
});
