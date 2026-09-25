# LIVE_BEWEZEN: exact-main, Netlify current pointer en browserproof

Datum: 25 september 2026

## Aanleiding

De NL/EN-productierecovery liet twee delivery-risico's tegelijk zien. Ten eerste kan protected main tijdens terminale verificatie opnieuw vooruitlopen door een volgende geldige merge. Een Netlify-deploy die enkele minuten eerder exact-main was, is dan niet langer voldoende voor een actuele LIVE_BEWEZEN-claim. Ten tweede kan fallback-fouttekst bewust verborgen in de DOM aanwezig zijn. Een crawler die die string aantreft bewijst dan niet dat een bezoeker de fout ziet.

## Canonieke regel

LIVE_BEWEZEN is voortaan een actuele join van drie authorities:

1. Source authority: de opnieuw gelezen protected-main SHA.
2. Provider authority: Netlify current production is ready en commit_ref is exact dezelfde SHA.
3. Functional authority: current-SHA Production Release Readback + Production Source Snapshot + de toepasselijke browser/readback-gate zijn groen.

Schuift main tijdens de verificatie op, dan blijft ouder bewijs historische containment evidence, maar niet langer terminale closure authority. De uitvoerende agent volgt dezelfde canonical lineage naar de nieuwere head en start geen concurrerende deploylijn.

## Browser versus stringmatch

Voor interactiedefecten is browsergedrag leidend. De fallbacktekst Switching language failed. Try again. mag als verborgen foutcopy in HTML/DOM bestaan. Dit wordt pas een productie-defect wanneer de canonical browsergate de melding zichtbaar maakt tijdens de echte taalwissel, of wanneer de Engelse route/content/roundtrip faalt.

HTTP 200, html lang=en en statische markers blijven noodzakelijke diagnostiek, maar vervangen de echte NL→EN→NL-interactie niet.

## Bewijs van de gereconcilieerde productie

- protected/current main: ccb64428be9ce5bb05b4e38801475d48e2ea6f28
- Netlify current deploy: 6ab6b1b1e1aeb600082e5a0b
- Netlify current commit_ref: ccb64428be9ce5bb05b4e38801475d48e2ea6f28
- Production Release Readback run: 36168441714 — success
- Production Source Snapshot run: 36168441792 — success
- Canonical brand shell live readback run: 36168441700 — success
- browsercontract: PRICING_I18N_PRODUCTION_BEHAVIOR_PROVEN

## Permanente borging

De regel is vastgelegd in Brain learning, Powerhouse continuity/concurrency/Netlify/self-optimization skills, AGENTS.md en een executable regression. Daardoor kan een volgende chat of agent de productie niet meer op basis van alleen een oudere deploy-ID, een generieke ready-status, een tooltimeout of een DOM-stringmatch ten onrechte afsluiten.
