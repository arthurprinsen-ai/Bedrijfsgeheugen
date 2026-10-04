# Portal action intent end-to-end v1

## Doel
Een knop met “actie” in Portal V2 mag niet alleen navigeren. De gebruikersintentie wordt onderdeel van dezelfde Powerhouse-keten.

## Ketting
1. Future Lens of een semantisch datapunt genereert een contextgebonden actie-intentie.
2. `portal-v2/powerhouse-runtime-bridge.js` gebruikt de actuele portal-identiteit en dezelfde correlation-lineage.
3. `/api/brain-operating-loop` slaat de intentie op als canonieke Brain `Action` met status `REQUESTED`.
4. De action is nog niet uitgevoerd; uitvoering/verificatie/outcome blijven aparte Brain-stappen.
5. Na de write wordt de Brain-projectie opnieuw gelezen, zodat frontend en backend dezelfde waarheid tonen.

## Geen parallelle workflow
Er wordt geen nieuwe database, queue of browserstore gemaakt. De action gebruikt de bestaande Brain-authority en `brain_records`.
