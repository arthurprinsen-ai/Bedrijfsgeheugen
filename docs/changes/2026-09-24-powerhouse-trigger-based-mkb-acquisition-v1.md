# Trigger-based MKB-acquisitie v1

Datum: 2026-09-24
Fingerprint: `powerhouse-trigger-based-mkb-acquisition-v1`
Status: IMPLEMENTED_IN_REPO

## Doel
Bedrijfsgeheugen verkoopt geen abstracte digitalisering/AI, maar detecteert zakelijke kooptriggers, vormt een probleemhypothese, kiest de relevante beslisser en activeert de best passende commerciële vervolgstap.

## Canonieke keten
`external evidence -> company/relationship graph -> trigger -> problem hypothesis -> opportunity -> next best action -> content/outreach -> Frisse Blik -> benchmark/conversation -> paid scan -> implementation -> portal/SaaS -> outcome -> case/referral -> learning`

Geen parallel CRM, opportunity-store of learning-store introduceren. Hergebruik bestaande Commercial Graph, `powerhouse_opportunities`, `powerhouse_forecasts`, sales actions/outcomes, experiments en learning-lineage.

## Triggerfamilies
1. snelle groei / headcount- of vestigingsgroei
2. nieuwe CEO/COO/CFO/directie
3. bedrijf kopen, verkopen of verkoopklaar maken
4. investeerder/PE instap of portfolio-interventie
5. post-merger integratie
6. ERP/AFAS/Dynamics/SAP verandering
7. marge-, kosten-, cashflow- of rendementsdruk
8. personeelstekort / sleutelpersoonsafhankelijkheid
9. regelgeving/compliance
10. financiering/refinanciering
11. reorganisatie/turnaround
12. AI/data/digitaliseringsinitiatief zonder uitvoerbaar pad

## Verplichte commerciële interpretatie
Per trigger produceert Powerhouse minimaal:
- `trigger_type`
- `trigger_evidence_ref`
- `observed_at` en freshness
- `confidence`
- `problem_hypothesis`
- `economic_impact_hypothesis`
- `decision_maker_role`
- `buyer_stage`
- `recommended_next_action`
- `recommended_content_angle`
- `channel`
- `partner_route` indien relevant
- `do_not_contact_reason` indien evidence onvoldoende is

Alleen observed evidence mag als feit worden gepresenteerd; hypothesen blijven expliciet hypothesen.

## Outreach-contract
Generieke bulk-cold outreach is verboden als default. Outreach vereist:
1. concrete trigger of relatiecontext;
2. herkenbaar bedrijfsprobleem;
3. relevante insight of diagnose;
4. lage-frictie vervolgstap;
5. dedupe/contact-frequency guard;
6. outcome logging.

Voorbeeldstructuur:
`observed signal -> likely operational/business consequence -> short relevant insight -> permission-light CTA`.

## Frisse Blik funnel
`problem content -> Frisse Blik -> benchmark -> conversation -> €2.900 scan -> implementation -> portal/SaaS -> measurable outcome -> case/referral`.

De scan is een productized entry offer en verkleint aankooprisico. Content ondersteunt diagnose en buyer education; het is pre-sales, geen los publicatievolume.

## Segmenten / koopcontext
Minimaal ondersteunen:
- groei
- grip/besturing
- efficiëntie
- AI-start
- verkoopklaar
- acquisitie/integratie
- turnaround
- investeerder/portfolio

## Partnerdistributie
Kernkanalen:
- accountants
- M&A-adviseurs
- investeerders/PE
- banken/financiers
- gemeenten
- brancheverenigingen
- ERP/AFAS-partners
- MSP/IT-partners
- bedrijfsadviseurs

Partnerleads worden via dezelfde canonical graph/opportunity/outcome lineage verwerkt; geen aparte partner-CRM.

## Content-contract
Bedrijfspagina/blog/SEO-content behandelt concrete directie-, CEO- en MT-problemen met:
- actuele data/evidence;
- economische impact;
- handelingsperspectief;
- concrete portal/scan-toepassing;
- cases/outcomes waar bewezen.

Geen generieke "AI verandert alles"-content als default.

## Scoring
Ranking mag alleen richting next-best-action als alle componenten traceerbaar zijn. Aanbevolen componenten:
- trigger_strength
- evidence_quality
- recency
- problem_fit
- economic_impact
- decision_maker_reachability
- relationship_strength
- partner_leverage
- offer_fit
- fatigue/risk penalty

Weights worden gekalibreerd op echte outcomes; niet hard als waarheid behandelen zonder observed data.

## Closed-loop learning
Iedere actie koppelt terug naar:
`trigger -> hypothesis -> action -> response -> meeting -> scan -> sale -> realized value -> referral`.

Leerregels:
- kalibreer triggerkwaliteit op echte conversie;
- kalibreer probleemhypothesen op discovery-resultaat;
- meet per partnerkanaal time-to-opportunity en realized revenue;
- promote alleen na voldoende observed evidence;
- mislukte benaderingen worden suppression/prevention rules.

## Definition of Done
Geen `LIVE & BEWEZEN` op documentatie alleen. Vereist:
- canonical repo + skill + learning;
- bestaande runtime-authorities hergebruikt;
- relevante tests/gates;
- protected merge;
- runtime/provider readback indien executable gedrag is gewijzigd;
- outcome/learning writeback;
- human documentation read-after-write.

## Delivery governance
Dezelfde fingerprint is gekoppeld aan de canonical learning-canonicalization gate. De PR draagt verplichte machine-readable delivery metadata; een rode admission-, Required- of BRAIN-gate blokkeert promotie en wordt niet omzeild.
