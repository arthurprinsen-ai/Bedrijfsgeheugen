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

## Wijzigingsregel voor agents en ontwikkelaars

Een agent, workflow, PR of build mag deze scheiding niet terugdraaien. Een wijziging aan klantauthenticatie vereist eerst een regressietest voor de hierboven beschreven keten. De legacy portal mag worden vervangen of gemoderniseerd, maar klantlogin blijft geïsoleerd totdat een nieuwe portalarchitectuur aantoonbaar dezelfde scheiding, Supabase-authenticatie en RLS-autorisatie behoudt.

## Productie-smoke

Voor de huidige referentieklant moet de publieke route `/klantportaal?klant=ijsselmonde` zonder sessie naar de aparte loginflow leiden. Na geldige authenticatie moet dezelfde slug terugkomen in het bestaande klantportaal. Deze route is de referentie-smoke voor de klantloginarchitectuur; er worden geen wachtwoorden of klantdata in tests vastgelegd.
