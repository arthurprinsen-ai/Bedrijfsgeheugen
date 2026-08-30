# Browser Evidence & Candidate Chrome — Canonical Learning Contract

Date: 2026-08-30
Scope: Powerhouse Chrome extension, Chrome DevTools MCP/CLI, macOS LaunchAgent monitor, candidate-browser runtime proof, self-healing release gates.

## Purpose

This document converts the browser-evidence failures and recoveries from the Powerhouse build/debug flow into reusable engineering memory. Future chats, agents, Make scenarios and CI/CD lanes must consult these fingerprints before trying a repair.

The governing principle is:

> Observability must prove it is attached to the exact target runtime before its output can influence release health.

A collector error is an observability failure until product evidence independently proves otherwise. A collector error must never be translated into a product PASS, and a missing collector signal must never automatically trigger a product repair without runtime triangulation.

## Canonical fingerprints

### `browser-evidence|cli|page-id-missing`

**Symptom**
- `list_console_messages` returned `Not enough non-option arguments`.
- snapshot/console calls were invoked without a page target.
- page state could remain `about:blank`.

**Root cause**
Chrome DevTools CLI v1.8.0 requires an explicit positional `pageId` for page-scoped commands such as `take_snapshot` and `list_console_messages`.

**Guard**
- Resolve/select the real LinkedIn page first.
- Pass its pageId to every page-scoped CLI call.
- Reject `about:blank` as runtime acceptance evidence.
- CLI/protocol errors are `WARN/FAIL`, never `PASS`.

### `browser-evidence|extensions-api|browser-context-missing`

**Symptom**
`list_extensions --sessionId ...` returned `Protocol error (Extensions.getExtensions): Could not find browser context.`

**Root cause**
The Extensions domain is not a reliable release gate in this candidate-browser context.

**Guard**
Do not use `list_extensions` as the primary extension-presence proof. Use runtime triangulation:
1. correct candidate session;
2. real LinkedIn page;
3. extension service worker;
4. exact manifest version;
5. `chrome.storage.local` live state;
6. `liveLinkedInHealth.status === 'ok'`;
7. real Powerhouse DOM output.

### `browser-evidence|isolated-world|sentinel-false-negative`

**Symptom**
Page-world checks for `window.__BG_POWERHOUSE_*` and `window.liveLinkedInState` returned false while Powerhouse overlays were clearly present.

**Root cause**
Chrome content scripts execute in an isolated world. Page-world JavaScript cannot be assumed to see extension globals.

**Guard**
A page-world sentinel is only a secondary hint. It must never be the sole `extension-present` release gate.

### `browser-evidence|candidate-session|wrong-daemon`

**Symptom**
The monitor and manually inspected candidate browser could observe different runtime state; `service-worker-missing` or `about:blank` could appear despite a healthy manually inspected candidate browser.

**Root cause**
The monitor did not consistently pin all CLI calls to the same candidate session/daemon.

**Guard**
- One explicit candidate session ID is passed through installer, wrapper, monitor and every gate.
- Current accepted candidate-line ID: `ca11da7e` unless intentionally replaced by a validated equivalent.
- The session must be validated before use.
- A gate may not silently fall back to another daemon/session.

### `browser-evidence|session-id|invalid-format`

**Symptom**
A descriptive session label such as `powerhouse-candidate` failed validation.

**Root cause**
The installed CLI only accepted the supported hex/hyphen session ID format.

**Guard**
Validate session IDs before daemon start. Do not invent semantic labels without verifying CLI acceptance.

### `browser-evidence|launchagent|chrome-devtools-path-missing`

**Symptom**
macOS LaunchAgent repeatedly logged:

```text
chrome-devtools: command not found
```

**Root cause**
LaunchAgents do not inherit the same npm/global shell PATH as the interactive terminal.

**Guard**
- Resolve the absolute `chrome-devtools` binary at install time.
- Write that path into the generated wrapper.
- Run an install-time executable/status preflight.

### `browser-evidence|launchagent|node-path-missing`

**Symptom**
After fixing the absolute CLI path, the LaunchAgent logged:

```text
env: node: No such file or directory
```

**Root cause**
`chrome-devtools` itself starts through `/usr/bin/env node`. The wrapper could locate the CLI script but the LaunchAgent PATH still could not locate Node.

**Guard**
- Resolve the actual Node binary/directory during install.
- Add Node and chrome-devtools locations explicitly to LaunchAgent/wrapper PATH.
- Preflight both `node` and `chrome-devtools` from the generated runtime environment before declaring the monitor installed.

### `browser-evidence|webhook|markdown-url-contamination`

**Symptom**
Chat-rendered links were pasted into shell environment variables as values like:

```text
[https://hook...](https://hook...)
```

**Root cause**
A Markdown-rendered hyperlink was copied instead of a raw URL and the installer accepted it without validation.

**Guard**
- Config accepts raw `https://...` values only.
- Reject Markdown-link syntax, whitespace-contaminated values and malformed hooks at install time.
- Never silently install with an invalid webhook.

### `extension|runtime|context-invalidated-storage`

**Symptom**
Chrome showed:

```text
Uncaught Error: Extension context invalidated.
```

around `chrome.storage.local.set(...).catch(...)`.

**Root cause**
Chrome extension APIs can throw synchronously after reload/unload before returning a Promise. Promise `.catch()` therefore does not cover all invalidated-context failures.

**Guard**
- Check extension context liveness where feasible.
- Wrap extension API entry points in `try/catch` as well as async rejection handling.
- Stop persistence/timers for an invalidated old instance.
- Keep a regression test that reload/invalidation does not create uncaught errors.

### `extension|release|manifest-version-drift`

**Symptom**
The folder/release name said v95.4.3 while the live service worker reported manifest version `95.0.3`.

**Root cause**
Version identity was duplicated/hardcoded in multiple locations and release folder naming was incorrectly treated as evidence.

**Guard**
- `manifest.json` is canonical for extension release identity.
- Monitor/candidate/repair contracts read the same canonical version source.
- Browser-reported manifest version must exactly equal the candidate version before promotion.
- Folder name, ZIP name or PR name is not release identity.

### `chrome|stable|load-extension-assumption`

**Symptom**
Candidate extension loading did not behave reliably when relying on command-line `--load-extension` assumptions in modern official Chrome.

**Root cause**
Modern Chrome behavior changed and the old startup assumption was no longer dependable for the stable browser path.

**Guard**
Use a persistent candidate profile and a supported install/load workflow. Runtime verification is mandatory after browser start; startup flags alone are never proof that the extension is active.

### `browser-evidence|gate|fail-open`

**Symptom**
Several gates returned PASS even when their notes contained tool/CLI errors.

**Root cause**
Gate logic treated missing evidence or tool failures as successful fallback states.

**Guard**
- Tool/CLI/protocol error => `WARN/FAIL` according to severity.
- Missing mandatory evidence => FAIL.
- A release gate must never infer success from execution failure.

### `browser-evidence|worker-tabs|visible-side-effects`

**Symptom**
Opening the cockpit could create multiple visible LinkedIn tabs for Feed/DM/Network workers.

**Root cause**
Background work used normal tab primitives without a no-visible-worker contract.

**Guard**
Automatic workers may not create visible extra user tabs in the normal product flow. This remains an explicit regression gate.

## Grounded runtime evidence that replaced the old sentinel conclusion

In the real candidate LinkedIn feed:
- snapshots contained multiple `Powerhouse · RELEVANT` and `Powerhouse · NU REAGEREN` sections;
- DOM included `pwh-live-action` and related Powerhouse runtime classes;
- extension service worker existed for the loaded Powerhouse extension;
- service-worker storage contained `liveLinkedInState` and `liveLinkedInHealth`;
- `liveLinkedInHealth.status` was `ok`;
- diagnostics showed 8 scanned, 8 rendered, 6 actionable, 2 sponsored ignored and 0 parse errors.

Therefore the earlier fingerprint `runtime|extension-present|sentinel-missing` is deprecated as a standalone product diagnosis. It may be recorded as an observability symptom, but it may not trigger an extension repair unless the runtime-triangulation gate also fails.

## Required release gate: `extension-present`

The gate is GREEN only when the relevant evidence agrees:

1. candidate session is the intended session;
2. a real LinkedIn page is selected, not `about:blank`;
3. Powerhouse service worker exists in that candidate context;
4. browser-reported manifest version equals candidate version;
5. `liveLinkedInState` exists;
6. `liveLinkedInHealth` exists and reports `status=ok`;
7. real Powerhouse DOM output is present;
8. no CLI/protocol/tool error occurred while collecting these signals.

Any mandatory-signal conflict is release-blocking until classified.

## Mandatory debugging sequence for future agents

For browser-runtime incidents:

1. Reproduce the exact symptom and preserve the raw error/fingerprint.
2. Verify immutable identity: repository/candidate version -> candidate session -> pageId -> service worker -> manifest -> storage health -> DOM output.
3. Search shared memory/development ledger for the fingerprint before proposing a fix.
4. Form one hypothesis at a time.
5. Maximum two identical retries without new evidence.
6. Add a regression check that fails on the original defect before the production fix where technically feasible.
7. Apply the smallest root-cause fix.
8. Re-run the exact failing check plus surrounding regression suite.
9. Do not promote on HTTP 200, daemon status, folder name, PR number, a single sentinel or a placeholder PASS.
10. Write back `ERROR -> root cause -> failed approach -> RECOVERY -> regression gate -> verification -> reusable lesson`.

## Copy/paste safety for beginner-operated terminal steps

The development flow must assume chat formatting can contaminate terminal commands.

Rules:
- Prefer one-line commands when possible.
- Never include shell prompt text in copyable commands.
- Raw URLs must be shown as raw shell values, not Markdown hyperlinks inside code blocks.
- Installers/config validators must reject malformed values instead of relying on human copy accuracy.
- Repeated operator mistakes become automation requirements, not repeated instructions.

## Definition of guarded

A lesson is only **GUARDED** when:
- the fingerprint is stored in shared memory;
- root cause and known failed approach are stored;
- a deterministic validator/regression gate prevents the same unsafe path where feasible;
- the fix is verified against the original symptom in the intended runtime;
- future agents can retrieve the learning before execution.

Documentation alone is memory, not a complete guard. CI/runtime validation must enforce the critical rules.