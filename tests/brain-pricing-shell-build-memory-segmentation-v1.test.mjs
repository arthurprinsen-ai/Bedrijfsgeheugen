import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/prijzen-uit-de-homepage.mjs','utf8');

test('pricing shell all-mode releases memory between heavy build phases',()=>{
  assert.match(source,/import \{ spawn \} from 'node:child_process'/);
  assert.match(source,/async function runStageInFreshProcess\(nextStage\)/);
  assert.match(source,/spawn\(process\.execPath, \[process\.argv\[1\]\]/);
  assert.match(source,/BG_PRICING_STAGE: nextStage/);
  assert.match(source,/for \(const nextStage of \['rewrite', 'normalize', 'verify'\]\)/);
  assert.match(source,/await runStageInFreshProcess\(nextStage\)/);
  assert.match(source,/await voerPricingShellPipelineUit\(stage\)/);
  assert.match(source,/pricing shell stage \$\{nextStage\} failed/);
});
