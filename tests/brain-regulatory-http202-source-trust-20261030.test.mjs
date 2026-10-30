import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

test('HTTP 202, empty pages and HTML challenges never promote a legal source baseline',()=>{
 const output=execFileSync('python3',['tests/brain-regulatory-source-trust-fixtures.py'],{encoding:'utf8',timeout:25000});
 assert.match(output,/REGULATORY_HTTP202_TRUST_GATE_PASSED/);
});

test('original Brain ingest retains raw diagnostic but never declares untrusted 202 as fresh authority',()=>{
 const ingest=readFileSync('tools/regulatory-brain-ingest.py','utf8');
 const monitor=readFileSync('tools/regulatory-source-monitor.py','utf8');
 assert.match(ingest,/meta\.get\('observationTrusted'\) is True/);
 assert.match(ingest,/freshness_heartbeat/);
 assert.match(ingest,/unverified_reason/);
 assert.match(ingest,/powerhouse_record_source_observation_v1/);
 assert.match(monitor,/unverified_response_reason/);
 assert.match(monitor,/REGULATORY_SOURCE_ID_INVALID/);
 assert.match(monitor,/out\['sources'\]\[source_id\]=previous/);
 assert.match(monitor,/raw_path\.write_bytes\(result\['raw'\]\)/);
});
