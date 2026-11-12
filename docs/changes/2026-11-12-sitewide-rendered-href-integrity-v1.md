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
