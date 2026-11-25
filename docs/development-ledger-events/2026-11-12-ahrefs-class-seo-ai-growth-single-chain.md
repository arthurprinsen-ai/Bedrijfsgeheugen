# Ahrefs-klasse technische SEO en DataForSEO kansen — uitvoeringslog 12 november 2026

Original fingerprint: `seo|ahrefs-class-sitemap-audit-and-dataforseo-commercial-opportunities|20261112-v1`  
Parent: #4198. Original change writer: Powerhouse SEO Order Engine/BG169. Geen tweede scheduler, geen nieuwe publicatielus.
PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5643

## Feitelijke bronnen en oorzaken
- Ahrefs Site Audit claimt 170+ technische checks en bevat onder meer crawlability, indexability, redirects, JS, content/duplicates, structured data, robots, images, Core Web Vitals en linkprioritering. Dit vormt een capability benchmark, **niet** een claim dat al deze checks in het eigen product draaien.
- Eigen bestaande Playwright release-run heeft 279/279 NL/EN routes, 837 viewportchecks, 31.497 hrefs aantoonbaar gecontroleerd, maar vorige browserpoort leverde geen expliciete gerenderde SEO-issue scorecard met individuele code/severity op.
- DataForSEO provider heeft in land NL taal NL de volgende geschatte Google maandvraag teruggegeven: `afas koppeling` 170 (keyword bijgewerkt 19 okt), `ai governance` 390 (17 sept; stale), `bedrijfsprocessen automatiseren` 170 (20 okt), `exact online koppeling` 70 (12 nov). AI-vraag oktober: 22/7/3/5 respectievelijk. Dit zijn **geen** bezoeken, rankings, citaten of omzet.
- Een brede Keyword Ideas-call gaf onder andere `online dobbelsteen` en niet-zakelijke woordenbetekenissen. Ongefilterd publiceren is onjuist.
- Eigen GSC periode 12 okt–9 nov: AFAS/Lightspeed en AFAS webshop/OCI kregen vertoningen op bestaande landingspagina's maar 0 klikken, overwegend op lage organische posities. Optimale actie is semantische en technische vindbaarheid + waardevolle originele content verbeteren, niet CTR-lift claimen zonder hoge positie.

## Concreet gebouwd in bestaande broncode
- `tools/site-shell/seo-site-audit-intelligence.mjs`: pure on-page checks, categorie/severity/issue type, dubbele title/description controle, expliciete health denominator/coverage en gerelateerde waarschuwingen.
- Bestaande `tools/site-shell/standalone-visibility-check.mjs` koppelt hetzelfde aan de volledige sitewide browser-sweep en logt `SEO_SITE_AUDIT_V1`; geen nieuwe cron/crawler/writer.
- `triageExternalSeoOpportunities` weigert niet-relevante, stale, onvoldoende business-fit en eigenaarloze providerrecords. De echte DataForSEO-inname en Heartbeat-overdracht blijven bij de originele bestaande BG169 executor.
- `tests/brain-sitewide-seo-audit-intelligence-20261112.test.mjs`, `config/seo-growth-loop.json`, `platform/agents/agent-team.mjs`, SEO-skill en canonieke leerregistratie bijgewerkt.

## Verplichte originele handoff en erkenning
Bron-API timestamp/provider-ID → tenant/source revision/fingerprint → BG169 originele eigenaar → beschermde tests/CodeQL/Netlify SHA → onafhankelijk volledige live URL/audit readback → ONE BRAIN originele producer receipt → **consumer daadwerkelijk verwerkt ACK** → Powerhouse → Heartbeat → Portal V2 → 7/14/28d echte GSC/GA4/referral/lead/omzet/experiment-evaluatie → volgende natuurlijke run gebruikt les. Zonder provider- en consumer-ID OPEN met eigenaar, incident, herstel en volgende retry. Geen duplicaat of gefingeerd resultaat.

## Grenzen van deze release
Nieuwe site-audit is aanvankelijk eigen gemeten categorieën, niet alle Ahrefs 170+ issues, geen Ahrefs backlinkindex, geen full rank tracker/Brand Radar, geen 24/7 crawler, geen claim van 100% scores of dagelijkse groei. Die ontbreken tot individuele implementatie en onafhankelijke providerbewijs.
**Status:** SOURCE_CANDIDATE tot Required + CodeQL + Netlify exact SHA + productie-readback. Geen bewezen volledige downstream consumenten-/omzetlus.
