# Klantlogin-architectuur — geborgd

Deze architectuur is een niet-regressieregel voor alle huidige en nieuwe klantportalen van Bedrijfsgeheugen.

`klant-login.html` is de **enige klantlogin**. Een echt klantportaal mag nooit meer e-mail- of wachtwoordvelden inline in `klantportaal.html` renderen. De reden is structureel: het legacy-portaal bevat veel onafhankelijke scripts en renderlussen; authenticatievelden daarin kunnen op mobiele browsers opnieuw opgebouwd worden en focus verliezen.

De vaste keten is:

`/klantportaal?klant=<slug>` → bestaande geldige sessie herstellen of doorsturen naar `/klant-login.html?klant=<slug>` → Supabase Auth → organisatie- en offertetoegang via RLS → klantdata tijdelijk doorgeven → terug naar `/klantportaal?klant=<slug>` → bestaand klantportaal openen.

## Verplichte invarianten

- `klant-login.html` handelt e-mail/wachtwoordauthenticatie af via Supabase Auth.
- Autorisatie en klanttoegang blijven door Supabase RLS bepaald; een client-side slug geeft nooit zelfstandig rechten.
- `klantportaal.html` bevat **niet inline** de velden `bgMail` of `bgWw`.
- Zonder herstelde klantauth verwijst het portaal naar de aparte `klant-login.html`.
- Na succesvolle login wordt dezelfde klant-slug geopend; offerte, sprints en overige klantinhoud blijven in het bestaande portaal.
- De productiebuild voert `applyCustomerPortalAuth()` uit nadat V18 is gegenereerd en voert daarna `verifyCustomerLoginContract()` uit.
- Als één invariant ontbreekt, moet de Netlify-build falen in plaats van een regressie te publiceren.

## Bekende foutklasse en beslisregel

Fingerprint: `portal|customer-auth|legacy-inline-login-jitter`.

Het incident bij IJsselmonde bewees dat mixed Netlify Identity + Supabase customer auth + een legacy portal render lifecycle meerdere auth-eigenaren creëert. Backend-success is dan niet hetzelfde als een bruikbare login. Op iOS kon de legacy DOM tijdens invoer opnieuw worden opgebouwd, waardoor focus verloren ging en de pagina zichtbaar trilde terwijl Supabase-auth en RLS zelf gezond waren.

Daarom geldt voor iedere toekomstige agent:

1. controleer eerst afzonderlijk backend-auth, autorisatie/RLS, datafetch en UI/runtime-evidence;
2. als backend-auth en datafetch groen zijn maar loginvelden focus/jitterproblemen hebben, patch niet opnieuw blind de velden of reloads;
3. zoek naar meerdere auth- of render-eigenaren;
4. behoud één auth boundary: `klant-login.html`;
5. sluit een mobiel/UI-incident alleen met runtime/device outcome evidence, nooit alleen met HTTP 200, een groene build of Netlify `ready`;
6. hergebruik de bestaande regressietest en architectuur voordat een nieuwe authroute wordt ontworpen.

Known failed approaches uit het incident: alleen Netlify Identity omzeilen, alleen reload/direct-open aanpassen, alleen sessiepersistentie toevoegen en meerdere symptoompatches in de grote legacy DOM. Deze verbeterden delen van de keten maar verwijderden niet de concurrerende auth/render ownership. De structurele oplossing was isolatie.

## Wijzigingsregel voor agents en ontwikkelaars

Een agent, workflow, PR of build mag deze scheiding niet terugdraaien. Een wijziging aan klantauthenticatie vereist eerst een regressietest voor de hierboven beschreven keten. De legacy portal mag worden vervangen of gemoderniseerd, maar klantlogin blijft geïsoleerd totdat een nieuwe portalarchitectuur aantoonbaar dezelfde scheiding, Supabase-authenticatie en RLS-autorisatie behoudt.

## Productie-smoke

Voor de huidige referentieklant moet de publieke route `/klantportaal?klant=ijsselmonde` zonder sessie naar de aparte loginflow leiden. Na geldige authenticatie moet dezelfde slug terugkomen in het bestaande klantportaal. Deze route is de referentie-smoke voor de klantloginarchitectuur; er worden geen wachtwoorden of klantdata in tests vastgelegd.
