# 2026-10-19 — Canonical OpenAI blog runner key via protected Vault

The OpenAI blog generator and static translation preparation have replaced Anthropic, but daily publication run [39272994778](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39272994778) failed with `STATIC_I18N_OPENAI_KEY_MISSING`. The current GitHub repository has no `OPENAI_API_KEY` Actions secret. The key already exists in the **service-role-only** Supabase Vault.

## Minimal correction

The existing GitHub Actions secrets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are made available exclusively to a trusted Vault resolver step. It calls only the canonical production project and only `bg_geheim('OPENAI_API_KEY')`. The resolver validates the scalar key, registers a GitHub Actions mask **before** writing `OPENAI_API_KEY` into ephemeral `GITHUB_ENV`, and never writes credentials to the repository, PR, test artifacts or console output. The native-approved and Powerhouse daily blog workflows reuse this same resolver. Blank `secrets.OPENAI_API_KEY` environment overrides have been removed.

## Safety and acceptance

- Supabase RPC permissions: `anon` and `authenticated` cannot execute `public.bg_geheim`; `service_role` can
- The credential is used only in the trusted main workflow run, not a PR fork or public website/client
- The OpenAI generator's public-aggregate privacy boundary, approved Notion stock and uniqueness gates are unchanged
- Full English translation cache, Required CI, CodeQL, protected merge, Netlify deploy and exact public blog readback remain mandatory
- This change is not authorization to send CRM email or publish repeated LinkedIn personal content

Test: `tests/brain-blog-openai-vault-runner-20261019.test.mjs`. Incident proof: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39272994778
