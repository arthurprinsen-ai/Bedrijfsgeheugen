# 2026-11-17 — originele engineering false-negative selector: veilig herstel

- Hoofdincident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Original run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44166050762
- Owner: existing agent:agent-integration-engineer and original Daily Self Evolution
- Before: original workflow SUCCESS, candidate selected=false; two original Brain entries PROTECTED_BUILD_DUE; zero actual code delivered
- Historical parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5109 MERGED Oct 29 12:39 UTC, new candidate 55bb0754 created 12:43 UTC
- Root cause: blanket parent_pr veto treated an already merged SQL prerequisite as duplicate read-model work
- Scope: original selector, one new regression, one learning record, one human change doc and this immutable ledger
- New proof gate: exact GitHub prior MERGED/main/valid SHA, merged before candidate created, source paths disjoint, no same-candidate marker
- Existing proof preserved: immutable source revision, owner, CAS, original action digest/rollback, duplicate PR fence, max8 changed files, Required, CodeQL and protected delivery
- No new queue, agent, scheduler, sender, migration, OAuth, RLS or direct production write
- Release status: protected candidate, not production green. Reconcile next original code run and actual protected PR or audited no-change, then independently verify production + consumer + measured effect + applied learning
