# 2026-08-30 — Verplichte chat-lessons zonder afdwingbare prevention rule

## Type
ERROR → RECOVERY → CONTRACT_CHANGE

## Fingerprint
`brain-chat-learning|completeness|required-lesson-without-active-prevention-rule`

## Symptoom
De complete chat-learning test verplichtte vijf nieuwe lessons, maar de lijst met verplichte actieve prevention rules was niet tegelijk uitgebreid. Daardoor kon een lesson machineleesbaar aanwezig en verplicht zijn terwijl er geen aparte actieve preventieregel werd afgedwongen.

## Getroffen lessons
- `FUTURE_COMPONENTS_AUTO_REGISTER_IN_BRAIN_AND_COST_DASHBOARD`
- `UNMETERED_PROVIDER_USAGE_IS_NEVER_ZERO`
- `PRODUCTION_GREEN_REQUIRES_EXACT_DEPLOY_IDENTITY`
- `PRIVATE_AUTH_PAGES_USE_AUTH_SCANS_NOT_PUBLIC_SEO_RULES`
- `REMOTE_WRITES_REQUIRE_AUTHORIZED_CONNECTOR`

## Root cause
`requiredLessonIds` en `requiredPreventionRules` evolueerden als onafhankelijke handmatige lijsten. De test bewees wel dat nieuwe knowledge aanwezig was, maar niet dat iedere nieuwe verplichte lesson ook naar een actieve prevention rule leidde.

## Mislukte aanpak
Alleen de lesson-index uitbreiden en aannemen dat het vrije-tekstveld `prevention` voldoende operationele borging is. Kennis zonder machine-afgedwongen prevention kan door een volgende agent alsnog worden genegeerd of verkeerd geïnterpreteerd.

## Definitieve fix
- Vijf concrete actieve prevention rules toegevoegd:
  - `AUTO_REGISTER_FUTURE_COMPONENTS`
  - `MARK_UNMETERED_USAGE_NOT_ZERO`
  - `REQUIRE_EXACT_DEPLOY_IDENTITY_BEFORE_PRODUCTION_GREEN`
  - `CLASSIFY_PRIVATE_AUTH_BEFORE_PUBLIC_SEO_SCANS`
  - `REQUIRE_AUTHORIZED_CONNECTOR_FOR_REMOTE_WRITES`
- Meta-rule `REQUIRE_ACTIVE_RULE_FOR_REQUIRED_CHAT_LESSON` toegevoegd.
- `brain-chat-learning-complete` koppelt vanaf de huidige completeness-baseline iedere nieuw verplichte lesson expliciet aan een actieve prevention rule.
- Alle lessons in de append-only current-execution shard worden automatisch gecontroleerd op een expliciet `preventionRule`-veld en op een actieve overeenkomstige rule.

## Preventiecontract
Vanaf deze baseline mag een nieuw required lesson-ID niet groen worden tenzij in dezelfde candidate ook zijn concrete prevention mapping en actieve rule bestaan. Zo kan de lesson-lijst niet meer zelfstandig vooruitlopen op de preventielaag.

## Herbruikbare les
**Kennis is pas volledig geborgd wanneer detectie, lesson, concrete preventie en executable regression samen groen zijn.** Een verplichte lesson zonder actieve preventieregel is incomplete learning en moet fail-closed blijven.

## Owner
`agent-reliability`

## Regression gate
`tests/brain-chat-learning-complete.test.mjs` via `Shared Agent Memory Tests` en Unified BRAIN Delivery.
