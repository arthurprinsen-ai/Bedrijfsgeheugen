# Mira: altijd hetzelfde gezicht — exact OpenArt masterportret
9 oktober 2026. Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Bron
De eerdere canonieke referentie `Yjqu4D7v76HABNPmQPj1` is teruggevonden als werkelijk OpenArt-image asset. Zie `config/instagram-canonical-mira-identity-v1.json` voor bron-URL en generatiegeschiedenis. Geen nieuwe Mira, geen persoonlijke upload, geen nieuwe personage-identiteit.

## Productiecontract
Iedere nieuwe Mira-productie moet beginnen met `image2image` op het masterportret (visual reference), en bij Reels verdergaan met `image2video` vanaf het daarvan afgeleide startbeeld. De mediasource krijgt de exacte referentie-ID én -URL. Text2video zonder beeldreferentie is verboden.

De onafhankelijke visuele verifier haalt de masterpixels rechtstreeks op en toont die naast het werkelijk gemaakte eindbeeld of frame aan de goedgekeurde multimodale beoordeling. De score moet >=0,94 zijn en `canonical_identity_match=true` geven. Iedere Reel vereist drie aparte mastervergelijkingen (start, midden, einde), temporele continuïteit, originele exacte asset-SHA en originele Mira-ondernemersprobleemscène. Prompttekst, naam, URL of aangeleverde ID alléén geldt nooit als bewijs.

De bestaande content-orchestrator, media-router, publisher en `powerhouse_validate_instagram_media_job_v1` trigger handhaven dezelfde grens onafhankelijk vóór externe publicatie. Schone regresstests bewijzen dat ontbrekende of onjuiste referentie, een ander gezicht en ontbrekende frame-match niet worden goedgekeurd.

## Waarheid
Een correcte master en succesvolle bronmerge bewijzen nog geen echt Instagram-resultaat. Pas na echte OpenArt-generatie, exacte media- en identiteitsverificatie én onafhankelijke Instagram-post-ID/permalink/readback is een publicatie bevestigd. Dagwinnaar en duplicate-guard blijven behouden.
