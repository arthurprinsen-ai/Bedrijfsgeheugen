import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { deriveNetlifyDeploymentApplicability } from '../delivery/netlify-deployment-applicability.mjs';

const cached = String(process.env.CACHED_COMMIT_REF || '').trim();
const commit = String(process.env.COMMIT_REF || '').trim();

function failOpen(reason) {
  console.log(`NETLIFY_BUILD_REQUIRED: ${reason}`);
  process.exit(1);
}

if (!cached || !commit || cached === commit) {
  failOpen('missing, invalid or identical Netlify commit refs');
}

let changed;
try {
  changed = execFileSync('git', ['diff', '--name-only', cached, commit], { encoding: 'utf8' })
    .split(/\r?\n/)
    .map(value => value.trim())
    .filter(Boolean);
} catch (error) {
  failOpen(`git diff failed: ${error instanceof Error ? error.message : String(error)}`);
}

if (changed.length === 0) {
  console.log('NETLIFY_BUILD_SKIPPED: no changed paths');
  process.exit(0);
}

try {
  const policy=JSON.parse(readFileSync('config/brain-delivery-system.json','utf8'));
  const applicability=deriveNetlifyDeploymentApplicability({changedPaths:changed,headSha:commit,policy});
  if(applicability.deploymentRequired){
    console.log(`NETLIFY_BUILD_REQUIRED: ${applicability.reason}: ${applicability.runtimeChangedPaths.join(', ')}`);
    process.exit(1);
  }
  console.log(`NETLIFY_BUILD_SKIPPED: ${applicability.reason}: ${changed.join(', ')}`);
  process.exit(0);
} catch (error) {
  failOpen(`applicability classification failed: ${error instanceof Error ? error.message : String(error)}`);
}
