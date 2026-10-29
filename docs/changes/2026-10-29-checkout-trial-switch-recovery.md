# Herstel checkout-proeflink op /afsluiten — 29 oktober 2026

Fingerprint: `powerhouse|website|checkout-trialswitch-null|20261029`.

## Waarneming
De echte GitHub-run [Pagina- en SEO-controle #40889498268](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40889498268) vond op `/afsluiten` een JavaScript-fout: `setTrialLink` roept `replaceChildren` op bij een ontbrekend DOM-element. De bron bevat `id="trialSwitch"`, maar dat bewijst niet dat de element-id na websitegeneratie nog aanwezig is.

## Herstel
In de bestaande checkout wordt de proef-/betaalmodusschakelaar nu veilig binnen het bestaande formulier opgebouwd als de container ontbreekt. De bestaande linklogica, plan- en betaalcycluskeuzes en taalwisseling blijven intact. Ontbreekt het daadwerkelijke formulier, dan faalt de code nog zichtbaar; geen stilzwijgende verberging van een betaalprobleem.

## Test en acceptatie
`tests/checkout-trial-switch-recovery.test.mjs` controleert de twee runtimegevallen: element aanwezig en element afwezig. In beide gevallen moet precies één werkende link ontstaan zonder dubbele container. De volledige gebouwde pagina moet daarna in Required/Playwright, CodeQL en na productie-uitrol opnieuw worden gecontroleerd.

**Status: CODE CANDIDATE, NIET LIVE BEWEZEN.** Geen extra scheduler, nieuwe checkoutprovider of autorisatie-uitzondering. De geauthenticeerde twee-tenant-portaaltest wordt apart bewaakt door [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215).
