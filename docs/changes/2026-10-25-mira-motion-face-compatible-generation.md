# Mira — geen onmogelijke combinatie van een bevroren gezicht en echte beweging

Oorspronkelijke eigenaar P0 [#4439](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439), verplichting `mira|identity-and-natural-motion-compatible-producer|20261025-v1`.

## Vastgestelde oorzaak

Eerdere modelprompts bevatten onder andere `LOCK all facial landmarks and pixels in-place`, `NO facial animation, blinking` en `Motion only in an insignificant desk object`. Deze instructies vergroten de kans dat een video wel een herkenbaar stilstaand gezicht bevat, maar geen echt menselijk bewegen. De onafhankelijke bewegingstoets verlangt tegelijk een continue realistische menselijke beweging met confidence minimaal 0,900. De Veo-retake scoorde op die toets 0,890; een andere retake scoorde op het middelste gezicht slechts 0,860 tegenover minimaal 0,940. Zo'n combinatie vraagt om een andere producentinstructie, niet om versoepelde checks of nog meer identieke generaties.

## Wijziging in de bestaande agent

De pure policy `checkMiraProducerPromptCompatibility` herkent tegenstrijdige eindprompts **vóór** providerkosten. De pure `buildMiraSourceLockedMotionBrief` leidt een toegestane generatiebrief af van de reeds bevroren bron, originele Mira-master en datum. De realistische persoon blijft herkenbaar met natuurlijke subtiele oog-, adem- en handbeweging binnen één ononderbroken opname. Er worden geen nieuwe props, merken of verhaallijnen toegevoegd. Het bestaande `planMiraPreventiveRecovery` geeft deze brief aan dezelfde agent terug via de originele router-preflight.

Geen nieuw planningproces, nieuwe queue, tweede publicatiewriter, prompt override, klantgegevens, fake Meta-ID of automatische externe uitgave. OpenArt-schatting/budget en een werkelijk nieuwe providerhistory moeten altijd vóór de kosten worden gecontroleerd; elk resultaat ondergaat de oorspronkelijke native MP4-, face-, temporal- en provider-readback controles.

## Acceptatie

Node regressie `tests/brain-mira-compatible-human-motion-prompt-20261025.test.mjs` replayt eerder mislukte promptpatronen, verifieert consistente bron-/modelinstructies en alle bestaande publicatiecontroles. Exact-head Required + CodeQL en native Supabase-preview, beschermde merge en echte productierouter-readback zijn noodzakelijk. Geen Instagram-live-claim voordat Meta zelf een authentieke post-ID/permalink en onafhankelijke readback levert.
