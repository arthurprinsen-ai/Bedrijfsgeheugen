import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const hygiene=readFileSync(new URL('../.github/workflows/powerhouse-delivery-hygiene.yml',import.meta.url),'utf8');
const required=readFileSync(new URL('../.github/workflows/required-test.yml',import.meta.url),'utf8');
test('original required gate already invokes protected hygiene before costly preflight',()=>{
 assert.match(required,/hygiene:[\s\S]*?uses: \.\/\.github\/workflows\/powerhouse-delivery-hygiene\.yml/);
 assert.match(required,/preflight:\s*\n\s*needs: hygiene/);
 assert.match(hygiene,/const trustedFtrSha = currentMainSha/);
 assert.match(hygiene,/trustedFtrName = 'tools\/delivery\/first-time-right-prebuild-gate\.mjs'/);
 assert.match(hygiene,/sh\('git','show',`\$\{trustedFtrSha\}:\$\{trustedFtrName\}`\)/);
 assert.match(hygiene,/pathToFileURL\(trustedFtrPath\)\.href/);
 assert.doesNotMatch(hygiene,/import\s+\{\s*evaluateFirstTimeRightPrebuild\s*\}\s+from\s+'\.\/tools/);
});
test('new prebuild evaluation executes before original writer lease and high-cost CI',()=>{
 const start=hygiene.indexOf('const firstTimeRight = await evaluateFirstTimeRightPrebuild({');
 const lease=hygiene.indexOf('const lease = evaluateWriterLease({');
 assert.ok(start>0&&lease>start,'existing original preflight must run earlier than lease');
 assert.match(hygiene,/sh\('git','fetch','--no-tags','--depth=1','origin',trustedFtrSha\)/);
 assert.match(hygiene,/const stat = await lstat\(candidatePath\)/);
 assert.match(hygiene,/FTR_SOURCE_NOT_REGULAR_FILE/);
});
test('failure retains stable original fingerprint, provider prohibition and diagnostic artifact',()=>{
 assert.match(hygiene,/first_time_right: firstTimeRightFailure/);
 assert.match(hygiene,/first_time_right_prebuild: firstTimeRight\.ok/);
 assert.match(hygiene,/\.artifacts\/powerhouse-prebuild-evidence\.json/);
 assert.match(hygiene,/if\(!firstTimeRight\.ok\)/);
 assert.match(hygiene,/FIRST_TIME_RIGHT_PREBUILD_BLOCKED/);
 assert.match(hygiene,/firstTimeRightFailure\?\.fingerprint/);
 assert.match(hygiene,/Upload admission evidence/);
});
