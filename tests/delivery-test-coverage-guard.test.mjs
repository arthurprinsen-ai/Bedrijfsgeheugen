import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

/**
 * Deze bewaking bestaat om één stil probleem zichtbaar te houden.
 *
 * CI draait niet `node --test tests/`, maar per lane een expliciete lijst met
 * testbestanden. Een testbestand dat in geen enkele workflow genoemd wordt,
 * draait dus nooit — het staat er, het lijkt bewaking, en het bewaakt niets.
 * Op 10 september 2026 gold dat voor 46 van de 429 testbestanden, waarvan er
 * twaalf rood stonden zonder dat iemand dat kon zien.
 *
 * Zodra je een nieuw testbestand toevoegt, moet je het ook aan een lane
 * toevoegen (.github/workflows/lane-*.yml of required-test.yml). Vergeet je
 * dat, dan faalt deze test.
 */

const WORKFLOW_DIR = '.github/workflows';
const TEST_DIRS = ['tests', 'portal-v2/tests'];

/**
 * Testbestanden die bewust nog niet in CI hangen omdat ze op dit moment rood
 * staan. Ze zijn hier geregistreerd zodat ze zichtbaar zijn in plaats van
 * onzichtbaar. Deze lijst hoort korter te worden, nooit langer.
 */
const BEKEND_ROOD = Object.freeze({
  'tests/commercial-intent-pages-v1.test.mjs': 'due-diligence injecteert na hydratatie alsnog style, hero en decision in de DOM',
  'tests/homepage-automation-layout.test.mjs': 'het beschermde paar automation-heading/automation-card met maxIntersectionAreaPx2 0 ontbreekt in het visual-regressiecontract',
  'tests/money-page-shared-loader.test.mjs': 'ECHT GAT, ook op productie: zeven money pages laden /assets/stijl.js niet en missen daardoor zowel de cookiebanner als het money-page conversiecontract',
  'tests/seo-estate-policy-v3.test.mjs': 'GEDRAGSVERANDERING: classifyCanonical geeft een onbekende commercieel ogende route nu automatisch page_class support in plaats van null; de fail-closed regel geldt niet meer',
  'tests/social-learning-evaluate.test.mjs': 'bij commerciele tegenspraak schrijft de evaluator helemaal geen learning weg; de test verwacht een niet-PROVEN learning op effectMetric revenue',
  'tests/tabbladen.test.mjs': 'vereist de productiebuild (apply-tabbladen); groen zodra index.html gebouwd is, hoort dus in de website-lane'
});

function referencedTestFiles() {
  const referenced = new Set();
  for (const file of readdirSync(WORKFLOW_DIR)) {
    if (!file.endsWith('.yml') && !file.endsWith('.yaml')) continue;
    const source = readFileSync(`${WORKFLOW_DIR}/${file}`, 'utf8');
    for (const match of source.matchAll(/(?:portal-v2\/)?tests\/[A-Za-z0-9_.*-]+\.test\.mjs/g)) {
      const pattern = match[0];
      if (!pattern.includes('*')) { referenced.add(pattern); continue; }
      const regex = new RegExp(`^${pattern.replace(/[.]/g, '\\.').replace(/\//g, '\\/').replace(/\*/g, '[A-Za-z0-9_.-]*')}$`);
      for (const candidate of allTestFiles()) if (regex.test(candidate)) referenced.add(candidate);
    }
  }
  return referenced;
}

function allTestFiles() {
  return TEST_DIRS.flatMap(dir =>
    readdirSync(dir).filter(name => name.endsWith('.test.mjs')).map(name => `${dir}/${name}`));
}

test('elk testbestand wordt door minstens één workflow gedraaid', () => {
  const referenced = referencedTestFiles();
  const orphans = allTestFiles().filter(file => !referenced.has(file) && !(file in BEKEND_ROOD));
  assert.deepEqual(
    orphans, [],
    `deze testbestanden draaien nergens in CI en bewaken dus niets:\n  ${orphans.join('\n  ')}\n` +
    'Voeg ze toe aan een lane in .github/workflows/, of zet ze met een reden in BEKEND_ROOD.'
  );
});

test('de lijst met bekend rode tests bevat geen bestanden die inmiddels wel draaien', () => {
  const referenced = referencedTestFiles();
  const overbodig = Object.keys(BEKEND_ROOD).filter(file => referenced.has(file));
  assert.deepEqual(overbodig, [], `deze staan als bekend rood geregistreerd maar draaien wel: ${overbodig.join(', ')}`);
});

test('elke bekend rode test bestaat nog en heeft een reden', () => {
  const bestaand = new Set(allTestFiles());
  for (const [file, reden] of Object.entries(BEKEND_ROOD)) {
    assert.ok(bestaand.has(file), `${file} staat als bekend rood geregistreerd maar bestaat niet meer`);
    assert.ok(String(reden).trim().length > 10, `${file} heeft geen bruikbare reden`);
  }
});

export { BEKEND_ROOD };
