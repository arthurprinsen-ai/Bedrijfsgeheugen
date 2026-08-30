import { execFileSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { pathToFileURL } from 'node:url';

function major(version = '') {
  const match = String(version).match(/^(?:v)?(\d+)/);
  return match ? Number(match[1]) : 0;
}

export function certifyDevice(probe = {}) {
  const blockers = [];
  if (major(probe.nodeVersion) < 22) blockers.push('NODE_22_REQUIRED');
  if (probe.gitAvailable !== true) blockers.push('GIT_UNAVAILABLE');
  if (probe.repoRoot !== true) blockers.push('REPOSITORY_NOT_READY');
  if (probe.deliveryContract !== 'BRAIN-DELIVERY-v2') blockers.push('DELIVERY_CONTRACT_MISMATCH');
  if (probe.brainContract !== 'brain.v1') blockers.push('BRAIN_CONTRACT_MISMATCH');
  if (probe.onProtectedBranch === true) blockers.push('PROTECTED_BRANCH_ACTIVE');
  if (!/^https:\/\/github\.com\/arthurprinsen-ai\/Bedrijfsgeheugen(?:\.git)?$/i.test(String(probe.remoteOrigin ?? '').trim())) blockers.push('CANONICAL_REMOTE_MISMATCH');
  if (probe.prAuthAvailable !== true) blockers.push('PR_AUTH_UNAVAILABLE');
  if (probe.writerWorkflowAvailable !== true) blockers.push('WRITER_WORKFLOW_UNAVAILABLE');
  if (probe.shadowVerifierAvailable !== true) blockers.push('SHADOW_VERIFIER_UNAVAILABLE');

  return Object.freeze({
    ok: blockers.length === 0,
    state: blockers.length === 0 ? 'DEVICE_CERTIFIED' : 'DEVICE_BLOCKED',
    contract: 'BRAIN-DELIVERY-v2',
    brain_contract: 'brain.v1',
    blockers: Object.freeze(blockers),
  });
}

function commandOk(command, args = []) {
  try {
    execFileSync(command, args, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function commandText(command, args = []) {
  try {
    return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

async function exists(path) {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export async function probeCurrentDevice() {
  let deliveryContract = '';
  let brainContract = '';
  try {
    const config = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
    deliveryContract = String(config.version ?? '');
    brainContract = String(config.brainContractVersion ?? '');
  } catch {}

  const branch = commandText('git', ['branch', '--show-current']);
  const remoteOrigin = commandText('git', ['remote', 'get-url', 'origin']);
  const githubToken = String(process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? '').trim();
  const ghAuth = commandOk('gh', ['auth', 'status']);

  return Object.freeze({
    nodeVersion: process.versions.node,
    gitAvailable: commandOk('git', ['--version']),
    repoRoot: await exists('AGENTS.md') && await exists('config/brain-delivery-system.json'),
    deliveryContract,
    brainContract,
    onProtectedBranch: branch === 'main' || branch === 'master' || branch === '',
    remoteOrigin,
    prAuthAvailable: Boolean(githubToken) || ghAuth,
    writerWorkflowAvailable: await exists('.github/workflows/repo-writer-candidate-shadow.yml'),
    shadowVerifierAvailable: await exists('.github/workflows/repo-writer-operational-verification.yml'),
  });
}

async function main() {
  const probe = await probeCurrentDevice();
  const result = certifyDevice(probe);
  process.stdout.write(`${JSON.stringify({ ...result, probe }, null, 2)}\n`);
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    process.stderr.write(`${JSON.stringify({ ok: false, state: 'DEVICE_CERTIFICATION_ERROR', error: error.message })}\n`);
    process.exitCode = 1;
  });
}
