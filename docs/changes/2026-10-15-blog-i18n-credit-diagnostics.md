# Daily blog — ontbrekende EN-cache bij providerkrediet (2026-10-15)

De enige bestaande Powerhouse-blogworkflow faalt bij `STATIC_I18N_PRODUCTION_TRANSLATION_FAILED`: de geautoriseerde Anthropic-API geeft HTTP 400 terug omdat het account onvoldoende credits heeft. De code deelt batches telkens verder op, ondanks dat een factureringsfout niet met kleinere verzoeken kan worden opgelost.

De gecorrigeerde bestaande lokale routebouwer meldt tijdens `--prepare-cache=` hoogstens 80 **exacte Nederlandse, publieke websitebronstrings**, met het totaal aan ontbrekende cache-keys. Zo kan een gecontroleerde, brongetrouwe Engelse cachepatch worden aangevuld met herleidbare vertalingen zonder generieke placeholdercopy, en zonder bestaande teksten op andere URL's te overschrijven.

Bij `credit balance is too low`, `insufficient quota` of billing in een provider-400 mislukt de poging voortaan direct in plaats van te splitsen in identieke ongeldige aanvragen. `STATIC_I18N_REQUIRE_CACHE=1`, cachecomplete-validatie en de bestaande PR/Netlify/live-readback blijven actief. Er is geen alternatieve onbevoegde AI-provider of nieuwe blogexecutor toegevoegd.

**Bewijsgrens:** deze PR herstelt de publicatie niet zelfstandig zolang geverifieerde vertalingen ontbreken; zij maakt de exacte tekorten zichtbaar en stopt zinloze kosten. Een blog is pas gepubliceerd met geslaagde EN/NL-validatie, protected merge en live URL-readback.
