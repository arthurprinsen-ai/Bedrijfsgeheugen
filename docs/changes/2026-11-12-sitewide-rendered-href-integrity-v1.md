# Alle sitebrede gerenderde hrefs + één oorspronkelijke overdracht — 12 november 2026

Fingerprint: `seo|rendered-nl-en-href-full-inventory-and-consumer-ack|20261112-v1`  
Parent-P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198  
Verantwoordelijk: oorspronkelijke Powerhouse SEO Order Engine / BG169, bestaande website-releasebrowser en originele ONE BRAIN→Powerhouse→Heartbeat consumers.

## Concrete oorzaak
De bestaande `tools/controleer-technische-seo.mjs` controleert canonical, H1, titel, description en interne links van root/blog-bronpagina's, maar omvat niet alle gerenderde `/en/*` routes. De bestaande Playwright-sweep bezoekt al alle productiesitemaproutes op drie viewports, maar inspecteert hun werkelijke `a[href]` niet. Nieuwe blogs hebben een aparte, strenge href-poort. Dit liet een kwaliteitsgat tussen nieuwe artikelen en alle andere gerenderde pagina's.

## Herstel binnen bestaande releaseketen
- Eén herbruikbare statische href-validator `tools/site-shell/sitewide-href-integrity.mjs`, zonder crawler/producer/scheduler.
- De bestaande browser-visibility-sweep leest op elke desktoproute alle `a[href]` met werkelijk aantal, maximale veiligheidsgrens van 500; afkapping leidt tot een fout. Dezelfde publieke sitemap is de exacte set van canonieke bestemmingen. Afwezige routes, placeholders, unsafe schemes, HTTP, noncanonical first-party host, ambigue relatieve links en niet-canonieke interne route zijn errors. Assets, fragments, mailto/tel en expliciet functionele niet-geïndexeerde routes blijven toegestaan.
- Mobiel, tablet en desktop blijven dezelfde bestaande volledige zichtbaarheid-/CLS-controle doorlopen. Een statisch href-contract bewijst geen externe HTTP 200 of werkende on-page click: die behouden de oorspronkelijke onafhankelijke productie-audit en browser-/provider-readback.
- Agents en oorspronkelijke SEO-skill delen voortaan hetzelfde tenant+source revision+owner+idempotent correlation+producer ID+independently processed consumer-ACK contract; mislukte overdracht blijft bij oorspronkelijke eigenaar OPEN tot werkelijke verwerking.

## Verificatie en veiligheid
Regressie `tests/brain-sitewide-href-integrity-20261112.test.mjs` eist syntactisch en canoniek geldige Nederlandse en gegenereerde Engelse hrefs, faalt op onveilige/absente targets, en bewaakt de daadwerkelijke browser-wiring en volledige inventaris. Geen nieuwe cron, tweede writer, extra provider, contentpublicatie of verkeerde groene omzetclaim. Uitsluitend originele beveiligde CI, CodeQL, Netlify en exacte publieke readback mogen de code-release als live markeren.

Gegevensstand 12 november: Supabase originele batch had 84 open contentoverdrachten, 69 te laat en 183 social-learning te laat. Dit zijn overlappende categorieën en geen nieuw gesloten uitkomsten. Groei uit Google/ChatGPT/Claude moet met echte niet-bot-referrals, Google Search Console en bewezen provider-citaties/bronmetingen worden bepaald, nooit uit code en bothits afgeleid.

**Status:** CANDIDATE, geen productieclaim voor deze nieuwe href-uitbreiding of alle downstream handoffs.

## Correctie op geobserveerde functionele routes
Tijdens bronreplay bleken de juridische routes `/gebruiksvoorwaarden`, `/cookiebeleid`, `/systeemstatus` al onderdeel van de bestaande `PUBLIC_UTILITY_ROUTES`; daarnaast is `/afsluiten` aantoonbaar `noindex,nofollow` en wordt `/pakketadvies` gebruikt als functionele conversiebestemming. De href-gate hergebruikt de bestaande utility-inventaris en maakt alleen voor beide gecontroleerde conversieroutes een expliciete uitzondering. Dit voorkomt onterechte `INTERNAL_TARGET_NOT_IN_FINAL_SITEMAP` zonder onbekende bestemmingen stilzwijgend goed te keuren. Live HTTP 200, redirects, mobiele interactie en conversietracking moeten alsnog afzonderlijk worden bewezen. Test bevat beide functies en de juridische routevoorbeelden.

## Werkelijke eerste full-site browserreplay — root cause, niet afgekeurd als ruis
De beschermde Required website browser-run `43220422656` (`website/browser` job `131192041304`) faalde met **15 concrete href-bevindingen**. Exacte groepen:
- acht NL-only zelfstandige AI-model- en vergelijkingspagina's met Engelse taalkiezer die naar niet-gepubliceerde `/en/<slug>` wees. Bestaande `assets/js/i18n.js` construeerde blind een locale-suffix zonder routebeschikbaarheid. Herstel: Engelse taalkiezer op deze acht NL-only artikelen wijst naar bestaande Engelse modellenwijzer; interne links naar die NL-only artikelen blijven NL, zonder 404.
- Engelse product-/prijzen-/zelfscan-stroom zette de functionele, niet-geïndexeerde checkout `/afsluiten` om naar de niet-gepubliceerde `/en/afsluiten`. Herstel: checkout-padres blijft gedeeld en behoudt query, geen schaduw-betaalroute.
- `connect.html`: verborgen wachtlijst-fallback had `href="#"` vóór JS de mailto opbouwde; herstel: daadwerkelijk `mailto:arthur@bedrijfsgeheugen.nl` als veilige standaard en bestaande JS verrijkt bericht.
- `privacy.html`: cookietoestemming-link was een klik zonder werkende no-JS href. Herstel: volledige canonical `https://www.bedrijfsgeheugen.nl/privacy#cookies`, zichtbare `id="cookies"`, JS opent cookie-instellingen waar beschikbaar en laat anders een nuttige fallback over.
De bestaande browserpoort blijft fail-closed; herhaal exact-head Required, CodeQL, Netlify-preview, juiste productie-SHA en publieke URL-route/consumer readback. De aanvankelijke 15 fouten zijn geen bewijs van 15 fouten die daadwerkelijk al door bezoekers werden gezien; het was de precieze beproeving van de candidate-browser.


**Correctie na tweede onafhankelijke browserreplay (12-11-2026, Required `43222505384`):** de enige resterende `/en/afsluiten`-melding was geen 404 maar een ten onrechte als SEO-pagina behandelde **bestaande, bewust niet-indexeerbare Engelse checkout**. `tools/site-shell/checkout-browser-check.mjs` test `/en/afsluiten` en `/afsluiten` afzonderlijk; `tools/site-shell/checkout-build-integrity.mjs` verifieert `en/afsluiten.html`. De eerdere poging om Engelse checkout naar NL door te leiden is teruggedraaid. De href-gate laat nu **uitsluitend deze exact geverifieerde functionele EN-route** toe buiten de indexeerbare sitemap; geen algemene uitzondering voor ontbrekende Engelse routes. Volledige exacte browser- en release-readback opnieuw vereist. Historische mislukte CI-runs blijven voor leren zichtbaar.


### 12 november — regressie nadat installable app in main arriveerde
De volledige nieuwe samengevoegde run `43232244775` detecteerde **279 keer** `UNSAFE_OR_HTTP_HREF`, één per gescande publieke pagina. Het eerder afzonderlijk goedgekeurde nieuwe app-shellbestand `assets/bg-app-experience.js` vulde openbare dock-hrefs met `location.origin`; dat is `http://...` bij de bestaande originele lokale browserrelease, ondanks de broncommentaar dat alle links HTTPS waren. Dit is géén reden om de bestaande hrefvalidator uit te zetten: de app-shell gebruikt nu bij niet-HTTPS-testherkomst altijd de echte volledige canonieke HTTPS-origin `https://www.bedrijfsgeheugen.nl`, terwijl productie en HTTPS-preview hun eigen oorsprong behouden. Test `tests/brain-sitewide-href-integrity-20261112.test.mjs` beschermt tegen regressie. De enige afsluitbevoegdheid is opnieuw exact-head Required/BRAIN, CodeQL, full 279-route replay, beschermde merge en onafhankelijke Netlify current-SHA productie-readback. Niet als LIVE registreren vóór dat bewijs.
