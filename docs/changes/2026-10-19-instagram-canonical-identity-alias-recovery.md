# Instagram verified canonical identity selection (2026-10-19)

**Obligation:** instagram-canonical-identity-alias-recovery-20261019  
**Parent:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

Provider inspection confirmed two different Instagram identities: the default **@bedrijfsgeheugen.nl** account uses the alias `bedrijfsgeheugen-nl-canonical`, while older 'Mira' aliases are attached to **@arthurprinsen**. The setup function previously preferred only `bedrijfsgeheugen-mira-canonical`; this can produce `BLOCKED_AMBIGUOUS` when multiple account connections are present, despite a correctly verified business account.

**Change:** The shared pure selector accepts the two exact canonical alias strings *only after* verifying the provider-returned username `bedrijfsgeheugen.nl`. With one matching canonical connection it selects that account; with multiple matching canonical candidates it remains blocked. If no approved aliases are found, only one provider-verified target account may be selected. An unrelated account can never be selected by alias alone.

**Regression:** `node --test tests/brain-instagram-canonical-connection-alias-20261019.test.mjs` covers current + historic aliases, ambiguous matches, wrong identity, no valid identity, and wiring.

**Scope boundary:** This fixes selection logic, not token permissions or Mira media policy. The existing video has identity proof below 0.94 and another candidate was blocked by upstream Responsible AI moderation. No publication, alternative media approval, reduced identity threshold or artificial LIVE_PROVEN claim is allowed. Require exact CI, protected merge, authorized Supabase deployment, provider identity readback, then independently approved exact final media before publishing.
