# Autonomous Publication Controller Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every approved due blog, LinkedIn and Instagram publication a persisted outcome obligation that autonomously dispatches, self-heals, verifies production evidence and writes durable learnings to the Brain.

**Architecture:** Add one deterministic Publication Autonomy Controller above the existing BG171, BG179, BG192 and BG164 executors. Preserve channel executors as the only side-effect owners; use a persisted obligation key for idempotency and lifecycle state, bounded deterministic recovery for known fingerprints, PH Agent 15 only for unfamiliar diagnosis, and BG168/BG166 for material learning. Repair the GitHub candidate-branch credential lifecycle at the source and regression-test it.

**Tech Stack:** Make scenarios, Notion/Datahub, GitHub Actions, GitHub CLI, Python/Node repository tests, BG168/BG166 Brain writeback.

**Spec:** `docs/superpowers/specs/2026-09-01-autonomous-publication-controller-design.md`

## Global Constraints

- Preserve BG171 as the only LinkedIn native side-effect executor.
- Preserve BG179 as the only Instagram native side-effect executor.
- Preserve BG192/BG164 and candidate-PR-only blog delivery; never push publication changes directly to `main`.
- Deterministic-first classification; no AI call for known failure fingerprints.
- One bounded retry only for Class A transient/idempotent failures.
- Never infer or regenerate immutable publication identity from prose.
- No DataForSEO/Tavily calls for publication recovery.
- Closed obligations are immutable NOOPs on later recovery sweeps.
- Material failures and proven fixes must write through BG168/BG166.
- Human approval is reserved for explicit hard boundaries only.

---

### Task 1: Regression-test and repair GitHub candidate-branch authentication

**Files:**
- Create: `scripts/ci/test-publisher-auth-contract.py`
- Modify: `.github/workflows/weekblog.yml`
- Modify: `.github/workflows/approved-central-blog.yml`

**Interfaces:**
- Consumes: GitHub Actions `GITHUB_TOKEN`, `GITHUB_REPOSITORY`, candidate branch from existing writer-candidate helper.
- Produces: deterministic `restore-publisher-git-auth` step before candidate `git push`; static regression test that fails if either publisher can reach a candidate push without credential restoration.

- [ ] **Step 1: Write the failing regression test**

```python
from pathlib import Path

FILES = [
    Path('.github/workflows/weekblog.yml'),
    Path('.github/workflows/approved-central-blog.yml'),
]

for path in FILES:
    text = path.read_text()
    push = text.index('git push origin "HEAD:$CANDIDATE_BRANCH"')
    auth = text.rfind('gh auth setup-git', 0, push)
    assert auth != -1, f'{path}: candidate push lacks restored GitHub auth'
    token = text.rfind('GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}', 0, push)
    assert token != -1 and token < auth, f'{path}: auth restore lacks GITHUB_TOKEN'
print('PUBLISHER_AUTH_CONTRACT_OK')
```

- [ ] **Step 2: Run test to verify RED**

Run: `python3 scripts/ci/test-publisher-auth-contract.py`
Expected: FAIL for at least `weekblog.yml` because the current candidate push has no explicit credential restoration after the third-party Claude action.

- [ ] **Step 3: Add the minimal credential restoration immediately before candidate push in both workflows**

Required YAML shape:

```yaml
      - name: Restore canonical GitHub credentials for candidate delivery
        if: steps.kalender.outputs.gevonden == 'true'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          set -euo pipefail
          gh auth setup-git
          git ls-remote --exit-code origin HEAD >/dev/null
```

For `approved-central-blog.yml`, preserve its existing `if: steps.render.outputs.changed == 'true'` condition instead of `steps.kalender...`.

- [ ] **Step 4: Run regression test to verify GREEN**

Run: `python3 scripts/ci/test-publisher-auth-contract.py`
Expected: `PUBLISHER_AUTH_CONTRACT_OK`.

- [ ] **Step 5: Verify workflow syntax and commit**

Run repository workflow/YAML validation already used by the repo, then commit with message `fix: restore publisher auth before candidate push`.

---

### Task 2: Persist publication obligations and deterministic lifecycle state

**Systems:**
- Create or extend canonical Make scenario: `BG211 - Publication Autonomy Controller v1`
- Reuse central Datahub/Notion publication records; do not create a second publishing database.

**Interfaces:**
- Consumes: canonical content id, channel, scheduled_at, approval state, slug/native identity, attribution root, current publication evidence.
- Produces: immutable `publication_obligation_key = <content-id>|<channel>|<scheduled-slot>`, lifecycle state, dispatch key, attempt metadata, failure class/fingerprint, production evidence and owner component.

- [ ] **Step 1: Define a deterministic RED canary fixture**

Fixture A: approved due blog with no obligation state must become `READY` with one stable obligation key.
Fixture B: same input twice must update the same obligation, never create a duplicate.
Fixture C: already-proven publication must become/stay `PUBLISHED_PROVEN` and produce NOOP.

- [ ] **Step 2: Build the minimal controller read/classify/persist path**

Controller must query a bounded set of due/recent approved records, normalize channel and immutable identity, compute obligation key deterministically and persist/update canonical lifecycle fields.

- [ ] **Step 3: Run Fixture A/B/C and verify GREEN**

Expected: one stable obligation per canonical content/channel/slot; duplicate canary is UPDATE/NOOP; closed proof never redispatches.

- [ ] **Step 4: Add low-cost recovery schedule**

Schedule no faster than every two hours unless an existing event-driven caller invokes BG211. Bounded query size; oldest unresolved due obligation first.

- [ ] **Step 5: Record scenario id, execution ids and cost evidence**

Persist evidence for later Brain writeback.

---

### Task 3: Wire deterministic channel dispatch and bounded retry

**Systems:**
- Modify `BG211 - Publication Autonomy Controller v1`
- Invoke existing BG171, BG179 and BG192 only.

**Interfaces:**
- Consumes: obligation in `READY` or eligible `SAFE_REPAIR_IN_PROGRESS` state.
- Produces: exact executor dispatch, `DISPATCHED`/`VERIFYING`, attempt_count increment and execution identity.

- [ ] **Step 1: Add RED canaries for routing**

BLOG -> BG192 only.
LINKEDIN_PERSONAL / LINKEDIN_COMPANY -> BG171 only.
INSTAGRAM -> BG179 only.
Unknown/unapproved channel -> no side effect.

- [ ] **Step 2: Implement exact deterministic routing**

Pass immutable slug/content/channel identity where the existing executor interface supports it. Never publish directly from BG211.

- [ ] **Step 3: Implement Class A one-retry ceiling**

Retry requires: exact immutable identity, no native/public proof, prior attempt_count < 2, and transient fingerprint allowlist. A second failure cannot loop.

- [ ] **Step 4: Verify RED→GREEN with no duplicate side effects**

Use safe fixtures or NOOP paths where possible; do not create a real duplicate social post solely for testing.

---

### Task 4: Route repairable defects to autonomous repair instead of passive diagnosis

**Systems:**
- Modify `BG211`
- Modify `PH Agent 15 - Post Guardian v3 stable runner`
- Reuse BG210 for SEO queue-state recovery where applicable.

**Interfaces:**
- Consumes: exact execution/module evidence and known Brain fingerprint.
- Produces: Class B repair owner, `SAFE_REPAIR_IN_PROGRESS`, bounded repair action, regression evidence, resume of original obligation.

- [ ] **Step 1: Add deterministic known-fingerprint mapping**

At minimum:
- `LEGACY_SEO_QUEUE_COMMAND_MISSING` -> BG210/BG192 recovery.
- `GITHUB_CANDIDATE_PUSH_AUTH_INVALIDATED` -> repository workflow repair contract from Task 1; no blind retry until fixed revision is present.
- native transient provider/rate-limit fingerprints -> Class A bounded retry.

- [ ] **Step 2: Change PH Agent 15 contract from passive `REPAIR_REQUIRED` output to repair-policy participant**

Unknown failures return exact class/fingerprint/owner/safe repair and may call only exposed safe repair subscenarios. Known fingerprints skip the AI call.

- [ ] **Step 3: Verify known fingerprint bypasses AI and unfamiliar fingerprint is fail-closed**

Expected: known repair is deterministic; unfamiliar unsafe state becomes exact owner/hard boundary, not a generic retry.

---

### Task 5: Close obligations only on channel-specific production evidence

**Systems:**
- Modify `BG211`
- Reuse BG164 blog proof, BG171 native LinkedIn evidence and BG179 Instagram GetMedia readback.

**Interfaces:**
- Consumes: executor result plus channel-native/public verification.
- Produces: `PUBLISHED_PROVEN` with URL/native id and `production_verified_at`, or open repair state.

- [ ] **Step 1: Add RED verification canaries**

A Make execution `success` without native/public identity must not close.
An existing LinkedIn native id closes LinkedIn.
An Instagram media id confirmed by GetMedia closes Instagram.
A blog closes only after BG164/public URL canonical proof.

- [ ] **Step 2: Implement evidence gates**

Persist proof identity and verification timestamp; never infer success from scenario status alone.

- [ ] **Step 3: Run verification canaries and confirm GREEN**

Expected: false-green execution stays open; real proof closes.

---

### Task 6: Automatic Brain error/fix/prevention writeback

**Systems:**
- Modify `BG211`
- Reuse BG168 -> BG166 -> BG167.

**Interfaces:**
- Consumes: material new fingerprint or proven new repair/outcome.
- Produces: normalized learning with fingerprint, symptom, root cause, evidence, component/channel, forbidden retry, proven repair, regression contract, obligation key, production proof and cost impact.

- [ ] **Step 1: Add materiality/dedupe rule**

Repeated unchanged fingerprint/outcome must coalesce and must not trigger an AI call.

- [ ] **Step 2: Write one controlled learning canary through BG168**

Use fingerprint `publication-autonomy-controller-v1` or the proven GitHub auth fingerprint after Task 1.

- [ ] **Step 3: Verify BG166 persistence/readback**

Require execution evidence before claiming Brain persistence.

---

### Task 7: Reconcile today's publication backlog and prove autonomous steady state

**Systems:**
- BG211, BG171, BG179, BG192, BG164, GitHub Actions/Netlify, canonical publication records.

**Interfaces:**
- Consumes: all approved due/recently due obligations.
- Produces: no silently stuck due approved item.

- [ ] **Step 1: Run one bounded BG211 recovery sweep**

Expected: each due obligation is either already proven, dispatched/repairing, or exact human boundary.

- [ ] **Step 2: Re-run repaired blog delivery once, using the same immutable command/slug**

Verify candidate branch push succeeds with restored credentials, candidate PR exists, technical SEO gates run, canonical promotion path proceeds, and BG164 later records production proof. Do not create a new content identity.

- [ ] **Step 3: Verify LinkedIn due item and Instagram readiness through existing native executors**

If due and approved, dispatch; if no eligible Instagram candidate exists, record NOOP rather than inventing content solely to satisfy the guardian.

- [ ] **Step 4: Final readback**

Assert zero due approved publication records in passive `ERROR/WARNING/REPAIR_REQUIRED/BLOCKED` states without active safe repair or exact human-boundary state.

- [ ] **Step 5: Write final architecture learning to Brain**

Fingerprint: `powerhouse-publication-autonomy-controller-v1` with production evidence and prevention rules.

---

## Self-Review

- Spec coverage: all twelve success criteria are mapped across Tasks 1-7.
- Placeholder scan: no TBD/TODO/implement-later steps remain.
- Identity consistency: `publication_obligation_key` and canonical content/channel/scheduled-slot identity are used consistently throughout.
- Safety consistency: only existing channel executors perform external publishing; retry ceiling is one for Class A; candidate-PR chain remains mandatory.
