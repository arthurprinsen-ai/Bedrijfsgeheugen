import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=(p)=>readFileSync(resolve(root,p),'utf8');
test('original Portal V2 skill requires versioned ONE BRAIN incident validation and authenticated proof',()=>{
 const s=source('.agents/skills/portal-living-interface/SKILL.md');
 assert.match(s,/brain_promote_failure\(p_fingerprint, p_expected_version/);
 assert.match(s,/OBSERVED → VALIDATED/);
 assert.match(s,/VALIDATED → PROVEN/);
 assert.match(s,/FAILURE_VERSION_CONFLICT/);
 assert.match(s,/authenticated admin browser readback/i);
 assert.match(s,/actual root cause|verified root cause/);
 assert.match(s,/EVIDENCE_DUE/);
 assert.match(s,/No direct unsafe SQL UPDATE/);
 assert.match(s,/no new incident store or scheduler/);
});
test('original incident-specific learning contract retains no false PROVEN and historical evidence',()=>{
 const p=JSON.parse(source('brain/learning/2026-11-02-portal-ux-incident-validation-writeback-v1.json'));
 assert.equal(p.parent_issue,4547);
 assert.equal(p.fingerprint,'portal|living-interface|newer-source-deployed-status-falls-through-allowlist|20261102-v1');
 assert.equal(p.validation.maturity,'VALIDATED');
 assert.equal(p.validation.authenticated_admin_browser_readback,'EVIDENCE_DUE');
 assert.equal(p.validation.occurrence_count,1);
 assert.ok(p.prevention_rules.some(x=>x.includes('version-checked')));
 assert.ok(!JSON.stringify(p).includes('ALL_GREEN'));
});
