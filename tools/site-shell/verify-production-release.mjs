import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

function validSha(value) { return /^[0-9a-f]{40}$/i.test(String(value || '')); }

export function evaluateProductionReadback({ mergeSha, deployedSha, deployStatus, routesOk } = {}) {
  if (!validSha(mergeSha) || !validSha(deployedSha)) throw new TypeError('mergeSha and deployedSha must be 40-character Git SHAs');
  if (mergeSha.toLowerCase() !== deployedSha.toLowerCase()) return Object.freeze({ status:'RELEASE_INCOMPLETE', reason:'production_sha_mismatch' });
  if (String(deployStatus).toLowerCase() !== 'ready') return Object.freeze({ status:'RELEASE_INCOMPLETE', reason:'production_not_ready' });
  if (routesOk !== true) return Object.freeze({ status:'PRODUCTION_RED', reason:'production_route_regression' });
  return Object.freeze({ status:'LIVE_VERIFIED', reason:'exact_sha_and_routes_verified' });
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[i + 1];
  return out;
}

export async function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const routes = JSON.parse(args['routes-json'] || '[]');
  const routesOk = String(args['routes-ok']).toLowerCase() === 'true';
  const result = evaluateProductionReadback({ mergeSha:args['merge-sha'], deployedSha:args['deployed-sha'], deployStatus:args['deploy-status'], routesOk });
  const evidence = { merge_sha:args['merge-sha'], deployed_sha:args['deployed-sha'], deploy_status:args['deploy-status'], routes, routes_ok:routesOk, ...result };
  const output = args.output || '.artifacts/production-release-readback.json';
  await mkdir(dirname(output), { recursive:true });
  await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  if (result.status !== 'LIVE_VERIFIED') process.exitCode = 1;
  return evidence;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) runCli().catch(error => { console.error(error); process.exitCode = 1; });
