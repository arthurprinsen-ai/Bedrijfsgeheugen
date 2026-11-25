# Mira — voorkom niet-passende OpenArt-videomodellen vóór providerkosten

Datum 25 oktober 2026. Canonieke eigenaar [P0 #4439](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439).

## Oorzaak bewezen

Echte OpenArt-history `4y4xrXvVDidv9gUDQZea` is gemaakt met Wan 2.7 image2video, officiële onveranderde Mira-start-/eindfoto, aangevraagd op 1080p en 8 seconden. Het resultaat was **1292x1604, 8.08 seconden, mét audio**. De vereiste Reel bevat **native 1080x1920** en de opdracht vroeg om stilte. Dit is géén reden om de verplichte native-video-, gezicht- of bewegingstoets te verlagen.

De [officiële Wan-documentatie](https://www.alibabacloud.com/help/en/model-studio/image-to-video-general-api-reference) bevestigt: `resolution=1080P` beheert de totale pixelklasse; de video bewaart ongeveer de verhouding van het eerste frame. Het OpenArt-formulier voor Wan image2video biedt geen afzonderlijke outputverhouding of mute-optie. Een instructie in de prompt kan die ontbrekende parameters niet garanderen.

## Codewijziging in de bestaande oorspronkelijke agent

De bestaande `mira-preventive-quality-recovery.mjs` beoordeelt de werkelijke model/mode/configuratie en gekoppelde master vóór generatie; bekende Wan-configuratie krijgt expliciet `MIRA_WAN27_IMAGE_RATIO_NOT_EXACT_REEL`. Een onbekend model wordt niet zomaar compatible verklaard. Het eerder bewezen Veo 3.1 9:16-formaat blijft uitsluitend een **formatproef**, geen goedgekeurde gezichtsanimatie.

De bestaande authentieke Edge-router krijgt een alleen-lezen actie `generation_preflight`; geen nieuwe scheduler, provider, mutatie, mediacontainer, post, queue of kosten. De oorspronkelijke Mira-producer moet deze preflight en de bestaande budgetregeling doorlopen voordat hij `generate_video` aanroept. De normale MP4-/gezicht-/bewegings-/Meta-providerproeven blijven voor elk werkelijk bestand verplicht.

Een originele Mira-master behouden maar de input geometrisch naar 9:16 veranderen vereist een aparte, gecontroleerde compositie met opnieuw identiteitsbewijs en beschermd broncontract. Het is géén impliciete toestemming om gezichten te vervormen of crops als origineel te verklaren.

## Toets

`tests/brain-mira-provider-native-prespend-20261025.test.mjs`: echte Wan-uitkomst, ongeldige/niet-bestaande outputparameters, ontbrekende master, kostenbatch, onbekende modus, Veo format-only, geautoriseerde routervolgorde. Required en CodeQL op exacte commit, native Supabase-preview, beschermde merge en productierouter-readback zijn nodig vóór live-status.
