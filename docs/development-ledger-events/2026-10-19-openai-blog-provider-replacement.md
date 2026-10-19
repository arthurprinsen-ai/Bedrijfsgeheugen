# Delivery ledger — OpenAI replaces Anthropic in two active blog pipelines

Obligation-ID: openai-native-blog-and-i18n-provider-replacement-20261019

Observed error 1: `STATIC_I18N_PRODUCTION_TRANSLATION_FAILED: STATIC_I18N_PROVIDER_BILLING_BLOCKED: Anthropic HTTP 400`, in [run 39174978217](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39174978217).

Observed error 2: Claude Code action `Could not fetch an OIDC token`, in [run 39236467385](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39236467385).

Change: dedicated `generate-openai-approved-blog.mjs` using OpenAI Responses structured output from BRAIN evidence; switched native workflow to this runner. Prepublish English static translation now invokes the already existing OpenAI validator directly; removed Anthropic primary call and Anthropic secrets from canonical daily workflow. Existing authorizations and exact delivery gates preserved.

Regression: `tests/brain-openai-native-approved-blog-20261019.test.mjs`, `tests/brain-blog-approved-translation-provider-failover-20261019.test.mjs`, `tests/delivery-powerhouse-blog-i18n-prepublish.integration.test.mjs`, plus historical i18n cache tests.

Current state: changes committed to PR branch; CI and real production provider readbacks are required, not assumed. No external recipient messages or public article releases created by this engineering correction.

Additional two distinct, existing editorial agents migrated: Weekblog and blog-bijwerken now call OpenAI Codex Action v1 instead of Anthropic Claude Action. Both preserve the original page editing instructions, deterministic changed-file allowlists, and candidate-only writer behavior. A trusted scheduled bot is allowed, but its filesystem privileges are restricted to the workspace, with sudo dropped; runtime proof and a provider-account execution are still required.

Security review: GitHub Advanced Security raised `File data in outbound network request` on the first OpenAI generator candidate ([CodeQL alert 215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/security/code-scanning/215)). The underlying issue was real: the initial request body forwarded the entire downloaded local BRAIN learning JSON to OpenAI. The fixed implementation performs local-only candidate inspection and maps to a finite list of constant public editorial briefs; only approved literal public topic information is placed in the request. Added private sentinel test proving the private marker, buyer email, company and numerical revenue cannot appear in the outbound body. Reverification via required CI and CodeQL is mandatory before resolving the review thread.
