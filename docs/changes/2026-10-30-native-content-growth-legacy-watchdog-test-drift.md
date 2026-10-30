# Native Content Growth regression — 30 oktober 2026

Na de correct gemergede social-CRO-release (PR #5186, commit 8f0f68e) faalde de bestaande push-workflow `Native content growth contracts` op een **verouderde statische test**, niet op een herstelde publisher. Run 41034792790, job 123992869752, één fout in `tests/content-growth-daily-blog-watchdog-recovery.test.mjs`.

**Oorzaak:** de test verwachtte een oudere GitHub-ledger-backfill, een `BASE_SHA`-schrijver en historisch datumherstel. Deze route is bewust vervangen door het bestaande *read-only* watchdogcontract. De officiële Supabase/Powerhouse-dagpublisher blijft exclusief eigenaar; ouder GitHub-ledgerbewijs mag niet als actueel publicatiebewijs worden gerecycled.

**Reparatie:** uitsluitend de test wordt in lijn gebracht met de bestaande productiecode. Nieuwe checks bewijzen exacte datumselectie in Europe/Amsterdam, veilige no-op als de oude ledger de datum niet kent, onafhankelijk publicatie-readback, `contents: read` en het verbod op Git- of PR-schrijfacties. Er is geen wijziging aan de bestaande scheduler, workflow, socialproviders, OAuth, publisher, database, portaal of productierechten.

**Borging:** dezelfde fingerprint `content-growth|legacy-blog-watchdog-asserts-retired-history-recovery|20261030-v1` en historisch replaybewijs in ONE BRAIN, plus geactualiseerd ontwikkellog. Beveiligde Required/CodeQL, native push-test en hoofdbranchbevestiging blijven nodig. Een geslaagde test is geen nieuwe blog, lead, order of bewezen stijgende trend.
