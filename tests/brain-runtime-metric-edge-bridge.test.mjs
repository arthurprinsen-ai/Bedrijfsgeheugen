import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const sourceUrl=new URL('../netlify/functions/brain-runtime-metric.mjs',import.meta.url);

test('RUM Netlify function forwards authenticated metrics to managed ingest without local database superuser credentials',async()=>{
 const source=await readFile(sourceUrl,'utf8');
 assert.ok(source.includes('BRAIN_RUNTIME_METRIC_INGEST_URL'),'managed ingest endpoint must be configured explicitly');
 assert.ok(source.includes("request.headers.get('authorization')")||source.includes('request.headers.get("authorization")'),'original user bearer token must be forwarded for independent verification');
 assert.equal(source.includes('SUPABASE_SERVICE_ROLE_KEY'),false,'Netlify must not require Supabase service-role credentials');
 assert.equal(source.includes("/rest/v1/brain_runtime_metrics"),false,'Netlify must not write the canonical metrics table directly');
});
