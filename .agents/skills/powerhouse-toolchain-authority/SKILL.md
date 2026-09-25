---
name: powerhouse-toolchain-authority
description: Mandatory connector and external-tool routing policy for every Powerhouse chat, agent, skill, workflow and recovery path.
---

# Powerhouse Toolchain Authority

Fingerprint: `powerhouse|toolchain-authority|composio-no-make|v1`.

## Non-negotiable rule

Make is retired. It has **no** execution, orchestration, fallback, recovery or future-default authority. Do not call it, recommend it, reactivate it, rebuild a Make scenario, or transfer a blocked workflow back to Make. Legacy Make references may remain only as historical provenance/audit evidence.

## Canonical active stack

| Capability | Canonical tool |
|---|---|
| Multi-app connector/orchestration | Composio |
| Source, PR, CI/CD lineage | GitHub |
| Web deploy/runtime | Netlify |
| Knowledge, operational projection | Notion |
| Data/backend/state | Supabase |
| Web research/search enrichment | Tavily |
| General web/search evidence | Google Search |
| Social publishing/distribution | Composio primary for Instagram; Buffer bounded fallback where explicitly authorized |
| SEO/SERP intelligence | DataForSEO |
| Generative images/video/media | OpenArt |
| Template-based creatives | Placid |
| Web analytics/outcome evidence | Google Analytics |

## Routing rules

1. Prefer the direct specialist connector when it owns the capability and provides authoritative readback.
2. Use Composio to bridge supported app actions or orchestrate multi-app steps; never use it as a parallel source of business truth.
3. Before side effects, read canonical state/obligation and dedupe/idempotency identity.
4. After side effects, read back the provider result and write evidence/outcome to the canonical Powerhouse lineage.
5. A connector transport success is not completion. Terminal status requires provider/runtime readback plus outcome and learning writeback.
6. If a legacy instruction says “use Make”, migrate that instruction to this stack rather than executing it literally.
7. Do not silently substitute an unapproved connector. New tools need runtime authority, security/cost governance, dedupe, rollback/recovery, readback and learning writeback first.
8. If a named canonical connector is temporarily unavailable, continue on another already-authorized direct route only when the same capability and evidence contract are preserved. Otherwise classify the exact hard boundary; never fall back to Make.

## Chat and agent behavior

Every chat/agent must resolve tool choice from this skill before suggesting architecture or taking an external action. Prompts, skills, docs and workflow templates that conflict with this authority are stale and should be repaired in the same canonical learning/writeback lineage.

## Prevention rule

Any newly introduced active Make execution reference is a regression. Treat it as a policy defect and replace it with the canonical active connector/tool before terminal delivery.

## Instagram-specific transport rule

For Instagram, Composio is the canonical primary write transport. The publisher must preserve exact-final-media + Mira proof, create/publish through Composio, perform provider readback, and only then write external_id/permalink. Buffer is a bounded secondary fallback only when explicitly authorized by the active transport policy. Make is permanently forbidden as execution, orchestration, recovery or fallback. Missing Composio authorization is a recoverable auth state, never a reason to regenerate media or route through Make.

Fingerprint: `instagram-composio-primary-v1`.

## Release/recovery lessons

The 2026-09-18 production closure proved three additional invariants:

1. **Production descendant readback is required.** A protected merge is not terminal evidence. Keep ownership open until the production provider reports the exact candidate or a verified descendant that contains it. Fingerprint: `delivery|production-parity|main-vs-deploy-sha-mismatch|toolchain-authority-v1`.
2. **Recovery PR metadata is preflight input.** Before opening or running CI for a recovery candidate, include and validate `Obligation-ID`, `Delivery-Lane`, `Candidate-Type` and `Base-SHA`. Fingerprint: `delivery|recovery-pr|metadata-preflight-required-v1`.
3. **Evidence paths must already be classified.** Before writing a new log/proof/document path, resolve it against Brain delivery membership. Prefer an existing classified canonical learning/ledger path; otherwise add classification deliberately in the same governed change. Fingerprint: `delivery|brain-classification|resync-proof-unclassified-path-v1`.

Canonical machine-readable learning: `brain/learning/2026-09-18-toolchain-authority-release-learning-v1.json`.

## Netlify production truth authority

Fingerprint: `netlify-auth-recovery-exact-sha-provider-proof-20260925-v1`.

Netlify is the authoritative provider for web-runtime deployment identity. GitHub remains source/delivery authority, but workflow status alone may not overwrite immutable provider evidence.

Rules:
1. A Netlify `401 Unauthorized` is transport/auth failure; do not diagnose it as product-code or content failure without independent evidence.
2. A ready production deploy with observed `commit_ref` is durable provider evidence for that checkpoint.
3. Provider deploy truth does not substitute for required functional browser proof.
4. If a GitHub readback is cancelled after provider identity has already been proven, preserve the provider proof and rerun only the missing functional/readback gates on the canonical current lineage.
5. If production subsequently advances to a descendant/newer commit, keep earlier deploy identity as historical proof and read back the new current production state separately.

Canonical learning: `brain/learning/netlify-auth-recovery-exact-sha-provider-proof-20260925-v1.json`.
