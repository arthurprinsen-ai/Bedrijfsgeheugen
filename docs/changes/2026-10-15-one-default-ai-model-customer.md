# Klantbreed standaardmodel met uitzonderingen per AI-functie

Datum: 15 oktober 2026. Dit is een releasekandidaat totdat Required CI, CodeQL, merge en Netlify-productie-readback zijn geslaagd.

**Klantinterface:** In `AI-modellen kiezen & datasoevereiniteit` kiest een klant één `defaultModelId` uit de 110 bestaande catalogusrecords. Een nieuw gekozen model wordt aan de wensenlijst toegevoegd; de klant kiest apart de providerverwerkingsroute. De serverstate bewaart schemaVersion 3, `defaultModelId`, `models`, `assignments`, `policy`, `aiRisk` en `requestState: review_only_not_activated`. Een model kan expliciet aan een functie worden toegewezen om de standaard te overrulen; leeg betekent dat een geschikte geautoriseerde adapter de default als gewenste route kan gebruiken. Geen enkele client-instelling autoriseert runtime-aanroepen.

**Server:** `resolveDesiredTenantModel` is één herbruikbare, fail-closed resolver voor benoemde workloads. In de reeds attested tenant gateway wordt voor `brain` eerst de expliciete uitzondering gekozen, anders de tenant-default. De bestaande check op ondertekende providerreceipt, toegestane regio, evidence, contract/consent, TTL, endpointallowlist, kostengoedkeuring en individuele model-ID blijft onveranderd. Status PARTIAL/CONFLICT, geen API-ID, EER-policy mismatch en lokale/strict mode blokkeren.

**Financiële prognoses:** voorspellingen en KPI's worden alleen berekend door de bestaande data-/forecast-engine. Het standaardtaalmodel mag in een toekomstige, afzonderlijk geautoriseerde analysekoppeling alleen *reeds gevalideerde* waarden uitleggen. Er is nog geen runtime-aansluiting van document-OCR, embeddings, financiële prognoses, algemene agents of de afzonderlijke `/api/portaalvraag` route op deze resolver gerealiseerd; de UI vermeldt dit als wens in plaats van geactiveerde route.

**Acceptatie:** groene regressie, beschermd gemergede commit, Netlify productie-SHA en geauthenticeerde readback. Ondertekende tenantproviderconfiguratie is apart vereist; zonder echte verbinding geen claim van live AI-modelgebruik.
