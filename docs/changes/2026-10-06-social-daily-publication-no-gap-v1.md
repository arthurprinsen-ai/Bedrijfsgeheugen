# Daily social publication self-heal gap

## Probleem

De dagelijkse social-contentlijn had een recovery-gap. De primaire gesloten content-loop kan een publicatie missen of fail-closed houden, terwijl de aanvullende Netlify supervisor pas één keer per uur opnieuw probeerde. Daardoor kon na het geplande 08:00-moment langdurig geen zichtbare post bestaan.

## Oplossing

De bestaande canonieke publisher blijft de enige writer. De recovery supervisor roept diezelfde idempotente route voortaan elke tien minuten aan en na een geslaagde production deploy. Er is dus geen tweede publicatiepad en geen omweg langs Buffer.

## Borging

De bestaande social-publication authority-test controleert:
- de tienminuten-cadans;
- delegatie van de deploy-hook naar dezelfde recoveryfunctie;
- afwezigheid van directe provider-write primitives in de deploy-hook;
- behoud van het lokale publicatievenster en de canonieke Supabase publisher.

De nieuwe deploy-hook is expliciet geregistreerd als quality surface met dezelfde evidence contract.

## Bewijsgrens

Deze wijziging mag pas LIVE_PROVEN heten na merge, production deploy en provider-readback van de daadwerkelijke publicatie. Een groene CI-run zonder provider-side effect is onvoldoende.
