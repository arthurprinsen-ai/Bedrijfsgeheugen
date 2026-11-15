# 15 november 2026 — boundary-veto blijft behouden bij gegroepeerde bronidentiteit

Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Bronoorzaak

De bestaande originele `Completion Supervisor Backfill Resume` combineert historische bronwaarnemingen op `identity`. In `candidateFromGroup` werd de eerste `obligation`-waarneming als enige beslissingsbron genomen. Bij twee oorspronkelijke rijen met dezelfde identity, waarvan één `PENDING` en één onafhankelijk bewezen `WAIT_EXTERNAL` met volledig herstelpakket, kon de eerste de tweede overschrijven. Daardoor kon `activeDispatches` ten onrechte een nieuwe coalesced wake tonen. Dit is een broncode-invariant, **geen bewijs van een daadwerkelijke ongeautoriseerde verzending**.

## Herstel binnen één bestaande keten

- Evaluatie van iedere oorspronkelijke bronwaarneming binnen dezelfde identity.
- Eén compleet en bewezen `WAIT_EXTERNAL`-besluit wint van elke veilige oude vertegenwoordiger, ongeacht inputvolgorde.
- `activeDispatches` houdt de bestaande oorspronkelijke verplichting buiten hervatting zolang die grens bestaat.
- Historische bronkandidaten, originele `obligationId`, digest, eigenaar, idempotency key, bestaande runner en append-only Supabase-dispatchhistorie blijven behouden.
- Geen extra agent, cron, queue, provider-write, financiële autorisatie, OAuth-omzeiling of historische statuswijziging.

## Negatieve regressie

`tests/brain-completion-supervisor-backfill.test.mjs` bevat dezelfde source identity tweemaal en toetst beide bronvolgordes; beide moeten één auditkandidaat, twee originele waarnemingen, `WAIT_EXTERNAL` en **nul dispatches** geven. De bestaande 1201-kandidaten-idempotency/geen fanout en alle natuurlijke due-policy tests blijven vereist.

## Afsluitvoorwaarden

Een code-commit of geslaagde workflow bewijst uitsluitend deze preventieregel. Vereist zijn Required/BRAIN/CodeQL op actuele head, beschermde merge, exacte hoofdrevisie, daarna natuurlijke originele backfill met bron- én consumer-readback. De oudere open `brain_obligations`, omzet, e-mail/LinkedIn/Instagram-publicaties en bedrijfsresultaten worden niet automatisch gesloten. Zonder onafhankelijke `PROCESSED`/provider-/outcome-ACK blijft P0 OPEN en is FULL_GREEN onjuist.
