import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const worker = readFileSync('netlify/functions/powerhouse-external-cron-reconciler.mjs','utf8');
const gateway = readFileSync('supabase/migrations/20261014143000_external_cron_reconcile_gateway.sql','utf8');

test('external recovery is scheduled outside PostgreSQL cron', () => {
 assert.match(worker, /schedule:\s*["']\*\/15 \* \* \* \*["']/);
 assert.match(worker, /powerhouse_external_cron_reconcile_v1/);
});
test('recovery is bounded and errors propagate', () => {
 assert.match(worker, /AbortController/);
 assert.match(worker, /18000/);
 assert.match(worker, /if \(!response\.ok\) throw/);
});
test('gateway is restricted to service role and does not replay sends', () => {
 assert.match(gateway, /request\.jwt\.claim\.role/);
 assert.match(gateway, /service_role/);
 assert.match(gateway, /revoke all on function/);
 assert.match(gateway, /reconcile_cron_failures/);
 assert.doesNotMatch(worker, /sendMail|sendEmail|sendMessage|sendLinkedinDm|provider\.send/);
});
