# Kansenradar — broncoherentie vóór content of outreach (2026-11-03)

De originele Kansenradar is functioneel hersteld met OpenAI `gpt-5-mini` (Edge v15, native BRAIN GREEN 12:16 UTC), maar onafhankelijke Notion-readback liet een kwaliteitsfout zien: concept `40dda36a-ac8a-8105-832d-de23622e631a` had de titel "Stijging vakantievluchten overtroeft daling zakelijk vliegen" en een haak over Invest-NL, agritechfinanciering en toelatingsprocedures, afkomstig uit een samengestelde change.inc-/nieuwsupdate-pagina. De bron bevat meerdere afzonderlijke onderwerpen; titel/haak is niet bewezen één nieuwsfeit.

## Directe containment
Originele Notion-mediakalender `BG-505`: `Genereren=__NO__`, `Publicatiecheck=Geblokkeerd`, met foutbeschrijving. Apart teruggelezen vanuit Notion. De twee originele `powerhouse_sales_actions` rijen met exact hetzelfde `signaal_url` stonden op `skipped`, niet `done`; geen extern verzendbewijs. De kwalitatieve fout is in `public.brain_failure_registry` onder `powerhouse|content|kansenradar-source-title-hook-mismatch|20261103-v1` geobserveerd.

## Permanente bronveiligheid
Originele `supabase/functions/bg-kansenradar/index.ts` importeert `kansenradar-source-coherence-gate.mjs` en beoordeelt iedere toegestane bron **vóór** OpenAI-toets, Notion-concept en DM-draft. Invalide URLs en herkenbare meer-artikel overzichten zoals `/nieuwsupdate-`, `/nieuwsoverzicht` en `/news-roundup` worden fail-closed genegeerd. Elke afwijzing logt via bestaande `bg_bewijs(false,...,'VALIDATION')` met bron-URL/reason; als er geen veilig bronkandidaat resteert is het resultaat `GEEN_BRONCONSISTENTE_SIGNALEN` zonder materiaal te verzinnen. Deze conservatieve heuristiek is geen universele semantische factcheck; de originele redactie houdt haar bron- en kwaliteitspoorten.

## Releasegates
`tests/brain-kansenradar-source-title-hook-coherence-20261103.test.mjs` bevat de echte incident-URL, tegenvoorbeelden, misvormde URLs, bronvolgorde en regressie van OpenAI-only, scheduler-token, draft-only gedrag. Required/BRAIN/CodeQL op definitieve SHA, exclusieve writer en beschermd mergen. Alleen originele Supabase Edge-integratie mag uitrollen; provider source/readback, negatieve 401-test en volgende natuurlijke run bepalen werkelijke status. Het geblokkeerde eerdere Notion-concept mag niet zonder onafhankelijke redactionele broncontrole worden heropend.
