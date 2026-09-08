import test from 'node:test';
import assert from 'node:assert/strict';
import readinessHandler,{config} from '../netlify/functions/connector-readiness.mjs';

test('connector readiness has an exact production route and exposes capability state only', async () => {
  assert.equal(config.path,'/api/connectors/readiness');

  const response=await readinessHandler();
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-type')||'',/^application\/json/);

  const body=await response.json();
  assert.equal(typeof body,'object');
  assert.ok(body.sources);
  assert.ok(body.targets);
  assert.ok(body.extractor);

  const serialized=JSON.stringify(body);
  assert.equal(/SECRET|TOKEN|PASSWORD|API_KEY/i.test(serialized),false);
});
