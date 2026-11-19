# 2026-11-19 — Relatiefeiten zijn zelf leesbare context (append-only)

- Fingerprint: `powerhouse|commercial|relationship-facts-not-human-readable-context|20261119-v1` (parent #4198)
- Gebeurtenis: `CONTRACT_CHANGE` — `composerSourcePreflight` laat twee relatiefeiten volstaan zonder `plan.human_readable_context`; het nieuwspad blijft die eis houden.
- Eigenaar: powerhouse-commercial-message-composer. Regressie: `tests/brain-composer-relationship-fact-20261106.test.mjs`.
- Bewezen: unit-tests. Niet bewezen: merge, productie-readback, gegenereerd bericht op echte data, verzending, reactie.
