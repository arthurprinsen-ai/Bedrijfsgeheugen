import { appendFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

function unique(values = []) { return [...new Set(values)]; }
function matchPath(path, pattern) {
  return pattern.endsWith('/') ? path.startsWith(pattern) : path === pattern || path.startsWith(pattern);
}
function matchesAny(path, patterns = []) { return patterns.some(pattern => matchPath(path, pattern)); }

export function createAdaptiveDeliveryPlan({ changedPaths = [], policy } = {}) {
  if (!policy || policy.version !== 'POWERHOUSE-ADAPTIVE-DELIVERY-v1') {
    throw new TypeError('POWERHOUSE-ADAPTIVE-DELIVERY-v1 policy is required');
  }
  const paths = unique(changedPaths.map(v => String(v).trim()).filter(Boolean)).sort();
  if (!paths.length) {
    return Object.freeze({
      version: policy.version,
      risk: 'R0',
      hot: false,
      capabilities: Object.freeze([]),
      tests: Object.freeze([...policy.alwaysTests]),
      fullSharedSuite: false,
      unknownPaths: Object.freeze([])
    });
  }

  const riskOrder = ['R0','R1','R2','R3','R4'];
  let risk = 'R0';
  const matchedRiskPaths = new Set();
  for (const path of paths) {
    let pathRisk = null;
    let bestSpecificity = -1;
    for (const rule of policy.riskRules || []) {
      for (const pattern of rule.paths || []) {
        if (!matchPath(path, pattern)) continue;
        const specificity = String(pattern).replace(/\*+/g, '').length;
        if (specificity > bestSpecificity) {
          bestSpecificity = specificity;
          pathRisk = rule.risk;
        }
      }
    }
    if (pathRisk) matchedRiskPaths.add(path);
    // Unknown executable surfaces fail closed into R3 instead of receiving a cheap lane.
    if (!pathRisk) pathRisk = 'R3';
    if (riskOrder.indexOf(pathRisk) > riskOrder.indexOf(risk)) risk = pathRisk;
  }

  const capabilities = [];
  const tests = new Set(policy.alwaysTests || []);
  const capabilityMatchedPaths = new Set();
  for (const capability of policy.capabilities || []) {
    const matching = paths.filter(path => matchesAny(path, capability.paths || []));
    if (!matching.length) continue;
    capabilities.push(capability.id);
    matching.forEach(path => capabilityMatchedPaths.add(path));
    for (const test of capability.tests || []) tests.add(test);
  }

  const unknownPaths = paths.filter(path => !matchedRiskPaths.has(path) && !capabilityMatchedPaths.has(path));
  const hot = paths.some(path => matchesAny(path, policy.hotPaths || []));
  if (hot && riskOrder.indexOf(risk) < riskOrder.indexOf('R2')) risk = 'R2';

  return Object.freeze({
    version: policy.version,
    risk,
    hot,
    capabilities: Object.freeze(unique(capabilities).sort()),
    tests: Object.freeze([...tests].sort()),
    fullSharedSuite: policy.riskLevels?.[risk]?.fullSharedSuite !== false,
    unknownPaths: Object.freeze(unknownPaths.sort())
  });
}

export async function loadAdaptiveDeliveryPolicy(path = 'config/powerhouse-adaptive-delivery-v1.json') {
  return JSON.parse(await readFile(path, 'utf8'));
}


function argValue(args, name, fallback = '') {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
}

async function main() {
  const args = process.argv.slice(2);
  const base = argValue(args, '--base', 'HEAD^');
  const head = argValue(args, '--head', 'HEAD');
  const changedPaths = execFileSync('git', ['diff','--name-only',`${base}...${head}`], { encoding:'utf8' })
    .split(/\r?\n/).filter(Boolean);
  const policy = await loadAdaptiveDeliveryPolicy();
  const plan = createAdaptiveDeliveryPlan({ changedPaths, policy });
  const payload = { ...plan, base, head, changedPaths };
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT,
      `risk=${plan.risk}\nfull_shared_suite=${plan.fullSharedSuite}\nhot=${plan.hot}\ntests_json=${JSON.stringify(plan.tests)}\ncapabilities_json=${JSON.stringify(plan.capabilities)}\n`);
  }
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    process.stderr.write(`${JSON.stringify({ok:false,error:error.message})}\n`);
    process.exitCode = 1;
  });
}
