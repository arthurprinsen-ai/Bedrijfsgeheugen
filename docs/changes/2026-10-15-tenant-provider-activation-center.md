# AI-model aansluiten: klantflow en onafhankelijke toelating

**Datum:** 15 oktober 2026  
**Status van dit document bij creatie:** releasekandidaat, niet automatisch productie.

## Voor klant en medewerker
In `AI-modellen kiezen & datasoevereiniteit` selecteert een ingelogde klant eerst het standaardmodel, de verwerkingsroute en het beoogde gebruik. De klant slaat deze keuze op. Daarna gebruikt hij **Controleer aansluitstatus**. Het portaal toont negen concrete controles en wat ontbreekt:

1. Een opgeslagen standaard- of Bedrijfsbrein-model met concrete route.
2. Officieel geregistreerde modelidentiteit, actuele lifecycle en volledig leveranciersbewijs. PARTIAL/CONFLICT zijn niet vrijgegeven.
3. Een opgeslagen activeringsaanvraag van deze klantorganisatie.
4. Een aantoonbare tenantpolicy voor dataopslag en verwerking, inclusief eventueel EER-only.
5. Een zelfstandig geconfigureerde en geautoriseerde providerverbinding.
6. Een niet-verlopen, cryptografisch gecontroleerd runtimebewijs voor de *exacte* combinatie van klant, model en providerroute.
7. Onafhankelijke klanttoestemming, AVG, security, AI-governance en contractgoedkeuring.
8. Aantoonbaar goedgekeurd provider-endpoint, accountrechten en toegestane verwerking.
9. Een concreet toepassingsdoel en voorlopige AI Act-risicobeoordeling.

De klant kan **Activering aanvragen** kiezen. Dit bewaart `portal.aiModelActivationRequest` bij de tenant, met model-ID, route-ID, workload `brain`, `requestState: REQUESTED` en datum. Geen API-secret wordt opgeslagen in dit aanvraagobject. De server moet de ontvangst apart bevestigen; anders verschijnt geen bewezen verzoekstatus. De aanvraag is een reviewverzoek, niet de technische activering of een ondertekend DPA.

De endpoint `GET /api/tenant-ai-activation-status` is geauthenticeerd, cache-disabled en leidt de tenant-ID uitsluitend uit de Identity-provider af. De checklist bevat geen providercredentials, contractinhoud, geheimen of getekende bewijzen. Bij onbeschikbare autoritatieve Supabase-/sovereignty-readback wordt HTTP 503 teruggegeven en niet gefingeerd dat de verbinding klaar is.

## Activering en veiligheidsgrens
Er wordt **nooit** door de checklist een provideraccount aangemaakt of een onafhankelijke goedkeuring ondertekend. Zodra provideraccounts, echte regiobewijzen, overeenkomst, klantautorisatie en een bevoegde verificatie zijn ingericht, kan de bestaande beveiligde `POST /api/tenant-ai-inference` het model handmatig testen. Het ontbreken van die bewijzen blijft een harde blokkade. `READY_FOR_AUTHORIZED_TEST` is alleen een read-only preflight, niet het bewijs van een geslaagde API-aanroep.

POWERHOUSE blijft de rekenengine gebruiken voor KPI's en prognoses; een taalmodel mag niet zonder geverifieerde cijfers of expliciet gedefinieerde taakvoorschriften prognoses verzinnen. Het AI Act-risico hangt af van de concrete toepassing, niet van de merknaam of model-ID. Een eerste risicokeuze is geen juridisch certificaat.

## Acceptatie
Required CI, CodeQL, beschermde merge, Netlify productie-SHA en geauthenticeerde readback zijn de releasevoorwaarden; providerprovisioning en een daadwerkelijke klant-/providerconnectietest zijn afzonderlijke operationele voorwaarden.
