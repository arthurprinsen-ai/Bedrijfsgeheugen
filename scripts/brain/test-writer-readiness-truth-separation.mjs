import fs from 'node:fs';
import assert from 'node:assert/strict';
import { computeWriterMigrationReady } from './writer-certification-state.mjs';

const state=JSON.parse(fs.readFileSync('config/repository-writer-migration.json','utf8'));
assert.equal(Object.hasOwn(state,'mainProtectionReady'),false,'writer migration state must not claim native GitHub protection');
assert.equal(state.writerMigrationReady,computeWriterMigrationReady(state.writers),'writerMigrationReady must be evidence-derived');
const observation=fs.readFileSync('.github/workflows/main-protection-observation.yml','utf8');
assert.match(observation,/certifyMainProtection/,'native main protection must remain direct-observation certified');
assert.match(observation,/branches\/main/,'native main branch must be read directly from GitHub');
console.log('PASS writer migration readiness is separate from native GitHub main protection');
