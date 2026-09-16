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

function requireBoolean(value, label, errors) {
  if (value !== true) errors.push(`${label} must be true`);
}

function requireNonEmptyArray(value, label, errors) {
  if (!Array.isArray(value) || value.length === 0) errors.push(`${label} must be a non-empty array`);
}

function validateOperatingControls(contract, errors) {
  const operating = contract.operating_controls;
  if (!operating || operating.fingerprint !== 'powerhouse-autonomy-controls-v1') {
    errors.push('autonomy controls fingerprint drift');
    return null;
  }

  const controls = operating.controls ?? {};
  const requiredControls = [
    'autonomy_budget',
    'ai_eval_regression',
    'agent_security_control_plane',
    'knowledge_decay',
    'service_level_objectives',
    'disaster_recovery_drills',
    'powerhouse_autonomy_scorecard'
  ];
  for (const name of requiredControls) {
    if (!controls[name]) errors.push(`missing autonomy control: ${name}`);
  }

  if (controls.autonomy_budget) {
    requireBoolean(controls.autonomy_budget.fail_closed, 'autonomy_budget.fail_closed', errors);
    requireNonEmptyArray(controls.autonomy_budget.required_dimensions, 'autonomy_budget.required_dimensions', errors);
  }
  if (controls.ai_eval_regression) {
    requireBoolean(controls.ai_eval_regression.require_baseline_comparison, 'ai_eval_regression.require_baseline_comparison', errors);
    requireNonEmptyArray(controls.ai_eval_regression.required_evidence, 'ai_eval_regression.required_evidence', errors);
  }
  if (controls.agent_security_control_plane) {
    requireBoolean(controls.agent_security_control_plane.least_privilege, 'agent_security_control_plane.least_privilege', errors);
    requireBoolean(controls.agent_security_control_plane.all_material_side_effects_traceable, 'agent_security_control_plane.all_material_side_effects_traceable', errors);
    requireNonEmptyArray(controls.agent_security_control_plane.required_dimensions, 'agent_security_control_plane.required_dimensions', errors);
  }
  if (controls.knowledge_decay) {
    requireBoolean(controls.knowledge_decay.require_revalidate_after, 'knowledge_decay.require_revalidate_after', errors);
    requireNonEmptyArray(controls.knowledge_decay.required_metadata_when_material, 'knowledge_decay.required_metadata_when_material', errors);
  }
  if (controls.service_level_objectives) {
    if (controls.service_level_objectives.error_budget_policy !== 'fail-closed-on-exhaustion') errors.push('service_level_objectives.error_budget_policy drift');
    requireNonEmptyArray(controls.service_level_objectives.required_fields, 'service_level_objectives.required_fields', errors);
    requireNonEmptyArray(controls.service_level_objectives.minimum_domains, 'service_level_objectives.minimum_domains', errors);
  }
  if (controls.disaster_recovery_drills) {
    requireBoolean(controls.disaster_recovery_drills.require_restore_proof, 'disaster_recovery_drills.require_restore_proof', errors);
    requireBoolean(controls.disaster_recovery_drills.backup_presence_alone_is_not_restore_proof, 'disaster_recovery_drills.backup_presence_alone_is_not_restore_proof', errors);
    requireNonEmptyArray(controls.disaster_recovery_drills.required_evidence, 'disaster_recovery_drills.required_evidence', errors);
  }
  if (controls.powerhouse_autonomy_scorecard) {
    requireBoolean(controls.powerhouse_autonomy_scorecard.no_single_magic_score, 'powerhouse_autonomy_scorecard.no_single_magic_score', errors);
    requireBoolean(controls.powerhouse_autonomy_scorecard.unknown_is_not_zero, 'powerhouse_autonomy_scorecard.unknown_is_not_zero', errors);
    requireNonEmptyArray(controls.powerhouse_autonomy_scorecard.dimensions, 'powerhouse_autonomy_scorecard.dimensions', errors);
  }

  return operating.fingerprint;
}

export async function validateEngineeringOS() {
  const contract = await loadEngineeringContract();
  const errors = [];

  if (contract.fingerprint !== 'powerhouse-engineering-os-v1') errors.push('fingerprint drift');
  if (contract.delivery_contract !== 'BRAIN-DELIVERY-v2') errors.push('delivery contract drift');

  const expectedGoldenPath = [
    'CONTEXT', 'SCOPE', 'PLAN', 'CHANGE', 'TEST', 'PREVIEW',
    'VERIFY', 'PROMOTE', 'PROD_READBACK', 'WRITEBACK', 'LEARN'
  ];
  if (JSON.stringify(contract.golden_path) !== JSON.stringify(expectedGoldenPath)) errors.push('golden path drift');

  for (const [name, relativePath] of Object.entries(contract.canonical_authorities ?? {})) {
    if (!(await exists(relativePath))) errors.push(`missing authority ${name}: ${relativePath}`);
  }

  const developmentOS = await readFile(path.join(repoRoot, contract.canonical_authorities.development_os), 'utf8');
  if (!developmentOS.includes('BRAIN-DELIVERY-v2')) errors.push('development OS does not declare BRAIN-DELIVERY-v2');
  if (developmentOS.includes('BRAIN-DELIVERY-v1')) errors.push('stale BRAIN-DELIVERY-v1 remains in development OS');
  if (!developmentOS.includes('powerhouse-engineering-os-v1')) errors.push('development OS does not reference Engineering OS fingerprint');
  if (!developmentOS.includes('powerhouse-autonomy-controls-v1')) errors.push('development OS does not reference autonomy controls fingerprint');

  const controlFingerprint = validateOperatingControls(contract, errors);

  const requiredCI = await readFile(path.join(repoRoot, contract.canonical_authorities.required_ci), 'utf8');
  if (!requiredCI.includes(contract.bootstrap.required_test)) errors.push('Engineering OS regression test is not wired into Required test');

  return {
    ok: errors.length === 0,
    fingerprint: contract.fingerprint,
    control_fingerprint: controlFingerprint,
    delivery_contract: contract.delivery_contract,
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
