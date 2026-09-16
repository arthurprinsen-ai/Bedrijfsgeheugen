import test from 'node:test'; import assert from 'node:assert/strict'; import {evaluateExplorationAction,normalizeFinding} from '../scripts/brain/quality/exploration-policy.mjs';
test('production mutation is forbidden',()=>assert.equal(evaluateExplorationAction({method:'POST',target:'production'}).allowed,false));
test('candidate finding cannot be release evidence',()=>assert.equal(normalizeFinding({source:'ai'}).release_evidence,false));
