import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const CONTRACT_PATH = 'config/browser-evidence-guard-contract.json';
const LEARNING_PATH = 'docs/development-browser-evidence-candidate-chrome.md';

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function readText(path) {
  return readFile(path, 'utf8');
}

test('browser evidence guard contract exists and is fail-closed', async () => {
  const contract = await readJson(CONTRACT_PATH);
  assert.equal(contract.version, 'BROWSER-EVIDENCE-GUARD-v1');
  assert.equal(contract.failClosed, true);
  assert.equal(contract.releaseIdentity.canonicalSource, 'manifest.json');
  assert.equal(contract.releaseIdentity.requireBrowserManifestEquality, true);
});

test('page-scoped Chrome DevTools calls require an explicit page id', async () => {
  const contract = await readJson(CONTRACT_PATH);
  assert.equal(contract.chromeDevTools.pageScopedCalls.requirePageId, true);
  assert.ok(contract.chromeDevTools.pageScopedCalls.commands.includes('take_snapshot'));
  assert.ok(contract.chromeDevTools.pageScopedCalls.commands.includes('list_console_messages'));
  assert.equal(contract.chromeDevTools.rejectAboutBlankAsRuntimeEvidence, true);
  assert.equal(contract.chromeDevTools.cliOrProtocolErrorResult, 'FAIL');
});

test('candidate browser identity is pinned end to end', async () => {
  const contract = await readJson(CONTRACT_PATH);
  assert.equal(contract.candidateSession.required, true);
  assert.equal(contract.candidateSession.fallbackAllowed, false);
  assert.equal(contract.candidateSession.acceptedSessionId, 'ca11da7e');
  assert.equal(contract.candidateSession.requireSameSessionAcrossInstallerWrapperMonitorAndGates, true);
});

test('macOS LaunchAgent preflight requires both node and chrome-devtools', async () => {
  const contract = await readJson(CONTRACT_PATH);
  assert.equal(contract.macosLaunchAgent.resolveAbsoluteChromeDevtoolsPath, true);
  assert.equal(contract.macosLaunchAgent.resolveNodeDirectory, true);
  assert.equal(contract.macosLaunchAgent.injectBothIntoPath, true);
  assert.deepEqual(contract.macosLaunchAgent.preflightExecutables.sort(), ['chrome-devtools', 'node']);
});

test('operator-supplied webhook values reject Markdown contamination', async () => {
  const contract = await readJson(CONTRACT_PATH);
  assert.equal(contract.inputSafety.rawHttpsOnly, true);
  assert.equal(contract.inputSafety.rejectMarkdownLinks, true);
  assert.equal(contract.inputSafety.rejectWhitespaceContamination, true);
  assert.equal(contract.inputSafety.invalidInputAction, 'FAIL_INSTALL');
});

test('extension-present uses grounded runtime triangulation instead of a page-world sentinel', async () => {
  const contract = await readJson(CONTRACT_PATH);
  const gate = contract.runtimeGates.extensionPresent;
  assert.equal(gate.pageWorldSentinelPrimaryEvidence, false);
  assert.equal(gate.listExtensionsPrimaryEvidence, false);
  assert.deepEqual(gate.requiredSignals, [
    'candidate-session-match',
    'linkedin-page-selected',
    'extension-service-worker',
    'manifest-version-match',
    'liveLinkedInState-present',
    'liveLinkedInHealth-status-ok',
    'powerhouse-dom-output-present',
    'collector-error-free'
  ]);
});

test('known browser evidence failure fingerprints remain permanently registered', async () => {
  const contract = await readJson(CONTRACT_PATH);
  const fingerprints = new Set(contract.knownFailureFingerprints);
  for (const expected of [
    'browser-evidence|cli|page-id-missing',
    'browser-evidence|extensions-api|browser-context-missing',
    'browser-evidence|isolated-world|sentinel-false-negative',
    'browser-evidence|candidate-session|wrong-daemon',
    'browser-evidence|session-id|invalid-format',
    'browser-evidence|launchagent|chrome-devtools-path-missing',
    'browser-evidence|launchagent|node-path-missing',
    'browser-evidence|webhook|markdown-url-contamination',
    'extension|runtime|context-invalidated-storage',
    'extension|release|manifest-version-drift',
    'chrome|stable|load-extension-assumption',
    'browser-evidence|gate|fail-open',
    'browser-evidence|worker-tabs|visible-side-effects'
  ]) assert.ok(fingerprints.has(expected), `missing fingerprint: ${expected}`);
});

test('learning lifecycle distinguishes memory, guarded and proven', async () => {
  const contract = await readJson(CONTRACT_PATH);
  assert.deepEqual(contract.learningLifecycle, {
    MEMORY: 'fingerprint-root-cause-fix-stored',
    GUARDED: 'deterministic-regression-or-validator-enforced',
    PROVEN: 'guard-detected-or-prevented-original-defect-in-intended-runtime'
  });
  assert.equal(contract.completionRule, 'NO_COMPLETION_WHILE_MATERIAL_LEARNING_EXISTS_ONLY_IN_CHAT');
});

test('canonical learning document contains the core fingerprints and reusable rules', async () => {
  const text = await readText(LEARNING_PATH);
  for (const needle of [
    'browser-evidence|cli|page-id-missing',
    'browser-evidence|candidate-session|wrong-daemon',
    'browser-evidence|launchagent|node-path-missing',
    'browser-evidence|webhook|markdown-url-contamination',
    'extension|release|manifest-version-drift',
    'browser-evidence|gate|fail-open',
    'Observability must prove it is attached to the exact target runtime',
    'Documentation alone is memory, not a complete guard'
  ]) assert.ok(text.includes(needle), `learning document missing: ${needle}`);
});
