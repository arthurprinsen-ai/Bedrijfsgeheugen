# Supabase preview capacity reason — provider wording replay

Date: 2026-10-23. Canonical capacity incident: [#4120](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4120). Provider incident evidence: [#4733](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4733).

## Verified defect
An independent, Supabase-owned check returned `cancelled: Maximum number of concurrent branches reached. You can update this limit in Project Integrations Settings.` The existing canonical classifier matched older “limit of concurrent preview branches” variants but not this actual message. Consequently it returned a generic non-success rather than typed provider branch-capacity exhaustion. Required **correctly stayed red**; only diagnosis precision was defective.

## Contained repair
Expand one regex in the existing `tools/ci/supabase-preview-diagnosis.mjs`, preserve newest Supabase-app ownership, exact-head check ID, terminal outcome and the existing Required gate. Update the capacity remediation to inspect PR branch ownership and the current integration limit subject to spending authorization; never delete another PR's live preview, waive CI or retry an unchanged failing configuration. Add executable cancelled/skipped and stale-success regression fixtures.

## Acceptance
Run `node --test tests/brain-supabase-preview-diagnosis-v1.test.mjs`, then immutable exact-head Required + CodeQL, protected merge and main source readback. No new workflow, queue, cron, agent, privilege, database migration, product UX, customer mutation or fabricated improvement evidence. This fixes provider diagnosis, **not** Supabase cost policy or automatic capacity allocation.
