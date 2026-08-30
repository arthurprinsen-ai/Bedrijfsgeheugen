import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DEFAULT_AGENT_TEAM } from '../platform/agents/agent-team.mjs';

function unique(values) {
  return [...new Set(values)];
}

function matches(path, patterns = []) {
  return patterns.some(pattern => pattern.endsWith('/') ? path.startsWith(pattern) : path === pattern || path.startsWith(pattern));
}

export function createDeliveryPlan({ changedPaths = [], headSha, policy }) {
  if (!policy || policy.version !== 'BRAIN-DELIVERY-v1') throw new TypeError('BRAIN-DELIVERY-v1 policy is required');
  const sha = String(headSha ?? '').trim();
  if (!/^[a-f0-9]{12,40}$/i.test(sha)) throw new TypeError('valid headSha is required');
  const paths = unique(changedPaths.map(value => String(value).trim()).filter(Boolean)).sort();
  const shared = paths.some(path => matches(path, policy.sharedPaths));
  const ignored = paths.filter(path => matches(path, policy.ignoredPaths));
  const lanes = policy.lanes
    .filter(lane => shared || paths.some(path => matches(path, lane.paths)))
    .map(lane => Object.freeze({
      id: lane.id,
      owner: lane.owner,
      requiredContracts: Object.freeze([...lane.requiredContracts]),
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
    ignoredPaths: Object.freeze(ignored),
    lanes: Object.freeze(lanes),
    integration: Object.freeze({
      required: lanes.length > 0,
      owner: policy.integration.owner,
      dependsOn: Object.freeze(lanes.map(lane => lane.id)),
      singleCandidate: policy.integration.singleCandidate === true,
    }),
    production: Object.freeze({
      authority: policy.integration.productionAuthority,
      exactShaRequired: policy.integration.exactShaRequired === true,
      outcomeRouter: policy.integration.outcomeRouter,
      currentStateProjection: policy.integration.currentStateProjection,
    }),
  });
}

export function discoverBrainMembership({ registeredComponents = [], agents = [], workflows = [] }) {
  const rows = [];
  for (const component of registeredComponents) {
    rows.push({ componentKey: `brain:${component.key}`, kind: 'BRAIN_COMPONENT', active: component.status === 'active' });
  }
  for (const agent of agents) {
    rows.push({ componentKey: `agent:${agent.id}`, kind: 'AGENT', active: true });
  }
  for (const workflow of workflows) {
    rows.push({
      componentKey: `github-workflow:${basename(workflow).replace(/\.ya?ml$/i, '')}`,
      kind: 'DELIVERY_SCENARIO',
      active: true,
    });
  }
  const seen = new Set();
  return Object.freeze(rows.map(row => {
    if (seen.has(row.componentKey)) throw new Error(`duplicate Brain member: ${row.componentKey}`);
    seen.add(row.componentKey);
    return Object.freeze({
      ...row,
      brainContractVersion: 'brain.v1',
      sharedContextRequired: true,
      outcomeWritebackRequired: true,
      costManaged: true,
      securityGoverned: true,
      productionAuthority: 'BG169',
    });
  }).sort((left, right) => left.componentKey.localeCompare(right.componentKey)));
}

async function repositoryMembership() {
  const registry = JSON.parse(await readFile('docs/brain/component-registry.json', 'utf8'));
  const workflowNames = (await readdir('.github/workflows'))
    .filter(name => /\.ya?ml$/i.test(name))
    .map(name => `.github/workflows/${name}`);
  return discoverBrainMembership({
    registeredComponents: registry.components,
    agents: DEFAULT_AGENT_TEAM,
    workflows: workflowNames,
  });
}

async function main() {
  const [command = 'plan', ...args] = process.argv.slice(2);
  await mkdir('.artifacts', { recursive: true });
  if (command === 'membership') {
    const membership = await repositoryMembership();
    await writeFile('.artifacts/brain-membership.json', `${JSON.stringify({ generatedAt: new Date().toISOString(), components: membership }, null, 2)}\n`);
    process.stdout.write(`${JSON.stringify({ ok: true, components: membership.length })}\n`);
    return;
  }
  if (command !== 'plan') throw new Error(`unknown command: ${command}`);
  const baseIndex = args.indexOf('--base');
  const headIndex = args.indexOf('--head');
  const base = baseIndex >= 0 ? args[baseIndex + 1] : 'HEAD^';
  const head = headIndex >= 0 ? args[headIndex + 1] : 'HEAD';
  const headSha = execFileSync('git', ['rev-parse', head], { encoding: 'utf8' }).trim();
  const changedPaths = execFileSync('git', ['diff', '--name-only', `${base}...${head}`], { encoding: 'utf8' })
    .split(/\r?\n/).filter(Boolean);
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const plan = createDeliveryPlan({ changedPaths, headSha, policy });
  await writeFile('.artifacts/brain-delivery-plan.json', `${JSON.stringify(plan, null, 2)}\n`);
  const matrix = JSON.stringify({ include: plan.lanes.map(lane => ({ id: lane.id })) });
  if (process.env.GITHUB_OUTPUT) {
    const { appendFile } = await import('node:fs/promises');
    await appendFile(process.env.GITHUB_OUTPUT, `matrix=${matrix}\ntrace_id=${plan.traceId}\n`);
  }
  process.stdout.write(`${JSON.stringify({ ok: true, traceId: plan.traceId, matrix: JSON.parse(matrix) })}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
    process.exitCode = 1;
  });
}
