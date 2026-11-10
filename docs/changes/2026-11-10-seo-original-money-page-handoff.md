# SEO/Blog/Technische SEO — directe overdracht van echte paginaoptimalisaties

## Productieoorzaak
Op 10 november 2026 draaide de bestaande SEO Opportunity Resolver succesvol: 95 zoekwoorden, 29 Google Search Console-queries en 5 gerangschikte kansen. Alle vijf waren `UPDATE_MONEY_PAGE` voor twee originele intent-eigenaren (Exact Online en Twinfield). De resolver schreef wel vijf forecasts maar **nul** uitvoerbare aanbevelingen: alleen `CREATE_INTENT_GAP_CONTENT` had een publisher-overdracht. Daarmee werd bron-/scheduler-OK ten onrechte gelezen als mogelijke uitvoering.

## Bestaande originele keten — zonder tweede scheduler
Dezelfde Supabase Edge-resolver selecteert uit de bestaande top vijf maximaal drie **unieke, actuele** canonical money-page owners met score minimaal 65, geverifieerde DataForSEO-brondatum binnen veertien dagen, bestaande Frisse Blik-CTA en één SEO-bestemmingspagina. Deze gaan naar de al bestaande `powerhouse_content_recommendations` als `target_channel=website`, `recommendation_type=seo_money_page_update`, `status=suggested`, met deterministische dag+canonical dedupe. Upsert is `ignoreDuplicates:true`, dus een retry kan een gevalideerde `accepted/done` handoff niet heropenen. Blogadviezen blijven **alleen** voor echte nieuwe intent-gaps en via dezelfde beschermde blogpublisher.

De oorspronkelijke SEO Order Engine/GitHub-Netlify-website-executor blijft de enige code-/publicatie-eigenaar; aanmaak van een websitehandoff is geen livegang. Een consumptie-ACK vereist dezelfde canonical, feitelijke bronwijziging, Required+CodeQL, main-SHA, Netlify-deploy en publieke page/canonical/CTA readback. GSC/GA4/conversie en echte order/omzet worden afzonderlijk later gemeten. `bg_gezondheid` en source-observation tonen de handoff-telling én `execution_readback=EVIDENCE_DUE`, in plaats van stil `recommendations=0`.

## Directe bewezen herstelactie op websitebron
Voor `https://www.bedrijfsgeheugen.nl/twinfield-koppeling` is `twinfield api` als alias toegevoegd aan de originele SEO-map, realtime resolverprojectie en NL/EN-revenue-map (alleen Nederlandse alias). De bestaande canonical blijft de enige owner; titel en meta-omschrijving worden specifieker over Twinfield API-koppelingen en foutpreventie, zonder nieuwe prijs, garantie, klantenclaim of duplicate blog. De enige commerciële CTA blijft Frisse Blik. Het live resultaat vereist beschermde merge en Netlify public readback.

## Borging
De bestaande SEO-skill, ONE BRAIN-lering en append-only incidentledger hebben dezelfde oorzaak en preventie. Regressies bewaken 5→2 owner handoffs, bronfrisheid, cap=3, idempotentie, cross-domain reject, intent-cannibalisatie, canonical en publicatie-readbackgrens.

Verzamelincident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

De reeds gepubliceerde blogs van 6-8 november hebben nog geen echt GSC/GA4-meting+leren-consumerreceipt: dit blijft zichtbaar als apart `EVIDENCE_DUE`, **niet groen door een andere SEO-fix**.
