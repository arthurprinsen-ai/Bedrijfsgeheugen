import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
const website = policy.lanes.find((lane) => lane.id === 'website');
const shell = policy.conflictContracts.find((contract) => contract.id === 'website-shell-contract');

assert.ok(website, 'website delivery lane must exist');
assert.ok(website.paths.includes('.github/canoniek/'), 'canonical shell sources must classify as website delivery');
assert.ok(shell, 'website-shell conflict contract must exist');
assert.ok(shell.paths.includes('.github/canoniek/'), 'canonical shell sources must participate in shell conflict detection');

console.log('Kennis canonical delivery classifier: OK');
