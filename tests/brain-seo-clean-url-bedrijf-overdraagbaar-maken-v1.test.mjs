import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('bedrijf-overdraagbaar-maken html route redirects canonically', async()=>{
  const toml=await readFile('netlify.toml','utf8');
  const block=/\[\[redirects\]\]\s*from\s*=\s*"\/bedrijf-overdraagbaar-maken\.html"\s*to\s*=\s*"\/bedrijf-overdraagbaar-maken"\s*status\s*=\s*301\s*force\s*=\s*true/s;
  assert.match(toml,block);
});
