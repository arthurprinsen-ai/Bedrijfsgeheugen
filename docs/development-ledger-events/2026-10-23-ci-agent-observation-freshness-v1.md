# 2026-10-23 — adviesrecency als voorwaarde voor autonome CI-prioriteit

Fingerprint: `delivery|multi-agent|ci-advice-observation-freshness|20261023-v1`; één canonieke eigenaar #4661.

Broncontrole: `tools/delivery/ci-agent-priority.mjs` telde wel uitgevoerde jobs, onafhankelijke workflowpogingen, deduplicatie en echte herhaalde medianen, maar toetste `observed_at` niet aan een actuele klok. Het JSON-artefact is daardoor tijd-onbegrensd herbruikbaar. Preventie: strikt canonical ISO 8601 UTC met milliseconden en max 2 uur bij de bestaande uurlijkse Janitor. Een toekomstig, ontbrekend of verouderd snapshot levert nul agentprioriteiten en nul mutatiebevoegdheid. `tests/brain-ci-agent-prioritization-v1.test.mjs` bewaakt dit, naast oude regressies en failclosed Required/CodeQL. Geen tweede agent, cron, register, provider-mutatie of CI-run ingevoerd.

Releasestatus: kandidaat totdat beschermd gemerged en bestaande Janitor-output onafhankelijk is gecontroleerd. Een echte reductie van totale lead time is niet bewezen.