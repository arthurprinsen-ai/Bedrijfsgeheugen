# Correctie 14 november 2026 — Bestaande Powerhouse bronresearch sluit alle 123 relaties onterecht uit

## Werkelijke productieoorzaak
Na protected merge van PR #5759 draaide de originele Supabase-helper maar leverde hij 0 extra onderzoeksacties. De 30-dagencontrole keek naar **alle** interne `research_enrichment`-acties. Elk van de 123 expliciet goedgekeurde zakelijke e-mailcontacten had gedurende die 30 dagen een generieke, vaak bronloze interne researchactie. Dat is niet gelijk aan een recent onafhankelijk geverifieerd actueel bedrijfsfeit. In de laatste 7 dagen waren er slechts 10; 113 kunnen onder voorbehoud van overige bestaande veiligheidsfilters onderzocht worden. Een groen cronresultaat is geen maildelivery.

## Gerichte aanpassing
Op de bestaande `powerhouse_prime_approved_connection_research_v1(date)` veranderen we alleen de generieke research-cooldown **30 naar 7 dagen**. Dit maakt een begrensde dagelijkse bronscan mogelijk op al goedgekeurde relaties zonder onnodige dagelijkse herhaling. Ongewijzigd blijven 5 *interne brononderzoeken* per dag, één brononderzoek per bedrijf, 90 dagen contact-cooldown, suppressions, negatieve replies, behoud van toestemming, kwaliteit van bericht en bron, originele #116 stage 2, en pas verzenden na geldige providerbevestiging en onafhankelijke Gmail-readback. Nieuwsbrief-executorautoriteit verandert hier niet mee.

## Door te lopen bewijs
Regressie: `tests/brain-original-approved-source-cooldown-correction-20261114.test.mjs`.
Vereist: protected Required/CodeQL, preview/SQL replay, exacte native Supabase migratie, `pg_get_functiondef` met 7d, service-only ACL, geen extra cron, natuurlijke originele stage-2-receipts, onafhankelijke bronvalidatie en alleen dan echte e-mails met onveranderlijk provider-ID. Nog geen nieuwe mails of omzet claimen op basis van alleen deze code.

ONE BRAIN: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
Eerste herstel: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5759.
Status bij opstellen: **alleen kandidaat, nog niet productielive**.
