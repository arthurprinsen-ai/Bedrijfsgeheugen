import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

function validSha(value) { return /^[0-9a-f]{40}$/i.test(String(value || '')); }
function validArtifactId(value) { return /^sha256:[0-9a-f]{64}$/i.test(String(value || '').trim()); }

export function evaluateProductionReadback({
  mergeSha,
  deployedSha,
  deployStatus,
  deployId,
  routesOk,
  deploymentRequired = true,
  supersessionSafe = false,
  expectedArtifactId = '',
  observedArtifactId = '',
} = {}) {
  if (!validSha(mergeSha)) throw new TypeError('mergeSha must be a 40-character Git SHA');
  if (deploymentRequired !== true) {
    if (routesOk !== true) return Object.freeze({ status:'PRODUCTION_RED', reason:'production_route_regression' });
    return Object.freeze({ status:'LIVE_VERIFIED', reason:'website_deployment_not_applicable' });
  }
  if (!validSha(deployedSha)) throw new TypeError('deployedSha must be a 40-character Git SHA');
  if (!String(deployId || '').trim()) throw new TypeError('deployId is required for deployment-required production truth');
  const expectedArtifact=String(expectedArtifactId || '').trim().toLowerCase();
  const observedArtifact=String(observedArtifactId || '').trim().toLowerCase();
  const artifactIdentityRequired=Boolean(expectedArtifact || observedArtifact);
  if (artifactIdentityRequired) {
    if (!validArtifactId(expectedArtifact)) throw new TypeError('expected artifact identity must be sha256:<64 hex>');
    if (!validArtifactId(observedArtifact)) throw new TypeError('observed artifact identity must be sha256:<64 hex>');
    if (expectedArtifact !== observedArtifact) throw new Error('artifact identity mismatch between accepted source and production');
  }
  const exactSha=mergeSha.toLowerCase() === deployedSha.toLowerCase();
  if (!exactSha && supersessionSafe !== true) return Object.freeze({ status:'RELEASE_INCOMPLETE', reason:'production_sha_mismatch' });
  if (String(deployStatus).toLowerCase() !== 'ready') return Object.freeze({ status:'RELEASE_INCOMPLETE', reason:'production_not_ready' });
  if (routesOk !== true) return Object.freeze({ status:'PRODUCTION_RED', reason:'production_route_regression' });
  const reason=artifactIdentityRequired
    ? (exactSha ? 'exact_deploy_identity_sha_artifact_and_routes_verified' : 'safe_descendant_deploy_identity_artifact_and_routes_verified')
    : (exactSha ? 'exact_deploy_identity_sha_and_routes_verified' : 'safe_descendant_deploy_identity_and_routes_verified');
  return Object.freeze({ status:'LIVE_VERIFIED', reason });
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
  const deploymentRequired = String(args['deployment-required'] ?? 'true').toLowerCase() === 'true';
  const supersessionSafe = String(args['supersession-safe'] ?? 'false').toLowerCase() === 'true';
  const result = evaluateProductionReadback({
    mergeSha:args['merge-sha'],
    deployedSha:args['deployed-sha'],
    deployStatus:args['deploy-status'],
    deployId:args['deploy-id'],
    routesOk,
    deploymentRequired,
    supersessionSafe,
    expectedArtifactId:args['expected-artifact-id'] || '',
    observedArtifactId:args['observed-artifact-id'] || '',
  });
  const evidence = {
    merge_sha:args['merge-sha'],
    deployed_sha:args['deployed-sha'] || null,
    netlify_deploy_id:args['deploy-id'] || null,
    deploy_status:args['deploy-status'] || 'not_applicable',
    promotion_state:deploymentRequired ? (result.status === 'LIVE_VERIFIED' ? 'observed_exact_deploy' : 'promotion_required') : 'not_applicable',
    deployment_required:deploymentRequired,
    supersession_safe:supersessionSafe,
    expected_artifact_id:args['expected-artifact-id'] || null,
    observed_artifact_id:args['observed-artifact-id'] || null,
    routes,
    routes_ok:routesOk,
    ...result,
  };
  const output = args.output || '.artifacts/production-release-readback.json';
  await mkdir(dirname(output), { recursive:true });
  await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  if (result.status !== 'LIVE_VERIFIED') process.exitCode = 1;
  return evidence;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) runCli().catch(error => { console.error(error); process.exitCode = 1; });
