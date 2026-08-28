# Brain Runtime Classifier Final Recovery — 2026-08-29

## 2026-08-29 00:34 CEST — ERROR — LEARNING_CONTEXT_REQUIRED misclassified by incidental contract wording
- **Fingerprint:** `brain|bg168|learning-context-required-precedence|red`
- **Signal:** an outcome beginning with `LEARNING_CONTEXT_REQUIRED` but containing the phrase `no code/contract change` was classified as `AGENT_CONTRACT_CHANGE`.
- **Impact:** missing-evidence/context-required states could be presented to Team Memory as governance changes instead of actionable errors.
- **Root cause:** generic `contract change` keyword matching executed before an explicit `LEARNING_CONTEXT_REQUIRED` semantic-start rule.
- **RED evidence:** BG168 execution `63b7609a08534e66867d05f6c65dec80` returned `AGENT_CONTRACT_CHANGE` for `LEARNING_CONTEXT_REQUIRED — no code/contract change performed. Evidence packet incomplete; missing required evidence_ref.`
- **Owner:** BG168 Outcome Router + Knowledge/Governance.

## 2026-08-29 00:34 CEST — RECOVERY — context-required semantic precedence
- **Fingerprint:** `brain|bg168|learning-context-required-precedence|recovered`
- **Fix:** BG168 now detects a result whose semantic start is `LEARNING_CONTEXT_REQUIRED` before incidental contract-word matching and classifies it as `AGENT_ERROR`/context-required.
- **Positive invariant:** explicit `CONTRACT_CHANGE` remains `AGENT_CONTRACT_CHANGE`.
- **GREEN evidence:** execution `20480bb6592143eba9c86973ddbc12ff` returned `AGENT_ERROR` for the exact context-required regression case; execution `cb748bb4b1aa4d2c9f3c8bca09873b07` returned `AGENT_CONTRACT_CHANGE` for an explicit contract-change case.
- **Shared learning:** recovery event `2b61003e55df4d7b9f35d1cc22133acf` persisted fingerprint `brain|bg168|learning-context-required-precedence|recovered` through BG168/BG166.
- **History rule:** earlier false contract-change records are not deleted; the recovery supersedes their interpretation while BG166 remains immutable.
- **Rollback:** restore the previous classifier only if a verified semantic regression appears; otherwise retain context-required precedence.
- **Reusable lesson:** semantic state at the start of an agent outcome outranks incidental vocabulary embedded later in prose.

## Final protected state before repository promotion
- Brain runtime adapters remain internal-safe only.
- `side_effects_authorized=false` for BG182/BG183 creative/content handoffs.
- No credentials, permissions, security controls, destructive data or paid-resource increases changed.
- All runtime canary Missions have been explicitly retired; BG167 `current_missions=[]` after refresh `0a8f0cbf36d54bd1897ade69ef8fa94c`.
- Existing production before this documentation-only candidate: GitHub `main` `373b273d28eea7c95959f27d49c53bc629e82a85`, Netlify production deploy `6a920c231311e100074bd277`, state `ready`.
