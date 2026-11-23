# 13 November 2026 — permanent source / provider / consumer terminal release evidence

Parent P0 [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198) and merged original terminal proof [#5724](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5724).

## Incident and production readback

The protected SQL migration source `20261113083000_original_one_chain_content_terminal_proof_guard_v1.sql` is present on `main` after #5724 merged, but the original production Supabase project `adhjwmvyoixzjtmiroln` still reported only 842 applied migration identities, ending at 082500; its `brain_obligations` table had no `brain_content_handoff_terminal_proof_guard_v1` trigger at the observed read-only check. Thus GitHub Required/CodeQL/merge `!=` applied SQL `!=` a functioning original content chain. Current loop assurance reported 9 GREEN / 6 RED and 365 OPEN original content handoffs; neither an idle queue nor postmerge run is automatically success.

## Single original route, now fail closed

Do not add a monitor or scheduler. Extend the original postmerge `obligation-terminal-closure.yml` migration-only code path: `tools/delivery/supabase-migration-production-readback.mjs`.

1. Parse immutable protected diff migration paths into exact `version+name` identities; reject duplicate versions with different filenames.
2. Authenticated, read-only original production provider SQL returns **both** `version` and `name`; a version alone, wrong name, absent, duplicate or unauthorized response rejects terminal closure.
3. From 083000 onward, a second query in the SAME verification checks the canonical `brain_obligations` trigger exists, is enabled, references the original `SECURITY INVOKER` function with no `anon/authenticated` EXECUTE, and still contains source-ACK, veto and outcome fail-closed error classes. Missing = `SUPABASE_ONE_CHAIN_TERMINAL_GUARD_NOT_ACTIVE`, never green.
4. Preserve the original migration-only terminal `mode=github_main` mapping **only after** the two provider proofs succeed; do not substitute Netlify readback. Preserve original #171 content/learning source ACK and consumer/learning checks separately.
5. On failure, the existing original GitOps migration owner independently diagnoses source-applied lock drift, repairs through the protected source/promotion process, then reruns original terminal provider readback with the same PR/merge identities. Do not write directly to production from this gate, fabricate migration history, disable protected checks, or resend posts.

Regression: `tests/brain-supabase-migration-production-readback-v1.test.mjs` runs negative and positive cases. Existing skill `.agents/skills/release-deployment-readback/SKILL.md` and ONE BRAIN learning record carry the rule for subsequent agents.

## Acceptance (not an automatic green claim)

- Protected PR exact-head Required + CodeQL + original BRAIN admission pass, and the patch is merged by the canonical route.
- Existing original 083000 migration independently appears **applied** with the correct name, and the enabled trigger/security/function proof is true in production.
- Current main source lock correctly advances only after actual provider application; no provisional 843 claim.
- Original natural #171 runtime continues with matching source revision / consumer ACK and no false terminal closures; 365 OPEN handoffs and other 6 RED loops are resolved by their original owners with provider and outcome evidence.
- Future migrations after 083000 cannot pass terminal closure if the original trigger disappears or is disabled.

A permanent preventive check cannot guarantee that no future failure is possible. It ensures an observable failure never silently becomes a green terminal claim.
