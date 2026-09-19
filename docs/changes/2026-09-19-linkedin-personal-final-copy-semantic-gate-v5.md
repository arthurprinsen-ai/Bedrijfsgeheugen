# LinkedIn persoonlijk — semantische final-copy gate v5

## Incident
De persoonlijke LinkedIn-route kon zakelijke of consultantachtige copy accepteren wanneer upstream metadata aangaf dat er een persoonlijk anker was. Een oppervlakkige eerste-persoonswrapper zoals “ik”, “mijn”, “vandaag” of “weekend” was onvoldoende bewijs dat de uiteindelijke tekst werkelijk over Arthur als persoon ging.

## Root cause
De pre-publish review vertrouwde voor een belangrijk deel op aangeleverde booleans zoals `personal_life_topic`, `corporate_voice` en `company_page_interchangeable`. De uiteindelijke tekst werd wel op expliciete businesswoorden gecontroleerd, maar niet streng genoeg op een concrete geleefde persoonlijke gebeurtenis en consultant/thought-leadership-stijl.

## Fix
De exacte finale tekst wordt nu zelf fail-closed gecontroleerd:
- een concrete persoonlijke gebeurtenis of dagelijkse ervaring is verplicht;
- een dunne eerste-persoonswrapper is niet genoeg;
- business-, consultant-/thought-leadership- en geforceerde businessmoraal-signalen blokkeren publicatie;
- metadata kan bewijs aanvullen maar kan de semantische final-copy check niet omzeilen.

## Runtime
`bg-pre-publish-review` is als Supabase Edge Function versie 13 gedeployed naar productieproject `adhjwmvyoixzjtmiroln`. Runtime-readback bevat de nieuwe blokkades `FINAL_TEXT_CONCRETE_PERSONAL_EVENT_REQUIRED` en `FINAL_TEXT_CONSULTANT_VOICE_BLOCK`.

## Regression
`tests/social-learning-buffer-channel-identity-gate.test.mjs` bevat escapes voor zakelijke copy met “ik/vandaag” en een “weekendgedachte”-wrapper.
