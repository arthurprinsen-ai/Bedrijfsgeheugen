# Originele SEO-kansenprioritering op werkelijk bewijs (2026-11-12)

**Fingerprint** `seo|google-ai-external-evidence-revenue-priority|20261112-v2`  
**Original executor** BG169 / Powerhouse SEO Order Engine. **Parent** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. **Status** CANDIDATE.

### Brononderzoek en oorzaak
De eerdere `triageExternalSeoOpportunities` prioriteerde grotendeels op `searchVolume × businessFit × imprints × 1-CTR`, met `asNumber(null)` als 0. Daardoor leek afwezig GSC-bewijs op werkelijk 0 kliks en ontbrak onderscheid tussen organische SERP difficulty, Google Ads paid competition/CPC, source confidence en onderbouwde externe marktsignalen. Sterk volume alleen kon commerciële kwaliteit overprioriteren. DataForSEO Keyword Ideas uit brede seeds liet onder andere niet-zakelijke 'online dobbelsteen'-zoekwoorden zien.

Bron DataForSEO Google Keyword Overview 12 november, locatie NL: `afas koppeling` 170 maandelijkse geschatte Google searches, organische keyword difficulty 10, CPC $4,12 **paid only**, info-intent en bronwaarneming 19 okt. `bedrijfsprocessen automatiseren` 170 en commerciële zoekintentie, bron 20 okt. `ai governance` 390, maar bron 17 sept en >30d = stale. GSC 12 oktober–9 november registreerde `afas lightspeed koppeling` op /afas-koppeling: 19 vertoningen, 0 klikken, positie 73,4. Prioriteit is rankings/relevantie/interne context, geen zogenaamd CTR-probleem.

### Veranderde uitvoering in de al bestaande functie
- `tools/site-shell/seo-opportunity-evidence-model.mjs`: pure transparante 100-puntenscore: 30 commerciële relevantie, 20 organische haalbaarheid, 15 zoekvraag, 15 eigen GSC-prestatiegat, 10 recent geverifieerde marktbeweging, 10 technische en onafhankelijke kansen. `sourceCompleteness`, ontbrekende bewijzen, eigen canonical owner en voorgestelde vervolgactie expliciet.
- Bestaande `tools/site-shell/seo-site-audit-intelligence.mjs#triageExternalSeoOpportunities` roept de beslisser aan. Bestaande hard gates blijven: bron ID, actualiteit <=30d, fit >=0.75, named canonical owner, geen onzinqueries, echte markt.
- Externe bron: dated HTTPS en onafhankelijke domeinen; officiële AFAS/Exact/API release-info, wet- en regelgeving, SERP, GSC, eigen page audit, corroborated branchekennis; Reddit/social signalen zijn ongetoetste hypothesen tot verificatie.
- GSC missing != 0. CPC and Google Ads paid competition != organic keyword difficulty. AI estimated search demand != ChatGPT/Claude human referral or provider citations. Geen automatisch netto omzet- of klikgetal uit de score.
- Geen nieuwe DataForSEO betaalde calls door deze module; nooit los werk plannen. Paginabeslissing pas bij feitelijk andere klantzoekintentie zonder keyword cannibalisatie; anders bestaande money page.

### One original chain
Bestaande SEO BG169 → provider origineel ID en bronrevisie / canonical tenant / idempotente fingerprint → maximaal 3 veilige wijzigingen/dag door origineel CI/CD Required+CodeQL → exact Netlify SHA en publieke readback → ONE BRAIN duurzame producer receipt → named **consumer processed ACK** → Powerhouse → Heartbeat → Portal → voltooide 7/28d GSC-human/lead/echte betaald order → volgende natuurlijke run gebruikt les. Bij ontbrekende data of ACK blijft dezelfde eigenaar OPEN met oorzaak, next retry en regressie; geen tweede scheduler, geen social of commerciële side-effect duplicatie.

### Verify
`tests/brain-seo-opportunity-evidence-priority-20261112.test.mjs` samen met bestaande `tests/brain-sitewide-seo-audit-intelligence-20261112.test.mjs`. CI Required/BRAIN/CodeQL, protected merge en independent production readback vóór LIVE_PROVEN. Het codebestand levert een berekende kandidaatprioriteit, **geen bewijs** van automatische provider-inname of verkoop.
