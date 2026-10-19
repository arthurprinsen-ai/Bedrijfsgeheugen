# Development ledger — OpenAI Vault credentials for canonical blog runners

- **Obligation:** blog-openai-vault-runner-key-20261019
- **Date:** 2026-10-19
- **Observed error:** `STATIC_I18N_OPENAI_KEY_MISSING` in GitHub Actions run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39272994778
- **Root cause:** no GitHub Actions `OPENAI_API_KEY` repo secret; key already present in Supabase Vault
- **Scope:** existing daily Powerhouse blog and native approved blog supply jobs; one shared server-side runner helper
- **Change:** pin Supabase project, only service-role RPC, validate key, execute allowlisted producer with in-memory private environment, never write or echo token; strip the service-role identity from child
- **Privacy:** no public or authenticated RPC grant, no unrestricted provider access, no PII transferred into learning context
- **Recovery:** rerun protected daily blog workflow after approved tests and merge, verify exact website URL and content ID
- **Regression:** `tests/brain-blog-openai-vault-runner-20261019.test.mjs`
- **State:** awaiting Required CI, CodeQL and protected production acceptance; nothing marked sent or live without provider proof
