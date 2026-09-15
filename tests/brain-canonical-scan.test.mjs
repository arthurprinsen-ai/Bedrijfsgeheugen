import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeScanEnvelope,buildRuntimeEvent,SCAN_CONTRACT} from '../platform/scans/canonical-scan.mjs';
const valid={submission_key:'scan-20260915-abcdef',canonical:'https://www.bedrijfsgeheugen.nl/frisse-blik',scan:{score:67,niveau:3,dimAvg:{strategie:3.2,data:2.8}}};
test('canonical contract is stable',()=>assert.equal(SCAN_CONTRACT,'powerhouse-canonical-scan-loop-v1'));
test('public website data cannot assert verified company identity',()=>{const s=normalizeScanEnvelope({...valid,scan:{...valid.scan,company_key:'untrusted'}});assert.equal(s.companyKey,null);assert.equal(s.tenantIdentityStatus,'unverified');});
test('invalid score and foreign canonical fail closed',()=>{assert.throws(()=>normalizeScanEnvelope({...valid,scan:{...valid.scan,score:101}}),/INVALID_SCORE/);assert.throws(()=>normalizeScanEnvelope({...valid,canonical:'https://example.com/frisse-blik'}),/INVALID_CANONICAL/);});
test('runtime event is idempotent and aggregate-only until identity is verified',()=>{const e=buildRuntimeEvent(normalizeScanEnvelope(valid),'id-1','2026-09-15T18:00:00Z');assert.equal(e.dedupe_key,'scan:scan-20260915-abcdef');assert.equal(e.context.learning_scope,'aggregate_only');assert.equal(e.context.tenant_identity_status,'unverified');});
