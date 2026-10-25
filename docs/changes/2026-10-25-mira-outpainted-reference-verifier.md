# Mira — 9:16-afgeleide referentie onafhankelijk controleren

## Vastgestelde nieuwe bron

Originele master: `Yjqu4D7v76HABNPmQPj1` (ongewijzigd). Afgeleide OpenArt-generatie `4aOsUdQyAheL3wmex9Uq` is **COMPLETED** als een echte `1296×2304` PNG (`aTtGOimC7CyaexG5cyTh`). Dit bewijst de beeldverhouding, **niet** een exact behouden gezicht of een geldige Reel.

De bestaande Supabase-verifier vergeleek al exact aangeleverde beelden met de onveranderde originele Mira-master en eiste onafhankelijke visuele gezichtsconfidence ≥0,940. Maar uitsluitend statische Instagram-afbeeldingen van 1080×1350 en videoframes van 1080×1920 werden als geldig formaat toegelaten. Dit blokkeerde het onafhankelijk beoordelen van het nieuwe referentiebeeld.

## Gerichte wijziging

Nieuwe zuiver functionele rol `reference_candidate` accepteert alleen het originele 1296×2304 OpenArt PNG/JPEG via de trusted OpenArt-assetlink en voert de **bestaande onafhankelijke** two-image-visionvergelijking met de oude Mira-master uit. De verwijzing blijft een kandidaat, ongeacht de conclusie. De response zet `reference_candidate_only=true`, `may_publish=false`, `final_media_proven=false`; de echte contentverplichting mag nooit geschreven worden. Originele 1080×1350 statische of 1080×1920 frame-gates blijven exact intact.

Visionconfidence is géén pixelidentiteitsbewijs, dus een eventuele overgang naar een input voor het videomodel moet langs een **afzonderlijke beschermde masterafstammingswijziging** met echt onafhankelijk bewijs. Ook een goedgekeurde beeldreferentie is niet een video of Instagram-publicatie. Blijf dezelfde originele publisher en verifieer later originele native-video, gezichten op alle drie frames, beweging en Meta-ID/permalink.

## Acceptatie

Regression `tests/brain-mira-portrait-reference-proof-20261025.test.mjs`; exact-head Required en CodeQL; provider native Supabase-preview, beschermde merge en productieverificatie van de nieuwe Edge-code; daarna eenmaal authentiek `reference_candidate` tegen `https://cdn.openart.ai/openart-ai/production/2026-10/create-image/WZvuT1BzGx566fWaFo8F/gpt-image-2-edit-1_1792950927245_6b325cb9.png` met geldige identiteit, SHA en bronlog. Niet groen op naam, label of prompt alleen.
