# 17 november 2026 — Alle bestaande agents: eerst de incidentketen, dan pas afronden

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Foutoorzaak in de bestaande gesloten lus

De read-only ONE BRAIN-controle `brain/observability/incident-obligation-assurance.mjs` kon een door een agent als `VERIFIED` aangemerkt incident met gedocumenteerde reparatie en skillversie als `proven_recovered` opnemen, hoewel geen onafhankelijke `PROCESSED`-ontvangst van de oorspronkelijke leerconsument en geen later oorspronkelijk uitvoeringsbewijs waren aangetoond. Een eigen bevestiging `prevention_applied=true` is geen bewijs dat de volgende uitvoerder het gewijzigde gedrag gebruikt.

Productie-snapshot 17 november: 422 `CONTENT_HANDOFF` en 14 `INNOVATION_DELIVERY` origineel OPEN. Die aantallen zijn verschillende overdrachtsverplichtingen, geen telling van externe foutpublicaties en geen vrijbrief om records te bulk-sluiten.

## Concreet herstel in de huidige architectuur

1. Het bestaande `DEFAULT_AGENT_TEAM` blijft **14 agents**, maar elke specialist in de oorspronkelijke export krijgt automatisch vijf gedeelde incident-/herstel-/rapportage-/toegepaste-leer-/recurrence-taken, één gezamenlijke herstelplaybookreferentie en `incident-recovery.v1`. Een later toegevoegde specialist erft dit via dezelfde `BASE_AGENT_TEAM` → `DEFAULT_AGENT_TEAM`-transformatie. Er komt geen tweede agent, cron, sender of brain.
2. De bestaande read-only `reconcileIncidentObligations` krijgt een gekoppelde `learningReceipts`-bron (uitsluitend als argument bij echte bronverificatie, nooit door de agent verzonnen). De ontvanger moet een **andere oorspronkelijke eigenaar** zijn, met `consumer_state=PROCESSED`, onafhankelijke readback, identiek provider-event/fingerprint/source_revision/learning_application_ref/consumer_processed_ref en chronologisch geldige `applied_at`. De volgende natuurlijke run moet later zijn vastgelegd.
3. `root_cause_ref`, `regression_ref`, `prevention_rule_ref`, `documentation_ref`, `skill_version`, `source_revision`, `learning_application_ref`, `consumer_processed_ref`, `next_natural_run_ref` zijn verplicht om scoped recovery te attesteren. Bij ontbrekend bewijs geeft de oorspronkelijke auditor `RECOVERY_PROOF_MISSING` met expliciet `missing_proof` terug: een uitvoerder kan niet alleen met `VERIFIED` zijn eigen incident administratief sluiten.
4. De bestaande skills `.agents/skills/powerhouse-continuity/SKILL.md` en `.agents/skills/powerhouse-self-improvement-layer/SKILL.md` beschrijven één menselijke rapportage, incidentoccurrence, terugkeer naar oorspronkelijke eigenaar, veilige reparatie, rollback, regressie, skillversie, exacte release en de latere toepassing.
5. De bestaande ONE BRAIN `public.brain_observe_failure` en originele GitHub-Janitor/Powerhouse-observer blijven de feitelijke schrijvers. Dit is een extra bronverificatievoorwaarde, **geen nieuwe** incidentenregistratie of workflow. Een ontbrekende echte `learningReceipts`-bron blijft rood, ook als alle lokale tests slagen.

## Preventie en scope

Bij iedere echte fout (ook tijdens herstel) originele provider/event/run-identiteit vastleggen en idempotent bij hetzelfde fingerprint toevoegen; geen PII, secrets of ruwe privé-berichtinhoud naar gedeelde rapporten. Eén bronoorzaak, één oorspronkelijke eigenaar, bewijsbare regressietest, veilig rollbackplan. Externe OAuth/consent, budget, beveiliging en onomkeerbaar handelen worden nooit omzeild. Geen dubbel mailen, dubbel publiceren, nieuwe schedulers of kunstmatig `PROCESSED`-bewijs.

Regressie: `tests/brain-incident-learning-all-agent-closure-20261117.test.mjs` + bestaande `tests/brain-incident-register-self-fix-preflight-20261029.test.mjs`. Testscenario's: ontbreken van ontvanger, verkeerd fingerprint/source_revision, eigen agent als onafhankelijke consument, `RECEIVED_NOT_PROCESSED`, ontbrekende root cause/preventieregel/documentatie, te vroeg next-run bewijs, duplicate learn receipt en nieuwe herhaling na reparatie. Alle gevallen moeten fail-closed zijn.

## Oplevering en open punten

Een goede Required/CodeQL + protected merge bewijst codeveiligheid, niet complete autonome incidentverwerking. Voor productieclosure zijn exact geregistreerde bron- en consumerbewijzen van de volgende natuurlijke oorspronkelijke run, actueel runtime-agent-register, originele failure-occurrence readback en onafhankelijk provider-/effectresultaat nodig. Geen bewijs = originele verplichting blijft OPEN met eigenaar en volgende veilige actie. De site-, e-mail-, Instagram-, LinkedIn- en SEO-ketens kunnen afzonderlijk nog geblokkeerd zijn en blijven dat volgens hun eigen kanonieke bron tot onafhankelijk bewijs.

Gebruikte principes: Google SRE incidentrespons en postmortemactiepunten; Temporal activiteitsspecifieke retries (geen blinde volledige workflow-herstart); GitHub beschermde exacte-head checks. Zie:
- https://sre.google/resources/practices-and-processes/incident-management-guide/
- https://docs.temporal.io/encyclopedia/retry-policies
- https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks
