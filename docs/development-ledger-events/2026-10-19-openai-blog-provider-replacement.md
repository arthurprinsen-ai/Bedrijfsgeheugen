# Delivery ledger — OpenAI replaces Anthropic in two active blog pipelines

Obligation-ID: openai-native-blog-and-i18n-provider-replacement-20261019

Observed error 1: `STATIC_I18N_PRODUCTION_TRANSLATION_FAILED: STATIC_I18N_PROVIDER_BILLING_BLOCKED: Anthropic HTTP 400`, in [run 39174978217](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39174978217).

Observed error 2: Claude Code action `Could not fetch an OIDC token`, in [run 39236467385](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39236467385).

Change: dedicated `generate-openai-approved-blog.mjs` using OpenAI Responses structured output from BRAIN evidence; switched native workflow to this runner. Prepublish English static translation now invokes the already existing OpenAI validator directly; removed Anthropic primary call and Anthropic secrets from canonical daily workflow. Existing authorizations and exact delivery gates preserved.

Regression: `tests/brain-openai-native-approved-blog-20261019.test.mjs`, `tests/brain-blog-approved-translation-provider-failover-20261019.test.mjs`, `tests/delivery-powerhouse-blog-i18n-prepublish.integration.test.mjs`, plus historical i18n cache tests.

Current state: changes committed to PR branch; CI and real production provider readbacks are required, not assumed. No external recipient messages or public article releases created by this engineering correction.
