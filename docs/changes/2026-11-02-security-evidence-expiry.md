# Security Center — bewijsverval en onterecht groene status voorkomen

## Probleem
Een eerder vastgelegde beveiligingscontrole mocht in de portaalinterface niet als geverifieerd worden weergegeven zonder recente, controleerbare vervaldatum. Een aangeleverde PASS-status was onvoldoende bewijs van actuele veiligheid.

## Correctie
Het bestaande Security Trust Center accepteert een controle als actueel wanneer de bron het tijdstip en een begrensde toekomstige vervaldatum levert, de observatie maximaal 24 uur oud is, de controle niet in de toekomst plaatsvond (maximale klokafwijking vijf minuten) en het bewijs beschikbaar is.

De interface toont nu het aantal **actuele, onderbouwde controles** per platform, niet uitsluitend hoeveel observaties er ooit zijn geregistreerd. Een bewezen fout krijgt voorrang op ontbrekend bewijs. Security Agent, Powerhouse, Heartbeat en de release-writer blijven één keten.

## Controle en productievrijgave
Contracttest `tests/brain-security-evidence-expiry-20261102.test.mjs`. Dit document bewijst geen productieuitrol. De beschermde tests, merge en onafhankelijke provider/portaalreadback moeten nog slagen voordat een live-status wordt geregistreerd.
