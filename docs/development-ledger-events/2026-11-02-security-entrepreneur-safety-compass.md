# Original ONE BRAIN development ledger event — 2026-11-02
- **Fingerprint:** `portal|security-trust|technical-only-ux-and-sensitive-detail-projection|20261102-v1`.
- **Type:** preventief trust-UX-/information-disclosure-ontwerprisico (geen bewezen incident of datalek).
- **Oorzaak:** bestaande Security Trust Center toont statuscodes en technische risicodetails zonder de ondernemersvraag eenvoudig te beantwoorden.
- **Herstel:** brongebonden Veiligheidskompas; alleen admin ziet interne detailstatistieken, risico-identifiers en observatiemetadata.
- **Owner:** bestaande Security Agent, Portal UX eigenaar en exclusieve writer.
- **Regression:** `tests/brain-security-entrepreneur-compass-v1.test.mjs`; plus de originele private trust boundary-tests.
- **Preventie:** geen false-green, geen veiligheidspercentage of onbewezen certificering, geen openbare interne technische details, geen tweede scheduler.
- **Proof:** bronbeveiliging en portaalproductie alleen LIVE_BEWEZEN na beschermde gates en onafhankelijke bronreadback.

- **Serverbeperking:** `netlify/functions/_security-trust-customer-projection.mjs` en geauthenticeerde `security-trust.mjs` beperken niet-admin payloads server-side; geen UI-only redactie.
- **Aanvullende regresstest:** `tests/brain-security-customer-projection-v1.test.mjs` toetst op afwezige interne details, overeind gebleven bronmomenten en behoud van de oorspronkelijke admin-grens.
