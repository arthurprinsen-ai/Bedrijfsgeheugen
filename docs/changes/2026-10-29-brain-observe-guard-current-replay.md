# 29 October 2026 — fail-closed Brain observe migration guard on already-canonical Supabase Preview

**Obligation:** `delivery|supabase-preview|brain-failure-observe-source-guard-replay|20261029`.

A Supabase Preview of protected migration lock PR #5106 failed at statement 3 of `20261022173500_brain_failure_observe_semantic_guard_v1.sql`, raising `BRAIN_FAILURE_OBSERVE_SOURCE_DRIFT`. The historical guard expected only the old pre-repair `evidence=coalesce(p_evidence,evidence)` source. Independent production readback shows an **already upgraded** function body: `evidence=coalesce(evidence,p_evidence)`, semantic event identity and conflict rules, advisory locking, `SECURITY DEFINER`, search-path protection and service-role-only EXECUTE. Provider snapshots may already contain the safe upgraded function when replay starts.

**Narrow idempotence repair:** keep the old exact pre-repair source identity gate AND retain the failure on unknown/unsafe bodies, but also accept a current already-safe implementation **only** if all source markers and owner-only ACL checks pass. Do not remove/relabel the guard, skip the preview, set green manually, change Supabase migration history, deploy new schema, create another writer, or relax verification of existing evidence-preserving writes.

**Scope:** guard precondition only in original tracked SQL migration; the subsequent canonical function definition, index, conflict logic, RLS/ACL and transaction are unchanged. The original pre-patch source remains intact in immutable Git history; no force push or history rewrite. Strict regression and executable Supabase Preview must confirm correct replay.

**Status:** candidate only. Required/CodeQL, protected merge and fresh Supabase Preview provider readback needed. The separate 774-row migration lock PR #5106 remains blocked until this actual replay contract is fixed.
