# 5 november 2026 — meerdere experimenten in één post maken Powerhouse niet zelflerend

Canonical parent: [ONE BRAIN autonomy](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198).

## Bronvaststelling
Vandaag is de oorspronkelijke `linkedin_company` single-variable test `li-lus-co-20261030` op `hook_type=concrete_number` actief; de exact provider-gepubliceerde post 3 november is gekoppeld aan slechts **4** echt gemeten impressies en 0 reacties/klikken. De bestaande provider metingen zijn na de Windsor SQL + Edge source bridge nu daadwerkelijk in `social_metric_snapshots` en `social_learning_evaluations` vastgelegd als `PROVIDER_METRICS_OBSERVED_LOW_EXPOSURE`, zonder causale lift of omzetclaim. Oorspronkelijke 15 lusstatussen: 8 GREEN, 3 AMBER, 4 RED.

De oorspronkelijke contentgenerator bouwde drie onafhankelijke creatieve instructies: de `measured_next_post_test`, een dagelijkse `editorial_exploration` en `linkedin_loop` via `bg_social_lus_cyclus`. De code kon twee of drie experimentele copyveranderingen tegelijk aanbieden, ook als `linkedin_loop` al een actieve een-variabele-test beheert. Daardoor is de betekenis van het geobserveerde effect niet meer toewijsbaar.

## Gebouwde preventie zonder extra agent
De bestaande pure `measured-next-post-challenger.mjs` exposeert `arbitrateOriginalEditorialExperiment`:
- Bestaand actief of nieuw een-variabele LinkedIn-experiment heeft voorrang, **exact één**.
- Zonder zo'n experiment heeft de werkelijk gekwalificeerde measured challenger voorrang.
- Zonder die twee mag hoogstens één veilige, bewijsgebonden dagelijkse hypothese worden meegegeven.
- Anders blijft standaardredactie actief; geen extra experimentele verandering.
- Onderdrukte `proposed_test`, `hypothesis_id` en `single_change` worden expliciet leeggemaakt vóór prompt, editorial council en generatie. Daardoor zijn niet slechts twee syntactische zinnen minder, maar ook het daadwerkelijke AI-invoerobject en immutable generation-evidence correct.

De oorspronkelijke `powerhouse-content-orchestrator` blijft enige owner. Er zijn geen wijzigingen aan social sender, OAuth, bronauthorisatie, tekst-/Mira-kwaliteitsgrens, idempotency, source dedupe of bestaande scheduler.

## Evaluatiestandaard
Vóór iedere inhoudelijke promotie: echt toegepast variantonderdeel op exact dezelfde providerpost, vergelijkbare nulmeting en bij voorkeur control/holdout, > minimale exposure waar passend, onafhankelijk provider-ID/URL/readback, GA4 of order waar relevant, gevolgd door regressiecontrole en volgende natuurlijke uitvoering. Een kleine before-after observatie zonder controle blijft `TESTING` en nooit bewezen positief. Deze aanpak sluit aan bij [OpenAI's trace grading](https://developers.openai.com/api/docs/guides/trace-grading) en [Google's Rules of ML](https://developers.google.com/machine-learning/guides/rules-of-ml).

**Release boundary:** PR-merge zonder live Edge source-byte readback en volgende echte `powerhouse_content_artifacts.generation_evidence.editorial_experiment_owner` is géén bewijs dat de gedragsverandering in productie is uitgevoerd.
