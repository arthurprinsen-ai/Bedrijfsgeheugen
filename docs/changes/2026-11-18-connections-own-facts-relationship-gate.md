# 2026-11-18 — Connecties-feiten bereiken de composer

Probleem: 23.000 connecties in Notion, geen verstuurd bericht. Het besluit van 27 okt 2026 (functie, bedrijf, eerder gesprek of status in_gesprek zijn verifieerbare feiten) las alleen `evidence.relationship_evidence`; dat veld wordt nergens gevuld (0 van de sales-acties in 30 dagen).

Fix: `relationshipFact()` gebruikt terugvalwaarden `role` en `company_name` van de actie zelf. Minimaal twee verschillende feiten blijven nodig; alle overige composer-poorten (verboden woorden, feiten, lengte, anker, topic-leak, menselijke context) zijn ongewijzigd.

Bewezen: unit-tests. Niet bewezen: berichtgeneratie op echte data, verzending, reactie. Eigenaar: powerhouse-commercial-message-composer. Fingerprint `powerhouse|commercial|connections-own-facts-never-reach-composer|20261118-v1`.
