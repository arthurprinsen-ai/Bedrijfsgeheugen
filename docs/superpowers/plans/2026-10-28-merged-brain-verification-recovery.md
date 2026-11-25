# Merged BRAIN verification recovery implementation plan

> For agentic workers: execute inline with superpowers:executing-plans.

**Goal:** Resume exact original merged feedback verification without mutation authority.
**Architecture:** Existing Unified Brain Delivery, existing admission/lanes, explicit verification_only identity path; no new workflow or executor.
**Tech Stack:** GitHub Actions, Bash/jq, Node test.
**Spec:** docs/changes/2026-10-28-merged-brain-verification-recovery-v1.md

## Global constraints
Keep immutable source/base/head, same repo/main and actual merge containment. No promotion in verification mode. Never claim later tests ran before merge. Existing protected delivery and native Supabase only.

## Review focus
Malformed GitHub response, fork identity, wrong workflow ref, squash equivalence versus ancestor proof, and verification flag authority. Negative tests cover each.

### One bounded recovery
- [x] Reproduce merged identity rejection with real extracted Bash and fixture GitHub responses.
- [x] Require exact identity plus protected merge containment; preserve all lane/admission tests.
- [x] Exclude only moving-main mutation fencing in explicitly read-only mode; all promotion steps remain gated off.
- [x] Add Brain learning, shared agents, System Map, ledger and change documentation.
- [ ] Run targeted guards; independent review; protected candidate and exact-head BRAIN.
- [ ] Protected merge of current successor with genuine exact-head BRAIN then existing terminal closure readback; retain original #5040 missing historical premerge BRAIN as NOT_PROVEN.
