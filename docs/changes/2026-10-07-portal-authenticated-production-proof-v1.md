# Authenticated Portal production proof v1

## Probleem

De Portal-client stuurde de juiste Netlify Identity bearer en de serverfunctie was production-deployed, maar de releaseketen kon nog geen afzonderlijke echte authenticated HTTP 200 tegen `/api/portal-ondernemersdata` bewijzen zonder een handmatige eindgebruikerssessie.

## Structurele oplossing

- Elke succesvolle production deploy start een Netlify platform-event canary.
- De canary maakt via de server-only Identity admin API een tijdelijke, auto-confirmed gebruiker met een deploy-specifieke tenant.
- Via de echte Identity `/token` flow wordt een kortlevende gebruikers-JWT verkregen.
- Die JWT wordt tegen de immutable deploy-permalink gebruikt voor `GET /api/portal-ondernemersdata`.
- Groen vereist HTTP 200, exact dezelfde authenticated tenant in de response en een geldig payloadcontract.
- De tijdelijke gebruiker wordt altijd verwijderd; cleanup failure maakt het bewijs rood.
- Token, wachtwoord, e-mail en user-id worden nooit in het proof receipt opgeslagen.
- Alleen een niet-gevoelig receipt wordt in Netlify Blobs opgeslagen, keyed op commit SHA.
- Production Release Readback accepteert alleen een `PROVEN` receipt waarvan zowel commit SHA als Netlify deploy-id exact overeenkomen met de live release.
- `netlify/functions/portal-` is structureel onderdeel van de protected Portal lane zodat toekomstige Portal API-wijzigingen deze contracten niet kunnen omzeilen.

## Truth rule

Protected tests + gedeployde function + live database zijn ondersteunend bewijs. Een authenticated production API-claim is pas bewezen wanneer deze canary voor exact dezelfde immutable production deploy groen is.
