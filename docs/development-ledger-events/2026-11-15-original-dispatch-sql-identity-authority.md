# 2026-11-15 — één canonieke SQL-identiteit voor oude en nieuwe agent-overdracht

- **P0:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- **Fingerprint:** `powerhouse|one-brain|dispatch-jsonb-metadata-shadows-canonical-owner-state|20261115-v1`
- **Oorzaak:** JSONB-record werd na canonieke SQL-kolommen gespreid; zes identiteits-/statusvelden konden door optionele metadata worden overschreven, ook tijdens original-owner `putIfAbsent`-readback.
- **Productie-audit:** op 15 november 2026 14:20:56 UTC waren 6.017 originele dispatchrijen aanwezig, nul metadata-identiteitsvelden. Dit is een **preventieve codecorrectie** en geen aangetoonde productie-impersonatie.
- **Implementatie:** `tools/outcome-obligation-supabase-store.mjs` verwerpt conflicten en projecteert SQL-autoriteit als laatste, ongeacht JSONB. Negatieve test `tests/brain-outcome-obligation-supabase-store.test.mjs`.
- **Agents:** `agent-reliability` detecteert en herstelt via bestaande oorspronkelijke eigenaar; `agent-data-quality` verifieert onafhankelijke bron- en statuspariteit. Bestaande `.agents/skills/powerhouse-recovery-proof/SKILL.md` geactualiseerd.
- **Geen mutatie:** geen historische UPDATE/DELETE, nieuwe taakuitvoerder of parallelle scheduler; niet automatisch claimen dat consumer `PROCESSED` is.
- **Release:** eerst exact-head Required/BRAIN/CodeQL en beschermde merge; vervolgens ongewijzigde native Supabase-original-owner readback en oorspronkelijke natuurlijke backfill-run. Zonder providerresultaat blijft `LIVE_VERIFIED` onbewezen.
