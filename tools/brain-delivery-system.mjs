import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DEFAULT_AGENT_TEAM } from '../platform/agents/agent-team.mjs';

function unique(values) {
  return [...new Set(values)];
}

function matches(path, patterns = []) {
  return patterns.some(pattern => pattern.endsWith('/') ? path.startsWith(pattern) : path === pattern || path.startsWith(pattern));
}

export function deriveConflictContracts(paths = [], policy = {}) {
  const changed = unique(paths.map(value => String(value).trim()).filter(Boolean));
  return unique((policy.conflictContracts || [])
    .filter(contract => changed.some(path => matches(path, contract.paths || [])))
    .map(contract => String(contract.id || '').trim())
    .filter(Boolean))
    .sort();
}

export function evaluateBranchDrift({ featurePaths = [], mainDriftPaths = [], featureContracts = [], mainDriftContracts = [], mergeable = true } = {}) {
  const feature = unique(featurePaths.map(value => String(value).trim()).filter(Boolean)).sort();
  const drift = unique(mainDriftPaths.map(value => String(value).trim()).filter(Boolean)).sort();
  const driftSet = new Set(drift);
  const overlap = feature.filter(path => driftSet.has(path));
  const featureContractSet = new Set(unique(featureContracts.map(value => String(value).trim()).filter(Boolean)));
  const contractOverlap = unique(mainDriftContracts.map(value => String(value).trim()).filter(value => value && featureContractSet.has(value))).sort();
  if (!mergeable) return Object.freeze({ action:'SYNC_REQUIRED', reason:'merge-conflict', overlap:Object.freeze(overlap), contractOverlap:Object.freeze(contractOverlap) });
  if (overlap.length) return Object.freeze({ action:'SYNC_REQUIRED', reason:'changed-path-overlap', overlap:Object.freeze(overlap), contractOverlap:Object.freeze(contractOverlap) });
  if (contractOverlap.length) return Object.freeze({ action:'SYNC_REQUIRED', reason:'declared-contract-overlap', overlap:Object.freeze([]), contractOverlap:Object.freeze(contractOverlap) });
  return Object.freeze({ action:'KEEP_TESTED_FEATURE', reason:'non-overlapping-main-drift', overlap:Object.freeze([]), contractOverlap:Object.freeze([]) });
}

export function createDeliveryPlan({ changedPaths = [], headSha, policy }) {
  if (!policy || !['BRAIN-DELIVERY-v1','BRAIN-DELIVERY-v2'].includes(policy.version)) throw new TypeError('BRAIN-DELIVERY-v1 or BRAIN-DELIVERY-v2 policy is required');
  if (policy.branchPolicy?.rebuildOnMainDrift !== false) throw new Error('branch policy must prohibit rebuilds for generic main drift');
  const sha = String(headSha ?? '').trim();
  if (!/^[a-f0-9]{12,40}$/i.test(sha)) throw new TypeError('valid headSha is required');
  const paths = unique(changedPaths.map(value => String(value).trim()).filter(Boolean)).sort();
  const shared = paths.some(path => matches(path, policy.sharedPaths));
  const ignored = paths.filter(path => matches(path, policy.ignoredPaths));
  const lanes = policy.lanes
    .filter(lane => shared || paths.some(path => matches(path, lane.paths)))
    .map(lane => Object.freeze({
      id: lane.id,
      laneId: `${lane.id}|${sha.slice(0, 12)}`,
      candidateIdentity: sha,
      testedIdentity: sha,
      owner: lane.owner,
      requiredContracts: Object.freeze([...lane.requiredContracts]),
      independentPromotion: policy.version === 'BRAIN-DELIVERY-v2' && policy.integration?.independentPromotion === true,
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  const classified = paths.filter(path => shared || matches(path, policy.ignoredPaths) || policy.lanes.some(lane => matches(path, lane.paths)));
  const unclassified = paths.filter(path => !classified.includes(path));
  if (unclassified.length) throw new Error(`unclassified delivery path: ${unclassified.join(', ')}`);
  if (!lanes.length && paths.length !== ignored.length) throw new Error('delivery unit has no executable lane');

  return Object.freeze({
    contractVersion: policy.version,
    brainContractVersion: policy.brainContractVersion,
    traceId: `delivery|${sha.slice(0, 12)}`,
    headSha: sha,
    changedPaths: Object.freeze(paths),
    conflictContracts: Object.freeze(deriveConflictContracts(paths, policy)),
    ignoredPaths: Object.freeze(ignored),
    branchPolicy: Object.freeze({ ...policy.branchPolicy }),
    registration: Object.freeze({ ...(policy.registration || { required:false, autoDiscover:false }) }),
    lanes: Object.freeze(lanes),
    integration: Object.freeze({
      required: lanes.length > 0,
      owner: policy.integration.owner,
      dependsOn: Object.freeze(lanes.map(lane => lane.id)),
      singleCandidate: policy.integration.singleCandidate === true,
      independentPromotion: policy.integration.independentPromotion === true,
    }),
    production: Object.freeze({
      authority: policy.integration.productionAuthority,
      exactShaRequired: policy.integration.exactShaRequired === true,
      outcomeRouter: policy.integration.outcomeRouter,
      currentStateProjection: policy.integration.currentStateProjection,
      errorLedger: policy.integration.errorLedger || 'BG166',
    }),
  });
}

export function evaluateNetlifyDeploySource({ gitDir, gitCommonDir, headSha, expectedSha, treeSha }) {
  const actualHead = String(headSha ?? '').trim();
  const expectedHead = String(expectedSha ?? '').trim();
  const tree = String(treeSha ?? '').trim();
  if (!/^[a-f0-9]{40}$/i.test(actualHead) || !/^[a-f0-9]{40}$/i.test(expectedHead) || !/^[a-f0-9]{40}$/i.test(tree)) throw new TypeError('full headSha, expectedSha and treeSha are required');
  if (actualHead !== expectedHead) return Object.freeze({ ok:false, state:'DEPLOY_SOURCE_REJECTED', action:'CHECKOUT_EXACT_SHA', reason:'head_sha_mismatch' });
  const actualGitDir = resolve(String(gitDir ?? '').trim());
  const commonGitDir = resolve(String(gitCommonDir ?? '').trim());
  if (actualGitDir !== commonGitDir) return Object.freeze({ ok:false, state:'DEPLOY_SOURCE_REJECTED', action:'STAGE_STANDALONE_EXACT_SHA', reason:'linked_git_worktree' });
  return Object.freeze({ ok:true, state:'DEPLOY_SOURCE_READY', action:'DEPLOY_EXACT_SHA', headSha:actualHead, treeSha:tree });
}

export function discoverBrainMembership({ registeredComponents = [], agents = [], workflows = [] }) {
  const rows = [];
  for (const component of registeredComponents) rows.push({ componentKey:`brain:${component.key}`, kind:'BRAIN_COMPONENT', active:component.status === 'active' });
  for (const agent of agents) rows.push({ componentKey:`agent:${agent.id}`, kind:'AGENT', active:true });
  for (const workflow of workflows) rows.push({ componentKey:`github-workflow:${basename(workflow).replace(/\.ya?ml$/i, '')}`, kind:'DELIVERY_SCENARIO', active:true });
  const seen = new Set();
  return Object.freeze(rows.map(row => {
    if (seen.has(row.componentKey)) throw new Error(`duplicate Brain member: ${row.componentKey}`);
    seen.add(row.componentKey);
    return Object.freeze({ ...row, brainContractVersion:'brain.v1', deliveryContractVersion:'BRAIN-DELIVERY-v2', sharedContextRequired:true, outcomeWritebackRequired:true, costManaged:true, securityGoverned:true, productionAuthority:'BG169' });
  }).sort((left, right) => left.componentKey.localeCompare(right.componentKey)));
}

async function repositoryMembership() {
  const registry = JSON.parse(await readFile('docs/brain/component-registry.json', 'utf8'));
  const workflowNames = (await readdir('.github/workflows')).filter(name => /\.ya?ml$/i.test(name)).map(name => `.github/workflows/${name}`);
  return discoverBrainMembership({ registeredComponents:registry.components, agents:DEFAULT_AGENT_TEAM, workflows:workflowNames });
}

function argValue(args, name, fallback = '') {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

function gitDiffNames(range) {
  return execFileSync('git', ['diff', '--name-only', range], { encoding:'utf8' }).split(/\r?\n/).filter(Boolean);
}

async function main() {
  const [command = 'plan', ...args] = process.argv.slice(2);
  await mkdir('.artifacts', { recursive: true });
  if (command === 'deploy-preflight') {
    const expectedSha = argValue(args, '--sha');
    const result = evaluateNetlifyDeploySource({
      gitDir: execFileSync('git', ['rev-parse', '--git-dir'], { encoding:'utf8' }).trim(),
      gitCommonDir: execFileSync('git', ['rev-parse', '--git-common-dir'], { encoding:'utf8' }).trim(),
      headSha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding:'utf8' }).trim(),
      expectedSha,
      treeSha: execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { encoding:'utf8' }).trim(),
    });
    await writeFile('.artifacts/netlify-deploy-source.json', `${JSON.stringify(result, null, 2)}\n`);
    const output = `${JSON.stringify(result)}\n`;
    if (!result.ok) { process.stderr.write(output); process.exitCode = 1; return; }
    process.stdout.write(output); return;
  }
  if (command === 'membership') {
    const membership = await repositoryMembership();
    await writeFile('.artifacts/brain-membership.json', `${JSON.stringify({ generatedAt:new Date().toISOString(), components:membership }, null, 2)}\n`);
    process.stdout.write(`${JSON.stringify({ ok:true, components:membership.length })}\n`); return;
  }
  if (command === 'branch-drift') {
    const base = argValue(args, '--base');
    const head = argValue(args, '--head');
    const currentMain = argValue(args, '--current-main');
    if (!base || !head || !currentMain) throw new Error('branch-drift requires --base, --head and --current-main');
    const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
    const featurePaths = gitDiffNames(`${base}...${head}`);
    const mainDriftPaths = base === currentMain ? [] : gitDiffNames(`${base}..${currentMain}`);
    const featureContracts = deriveConflictContracts(featurePaths, policy);
    const mainDriftContracts = deriveConflictContracts(mainDriftPaths, policy);
    const result = evaluateBranchDrift({ featurePaths, mainDriftPaths, featureContracts, mainDriftContracts, mergeable:true });
    const evidence = { ...result, base, head, currentMain, featureContracts, mainDriftContracts };
    await writeFile('.artifacts/brain-branch-drift.json', `${JSON.stringify(evidence, null, 2)}\n`);
    process.stdout.write(`${JSON.stringify(evidence)}\n`);
    if (result.action === 'SYNC_REQUIRED') process.exitCode = 42;
    return;
  }
  if (command !== 'plan') throw new Error(`unknown command: ${command}`);
  const base = argValue(args, '--base', 'HEAD^');
  const head = argValue(args, '--head', 'HEAD');
  const headSha = execFileSync('git', ['rev-parse', head], { encoding:'utf8' }).trim();
  const baseSha = execFileSync('git', ['rev-parse', base], { encoding:'utf8' }).trim();
  const changedPaths = gitDiffNames(`${base}...${head}`);
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const plan = createDeliveryPlan({ changedPaths, headSha, policy });
  await writeFile('.artifacts/brain-delivery-plan.json', `${JSON.stringify({ ...plan, baseSha }, null, 2)}\n`);
  const matrix = JSON.stringify({ include:plan.lanes.map(lane => ({ id:lane.id, lane_id:lane.laneId, candidate_identity:lane.candidateIdentity })) });
  if (process.env.GITHUB_OUTPUT) {
    const { appendFile } = await import('node:fs/promises');
    await appendFile(process.env.GITHUB_OUTPUT, `matrix=${matrix}\ntrace_id=${plan.traceId}\nbase_sha=${baseSha}\nhead_sha=${headSha}\n`);
  }
  process.stdout.write(`${JSON.stringify({ ok:true, traceId:plan.traceId, baseSha, headSha, matrix:JSON.parse(matrix) })}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { process.stderr.write(`${JSON.stringify({ ok:false, error:error.message })}\n`); process.exitCode = 1; });
