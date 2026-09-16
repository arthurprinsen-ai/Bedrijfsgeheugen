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

  const requiredCI = await readFile(path.join(repoRoot, contract.canonical_authorities.required_ci), 'utf8');
  if (!requiredCI.includes(contract.bootstrap.required_test)) errors.push('Engineering OS regression test is not wired into Required test');

  return {
    ok: errors.length === 0,
    fingerprint: contract.fingerprint,
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
