import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const contractPath = path.join(repoRoot, 'config', 'powerhouse-engineering-os.json');

export async function loadEngineeringContract() {
  return JSON.parse(await readFile(contractPath, 'utf8'));
}

async function exists(relativePath) {
  try {
    await access(path.join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

export async function validateEngineeringOS() {
  const contract = await loadEngineeringContract();
  const errors = [];

  if (contract.fingerprint !== 'powerhouse-engineering-os-v1') errors.push('fingerprint drift');
  if (contract.delivery_contract !== 'BRAIN-DELIVERY-v2') errors.push('delivery contract drift');

  const requiredPrinciples = ['SHARED-LEARNING', 'TEAM-OF-AGENTS'];
  for (const principle of requiredPrinciples) {
    if (!contract.principles?.includes(principle)) errors.push(`missing principle ${principle}`);
  }

  const expectedGoldenPath = [
    'CONTEXT', 'SCOPE', 'PLAN', 'CHANGE', 'TEST', 'PREVIEW',
    'VERIFY', 'PROMOTE', 'PROD_READBACK', 'WRITEBACK', 'LEARN', 'IMPROVE'
  ];
  if (JSON.stringify(contract.golden_path) !== JSON.stringify(expectedGoldenPath)) errors.push('golden path drift');

  for (const [name, relativePath] of Object.entries(contract.canonical_authorities ?? {})) {
    if (!(await exists(relativePath))) errors.push(`missing authority ${name}: ${relativePath}`);
  }

  if (contract.shared_learning?.fingerprint !== 'powerhouse-shared-learning-architecture-evolution-v1') errors.push('shared learning fingerprint drift');
  if (contract.shared_learning?.preflight?.read_current_shared_context !== true) errors.push('shared context preflight drift');
  if (contract.shared_learning?.preflight?.read_explicit_required_evidence !== true) errors.push('explicit evidence preflight drift');
  if (contract.shared_learning?.dedupe_before_write !== true) errors.push('learning dedupe-before-write drift');
  if (contract.shared_learning?.separate_audit_from_current_projection !== true) errors.push('learning projection separation drift');
  if (contract.shared_learning?.refresh_after_new_verified_learning !== true) errors.push('shared context refresh drift');
  if (contract.shared_learning?.explicit_evidence_not_replaceable_by_shared_context !== true) errors.push('explicit evidence separation drift');
  if (contract.shared_learning?.reuse_known_fix_before_experiment !== true) errors.push('known fix reuse drift');

  if (contract.skill_evolution?.requires?.baseline !== true) errors.push('skill baseline gate drift');
  if (contract.skill_evolution?.requires?.representative_eval !== true) errors.push('skill eval gate drift');
  if (contract.skill_evolution?.requires?.success_metric !== true) errors.push('skill success metric drift');
  if (contract.skill_evolution?.requires?.compatibility !== true) errors.push('skill compatibility gate drift');
  if (contract.skill_evolution?.requires?.rollback_or_fallback !== true) errors.push('skill rollback gate drift');
  if (contract.skill_evolution?.requires?.post_promotion_outcome !== true) errors.push('skill post-promotion outcome drift');

  if (contract.architecture_evolution?.requires?.compare_to_current !== true) errors.push('architecture baseline comparison drift');
  if (contract.architecture_evolution?.requires?.measurable_improvement !== true) errors.push('architecture measurable improvement drift');
  if (contract.architecture_evolution?.requires?.migration_compatibility !== true) errors.push('architecture migration compatibility drift');
  if (contract.architecture_evolution?.requires?.security_privacy_cost_review !== true) errors.push('architecture security/privacy/cost review drift');
  if (contract.architecture_evolution?.requires?.representative_tests_or_benchmarks !== true) errors.push('architecture evaluation gate drift');
  if (contract.architecture_evolution?.requires?.rollback_or_recovery !== true) errors.push('architecture rollback/recovery drift');
  if (contract.architecture_evolution?.requires?.production_readback !== true) errors.push('architecture production readback drift');
  if (contract.architecture_evolution?.requires?.system_map_and_decision_lineage_update !== true) errors.push('architecture documentation lineage drift');

  const developmentOS = await readFile(path.join(repoRoot, contract.canonical_authorities.development_os), 'utf8');
  if (!developmentOS.includes('BRAIN-DELIVERY-v2')) errors.push('development OS does not declare BRAIN-DELIVERY-v2');
  if (developmentOS.includes('BRAIN-DELIVERY-v1')) errors.push('stale BRAIN-DELIVERY-v1 remains in development OS');
  if (!developmentOS.includes('powerhouse-engineering-os-v1')) errors.push('development OS does not reference Engineering OS fingerprint');
  if (!developmentOS.includes('powerhouse-shared-learning-architecture-evolution-v1')) errors.push('development OS does not reference shared learning/evolution fingerprint');

  const requiredCI = await readFile(path.join(repoRoot, contract.canonical_authorities.required_ci), 'utf8');
  if (!requiredCI.includes(contract.bootstrap.required_test)) errors.push('Engineering OS regression test is not wired into Required test');

  return {
    ok: errors.length === 0,
    fingerprint: contract.fingerprint,
    delivery_contract: contract.delivery_contract,
    shared_learning_fingerprint: contract.shared_learning?.fingerprint ?? null,
    golden_path: contract.golden_path,
    errors
  };
}

async function main() {
  const mode = process.argv[2] ?? '--check';
  if (mode === '--packet') {
    const contract = await loadEngineeringContract();
    const validation = await validateEngineeringOS();
    if (!validation.ok) {
      console.error(JSON.stringify({ status: 'ENGINEERING_OS_BLOCKED', ...validation }, null, 2));
      process.exitCode = 1;
      return;
    }
    console.log(JSON.stringify({ status: 'ENGINEERING_OS_READY', contract }, null, 2));
    return;
  }

  if (mode !== '--check') {
    console.error('Usage: node scripts/brain/powerhouse-engineering-os.mjs [--check|--packet]');
    process.exitCode = 2;
    return;
  }

  const validation = await validateEngineeringOS();
  console.log(JSON.stringify({ status: validation.ok ? 'ENGINEERING_OS_READY' : 'ENGINEERING_OS_BLOCKED', ...validation }, null, 2));
  if (!validation.ok) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
