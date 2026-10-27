import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('.github/workflows/production-release-readback.yml','utf8');

test('production readback can be explicitly re-run on exact current main',()=>{
  assert.match(source,/workflow_dispatch:/);
  assert.match(source,/EVENT_NAME: \$\{\{ github\.event_name \}\}/);
  assert.match(source,/manualReadback=process\.env\.EVENT_NAME === 'workflow_dispatch'/);
  // A manual dispatch forces browser proof through the shared applicability module.
  assert.match(source,/forceBrowser:manualReadback/);
  assert.match(source,/const \{[^}]*browserRequired[^}]*\}=applicability;/);
  assert.match(source,/\(readbackWorkflowChanged \|\| manualReadback\) && !routes\.includes\('\/prijzen'\)\) routes\.push\('\/prijzen'\)/);
  assert.match(source,/Verify pricing interactions and English route in production/);
});
