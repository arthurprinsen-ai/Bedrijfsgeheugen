# 2026-11-18 — Connecties-feiten bereiken de composer (append-only)

- Fingerprint: `powerhouse|commercial|connections-own-facts-never-reach-composer|20261118-v1` (parent #4198)
- Gebeurtenis: `CONTRACT_CHANGE` — `relationshipFact()` valt terug op `role` en `company_name` van de actie zelf (besluit 27 okt 2026), omdat `evidence.relationship_evidence` door geen producer wordt gevuld.
- Eigenaar: powerhouse-commercial-message-composer. Regressie: `tests/brain-composer-relationship-fact-20261106.test.mjs`.
- Bewezen: unit-tests en lokale learning-canonicalisatie. Niet bewezen: merge, productie-readback, gegenereerd bericht op echte data, provider-bevestigde verzending, reactie.
- Fouten tijdens levering: PR-metadata met ongeldige `Delivery-Lane`/`Candidate-Type` (hersteld naar backend/implementation); learning-record zonder `failure_class` en `evaluation` (aangevuld); sluitingsset zonder activity-ledger (deze regel).
