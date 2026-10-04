# SalesRobot capability routing v1 — 4 oktober 2026

## Probleem
De LinkedIn sales machine rapporteerde SalesRobot DM hardcoded als UNAVAILABLE, terwijl de canonieke Composio SalesRobot-verbinding actief is. Daardoor kon Powerhouse een uitvoerbare DM-capability niet benutten en was de fallback hardcoded op e-mail.

## Structurele oplossing
SalesRobot is nu een capability achter de bestaande Powerhouse next-best-action-laag. De runtime registreert verse provider-capability truth, verifieert een gezonde SalesRobot LinkedIn-account vóór DM-uitvoering, vereist een provider-addressable recipient en schrijft provider acknowledgement/failure terug op de canonieke sales action. Als DM niet uitvoerbaar is, blijft de actie beschikbaar voor de bestaande cross-channel router in plaats van de commerciële cyclus te blokkeren.

De providercheck op 4 oktober 2026 bevestigde één ACTIVE SalesRobot connection met alias `powerhouse-linkedin-dm-direct`, LinkedIn account health `HEALTHY`, en `SALESROBOT_SEND_MESSAGE` als beschikbare DM-tool. Er zijn momenteel nul SalesRobot campaigns; campaign outreach blijft daarom expliciet `CONFIG_REQUIRED` en wordt niet verzonnen.

## Grenzen
SalesRobot krijgt geen eigen intelligence-, prospect-, scoring-, scheduler- of learning authority. Company posts blijven via de canonieke LinkedIn organization publisher lopen. Identity, source, dedupe, suppression, cooldown, consent en revenue truth blijven leidend.
