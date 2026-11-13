# 13 november 2026 — oorspronkelijke provider 843 / ONE BRAIN terminal proof source lock

Fingerprint: `supabase|gitops|original-brain-terminal-proof-provider-843-source-lock|20261113-v1`, originele P0 [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198), [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215).

## Exact native productiebron
De beschermde oorspronkelijke [PR #5724](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5724) is MERGED op `5aea7dceae2be6f760e7abc885b328e01e5a4067` en bracht de enige SQL `20261113083000_original_one_chain_content_terminal_proof_guard_v1.sql`. Onafhankelijke productie-Supabase `adhjwmvyoixzjtmiroln` bevestigde op `2026-11-13T08:58:22.562780Z` **843 toegepaste en 843 unieke** migraties, laatste versie/naam exact `20261113083000/original_one_chain_content_terminal_proof_guard_v1`. Native `pg_trigger` bevestigt `brain_content_handoff_terminal_proof_guard_v1` ingeschakeld (`O`) vóór INSERT/UPDATE op bestaande `public.brain_obligations`, met SECURITY INVOKER (`prosecdef=false`). De originele GitHub `supabase/migration-history.lock.json` was op die commit nog 842.

## Één originele writer, strikt bron-only
Bewaar de reeds onafhankelijk bewezen 842 originele migratie-identiteiten onaangeroerd en voeg uitsluitend de daadwerkelijk toegepaste 843e versie/naam toe, met het echte waarnemingstijdstip. Geen SQL uitvoeren, RLS wijzigen, nieuwe agent/provider/scheduler, historische data herschrijven of providerpost fabriceren. De originele `agent-data-quality` en `release-deployment-readback`-skill uit eerdere releases vereisen reeds exact provider→source-lock→BRAIN. Nieuwe regressie: `tests/brain-original-provider-843-terminal-proof-lock-20261113.test.mjs`. Machine learning en menselijk append-only incidentlog bevestigen oorzaak, herstel, controle en preventie.

## Bewijsgrenzen
Beschermde Required/CodeQL → native merge → exacte merged-main volledige BRAIN-delivery → onafhankelijke Supabase 843/843 en bron-lock 843. Deze keten bewijst een databaseguardiantsource en haar historie, niet dat bestaande Instagram onmisbaar media/bewijs heeft, dat LinkedIn/blog al gemeten/geleerd zijn of dat een klantactie Portal→Heartbeat→CRO effect is bewezen. Deze verplichtingen blijven OPEN bij de oorspronkelijke eigenaar.
