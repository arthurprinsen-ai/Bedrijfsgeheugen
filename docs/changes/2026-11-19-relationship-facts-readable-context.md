# 2026-11-19 — Relatiefeiten zijn zelf leesbare context

Probleem: na de fix van 18 nov haalt een connectie-actie met functie en bedrijf de composer nog steeds niet. `composerSourcePreflight` eist altijd `plan.human_readable_context===true`; de plan-view zet dat alleen bij headline, samenvatting, publieke bron, inbound of reply. Een relatie-actie kan dat dus nooit halen.

Fix: twee verifieerbare relatiefeiten tellen zelf als leesbare context (besluit 27 okt 2026). Het nieuwspad blijft `human_readable_context` eisen. Alle overige poorten (kwaliteitsscore, verboden woorden, feiten, lengte, anker, topic-leak, novelty) zijn ongewijzigd; er is geen verzendautorisatie toegevoegd.

Bewezen: unit-tests. Niet bewezen: berichtgeneratie op echte data, producer voor connecties zonder predictieve brief, verzending, reactie. Fingerprint `powerhouse|commercial|relationship-facts-not-human-readable-context|20261119-v1`.
