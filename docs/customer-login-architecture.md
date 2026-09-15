# Klantlogin-architectuur — geborgd

Deze architectuur is een niet-regressieregel voor alle huidige en nieuwe klantportalen van Bedrijfsgeheugen.

`klant-login.html` is de **enige klantlogin**. Een echt klantportaal mag nooit meer e-mail- of wachtwoordvelden inline in `klantportaal.html` renderen. De reden is structureel: het legacy-portaal bevat veel onafhankelijke scripts en renderlussen; authenticatievelden daarin kunnen op mobiele browsers opnieuw opgebouwd worden en focus verliezen.

De vaste keten is:

`/klantportaal?klant=<slug>` → bestaande geldige sessie herstellen of doorsturen naar `/klant-login.html?klant=<slug>` → Supabase Auth → organisatie- en offertetoegang via RLS → klantdata tijdelijk doorgeven → terug naar `/klantportaal?klant=<slug>` → bestaand klantportaal openen.

## Verplichte invarianten

- `klant-login.html` handelt e-mail/wachtwoordauthenticatie af via Supabase Auth.
- Autorisatie en klanttoegang blijven door Supabase RLS bepaald; een client-side slug geeft nooit zelfstandig rechten.
- `public.organisaties.id` is de canonieke tenant-/klantidentiteit voor portaldata. `klant_slug` is uitsluitend een compatibility-/display-alias en autoriseert nooit zelfstandig.
- `scan_inzendingen`, `offerte_inzendingen` en `portaal_stand` dragen `organisatie_id` met een foreign key naar `organisaties(id)`.
- Authenticated intakewrites worden door de database aan `auth.uid()` → `leden.organisatie_id` gebonden. Een ingestuurde slug wordt alleen geaccepteerd wanneer die bij die bewezen membership hoort en daarna genormaliseerd.
- Demodata is expliciet `is_demo=true`, heeft geen commerciële `organisatie_id` en wordt uitgesloten van benchmarks en commerciële outcomes/learnings.
- `klantportaal.html` bevat **niet inline** de velden `bgMail` of `bgWw`.
- Zonder herstelde klantauth verwijst het portaal naar de aparte `klant-login.html`.
- Na succesvolle login wordt dezelfde klant-slug geopend; offerte, sprints en overige klantinhoud blijven in het bestaande portaal.
- De productiebuild voert `applyCustomerPortalAuth()` uit nadat V18 is gegenereerd en voert daarna `verifyCustomerLoginContract()` uit.
- Als één invariant ontbreekt, moet de Netlify-build falen in plaats van een regressie te publiceren.

## Bekende foutklassen en beslisregels

Fingerprint: `portal|customer-auth|legacy-inline-login-jitter`.

Het incident bij IJsselmonde bewees dat mixed Netlify Identity + Supabase customer auth + een legacy portal render lifecycle meerdere auth-eigenaren creëert. Backend-success is dan niet hetzelfde als een bruikbare login. Op iOS kon de legacy DOM tijdens invoer opnieuw worden opgebouwd, waardoor focus verloren ging en de pagina zichtbaar trilde terwijl Supabase-auth en RLS zelf gezond waren.

Fingerprint: `portal-tenant-identity-normalization-v1`.

De tenant-normalisatie bewees een tweede, onafhankelijke grens: succesvolle authenticatie is niet voldoende wanneer businessdata daarna alleen een vrije tekstslug draagt. Vrije slugs en een permissieve `WITH CHECK (true)` intakepolicy zijn geen tenant-authority. Daarom wordt organisatie-identiteit database-side afgeleid uit membership, als foreign key opgeslagen en bij benchmark/outcome-learning fail-closed gecontroleerd. Demo is expliciete toestand, geen speciale string die per ongeluk als echte klantdata kan doorstromen.

Daarom geldt voor iedere toekomstige agent:

1. controleer eerst afzonderlijk backend-auth, autorisatie/RLS, tenant-key, datafetch en UI/runtime-evidence;
2. als backend-auth en datafetch groen zijn maar loginvelden focus/jitterproblemen hebben, patch niet opnieuw blind de velden of reloads;
3. zoek naar meerdere auth- of render-eigenaren;
4. behoud één auth boundary: `klant-login.html`;
5. behandel `organisaties.id` als tenant-authority en nooit een URL-/formulier-slug;
6. laat demo-/voorbeelddata nooit benchmarks, advies of commerciële outcomes beïnvloeden;
7. sluit een mobiel/UI-incident alleen met runtime/device outcome evidence, nooit alleen met HTTP 200, een groene build of Netlify `ready`;
8. hergebruik de bestaande regressietests en architectuur voordat een nieuwe auth- of identityroute wordt ontworpen.

Known failed approaches uit het incident: alleen Netlify Identity omzeilen, alleen reload/direct-open aanpassen, alleen sessiepersistentie toevoegen en meerdere symptoompatches in de grote legacy DOM. Deze verbeterden delen van de keten maar verwijderden niet de concurrerende auth/render ownership. De structurele oplossing was isolatie.

## Wijzigingsregel voor agents en ontwikkelaars

Een agent, workflow, PR of build mag deze scheiding niet terugdraaien. Een wijziging aan klantauthenticatie of tenantidentiteit vereist eerst een regressietest voor de hierboven beschreven keten. De legacy portal mag worden vervangen of gemoderniseerd, maar klantlogin blijft geïsoleerd en portaldata blijft organisatiegebonden totdat een nieuwe portalarchitectuur aantoonbaar dezelfde scheiding, Supabase-authenticatie, RLS-autorisatie en canonical tenant lineage behoudt.

## Productie-smoke

Voor de huidige referentieklant moet de publieke route `/klantportaal?klant=ijsselmonde` zonder sessie naar de aparte loginflow leiden. Na geldige authenticatie moet dezelfde slug terugkomen in het bestaande klantportaal. Database-side moet die sessie uitsluitend data kunnen schrijven onder de organisatie die via `leden` aan de ingelogde gebruiker is gekoppeld. Deze route is de referentie-smoke voor de klantloginarchitectuur; er worden geen wachtwoorden of klantdata in tests vastgelegd.
