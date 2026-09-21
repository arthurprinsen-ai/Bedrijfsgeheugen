import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const scheduled=readFileSync(new URL('../netlify/functions/powerhouse-composio-secret-sync.mjs',import.meta.url),'utf8');
const event=readFileSync(new URL('../netlify/functions/powerhouse-composio-secret-sync-deploy.mjs',import.meta.url),'utf8');

test('Composio secret sync is reusable by the platform deploy event',()=>{
  assert.match(scheduled,/export async function syncComposioSecret\(\)/);
  assert.match(scheduled,/export default async \(\)=>syncComposioSecret\(\)/);
  assert.match(event,/deploySucceeded\(event\)/);
  assert.match(event,/event\?\.deploy\?\.context !== 'production'/);
  assert.match(event,/await syncComposioSecret\(\)/);
});

test('deploy event introduces no public path and no second publisher',()=>{
  assert.doesNotMatch(event,/config\s*=\s*\{[^}]*path/);
  assert.doesNotMatch(event,/powerhouse-social-publisher/);
  assert.doesNotMatch(event,/COMPOSIO_API_KEY/);
});
