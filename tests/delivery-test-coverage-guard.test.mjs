import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

/**
 * Deze bewaking bestaat om één stil probleem zichtbaar te houden.
 *
 * CI draait niet `node --test tests/`, maar per lane een expliciete lijst met
 * testbestanden. Een GECOMMIT testbestand dat in geen enkele workflow genoemd
 * wordt, draait dus nooit — het staat er, het lijkt bewaking, en het bewaakt niets.
 *
 * Alleen Git-tracked testbestanden tellen als canonieke CI-verplichting.
 * Tijdelijke fixtures die een parallelle test onder tests/ aanmaakt, mogen deze
 * guard niet nondeterministisch rood maken.
 */

const WORKFLOW_DIR = '.github/workflows';
const TEST_DIRS = ['tests', 'portal-v2/tests'];

const BEKEND_ROOD = Object.freeze({
  'tests/social-learning-evaluate.test.mjs': 'bij commerciele tegenspraak schrijft de evaluator helemaal geen learning weg; de test verwacht een niet-PROVEN learning op effectMetric revenue'
});

function trackedTestFiles() {
  const raw = execFileSync(
    'git',
    ['ls-files', '-z', '--', 'tests/*.test.mjs', 'portal-v2/tests/*.test.mjs'],
    { encoding: 'utf8' }
  );
  return raw.split('\0').map(value => value.trim()).filter(Boolean).sort();
}

function referencedTestFiles() {
  const referenced = new Set();
  const tracked = trackedTestFiles();
  for (const file of readdirSync(WORKFLOW_DIR)) {
    if (!file.endsWith('.yml') && !file.endsWith('.yaml')) continue;
    const source = readFileSync(`${WORKFLOW_DIR}/${file}`, 'utf8');
    for (const match of source.matchAll(/(?:portal-v2\/)?tests\/[A-Za-z0-9_.*-]+\.test\.mjs/g)) {
      const pattern = match[0];
      if (!pattern.includes('*')) { referenced.add(pattern); continue; }
      const regex = new RegExp(`^${pattern.replace(/[.]/g, '\\.').replace(/\//g, '\\/').replace(/\*/g, '[A-Za-z0-9_.-]*')}$`);
      for (const candidate of tracked) if (regex.test(candidate)) referenced.add(candidate);
    }
  }
  return referenced;
}

function allTestFiles() {
  return trackedTestFiles();
}

test('elk gecommit testbestand wordt door minstens één workflow gedraaid', () => {
  const referenced = referencedTestFiles();
  const orphans = allTestFiles().filter(file => !referenced.has(file) && !(file in BEKEND_ROOD));
  assert.deepEqual(
    orphans, [],
    `deze gecommitte testbestanden draaien nergens in CI en bewaken dus niets:\n  ${orphans.join('\n  ')}\n` +
    'Voeg ze toe aan een lane in .github/workflows/, of zet ze met een reden in BEKEND_ROOD.'
  );
});

test('tijdelijke niet-gecommit testfixtures creëren geen CI coverage-verplichting', () => {
  const tracked = new Set(allTestFiles());
  assert.equal(tracked.has('tests/terminal-obligation-boundary.test.mjs'), false);
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

test('Powerhouse scan production proof voert controlled write + idempotency altijd uit', () => {
  const workflow = readFileSync('.github/workflows/powerhouse-scan-production-proof.yml', 'utf8');
  assert.match(workflow, /Controlled canonical write and idempotency proof/);
  assert.doesNotMatch(
    workflow,
    /contains\(github\.event\.head_commit\.message,\s*'\[scan-e2e\]'\)/,
    'controlled canonical write/idempotency proof mag niet afhankelijk zijn van een optionele commitmarker'
  );
});

test('Powerhouse scan production proof kan niet rood eindigen zonder foutannotatie', () => {
  const workflow = readFileSync('.github/workflows/powerhouse-scan-production-proof.yml', 'utf8');
  assert.match(
    workflow,
    /::error::/,
    'powerhouse-scan-production-proof.yml moet bij failure een ::error::-annotatie met oorzaak produceren'
  );
});

export { BEKEND_ROOD };
