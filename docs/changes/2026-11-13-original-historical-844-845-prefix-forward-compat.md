# 13 november 2026 — historische migratietests moeten een onveranderlijke prefix bewijzen

## Echte terminale testfout

Oorspronkelijke [PR #5737](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5737) staat beschermd gemerged en de provider/bron-lock is **correct** op 845 exacte migratie-identiteiten. Toch faalde de oorspronkelijke [Obligation Terminal Closure #43432785095](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43432785095) door BRAIN backend [#43432825805](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43432825805), job `131910653971`: precies één oude historische test eiste nog `lock.applied.length===844` en `lock.applied.at(-1)` = migration 844. De provider heeft inmiddels terecht 845 toegepast, zodat deze test een legitieme verlenging ten onrechte als regressie behandelde. De nieuwe 845-historische test bevatte dezelfde fout voor later 846.

## Canoniek herstel volgens reeds bestaande 843-test

De originele onafhankelijke `tests/brain-original-provider-843-terminal-proof-source-lock-20261113.test.mjs` gebruikt het correcte, strikte patroon: minimaal N applied, originele N-de versie/naam exact op **index N-1**, originele voorganger op index N-2, unieke oplopende versies en `captured_at` nooit ouder dan de oorspronkelijke providerobservatie.

De bestaande historische 844- en 845-regressies worden **alleen als testbron** hersteld:

- `lock.applied.length >= N`, niet gelijk aan N;
- immutable `lock.applied[N-1]` en voorganger index `N-2`, niet `at(-1/-2)`;
- unieke hele huidige providerreeks en lexicografisch oplopende versies blijven verplicht;
- `Date.parse(lock.captured_at) >= Date.parse(original_observation)`, nooit exacte verouderende timestamp;
- in-memory fictieve toekomstige migratieappend toont dat de oorspronkelijke N-de identiteit behouden blijft. Die fictieve rij wordt nooit opgeslagen of als providerbewijs beschouwd.

Geen wijziging in `supabase/migration-history.lock.json`, geen nieuwe migratie, productie-SQL, credentials, trigger, cron, publisher of mitigatie van echte BRAIN-fouten. De onafhankelijke huidige bron/providerpariteit blijft de taak van de bestaande canonieke checks; historische tests beschermen hun originele onveranderlijke deel. Permanente agent- en release-skillregel plus machineleerrecord en ledger zijn toegevoegd.

## Acceptatie

Beschermde exact-head Required/CodeQL en oorspronkelijke BRAIN na merge; onafhankelijk actuele Supabase-versie/name check en bron-lock 845 (of hoger als echt provider-observed). Alleen de oorspronkelijke terminal workflow mag nieuwe terminale evidence als SUCCESS registreren. Bestaande open content-, provider-, veto-, meet-, leer- en omzetverplichtingen blijven expliciet open totdat hun eigen resultaten geverifieerd zijn.

Origineel incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
