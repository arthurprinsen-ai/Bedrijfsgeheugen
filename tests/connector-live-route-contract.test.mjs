import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const netlify = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
const portalFunction = readFileSync(new URL('../netlify/functions/portal-connectors.mjs', import.meta.url), 'utf8');

test('connector readiness has an explicit production route to the Netlify function', () => {
  assert.match(portalFunction, /path:\s*['"]\/api\/connectors\/\*['"]/);
  assert.match(
    netlify,
    /from\s*=\s*['"]\/api\/connectors\/\*['"][\s\S]*?to\s*=\s*['"]\/\.netlify\/functions\/portal-connectors['"][\s\S]*?status\s*=\s*200/,
    'netlify.toml must proxy /api/connectors/* to portal-connectors so the public route cannot silently 404'
  );
});
