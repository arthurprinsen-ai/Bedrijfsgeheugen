# Skill: Trigger-based MKB Acquisition

Fingerprint: `powerhouse-trigger-based-mkb-acquisition-v1`

## Wanneer gebruiken
Gebruik deze skill bij leadgeneratie, markt-/bedrijfssignalering, commerciële opportunity scoring, partnerdistributie, content-to-revenue, Frisse Blik, scanverkoop en next-best-action voor Bedrijfsgeheugen.

## Verplicht patroon
1. Lees eerst bestaande Commercial Graph, opportunities, forecasts, actions/outcomes en relevante relationship state.
2. Zoek een observeerbare kooptrigger; verzin geen aanleiding.
3. Bewaar evidence-ref, datum/freshness, provenance en confidence.
4. Vorm expliciet een `problem_hypothesis`, nooit als feit formuleren.
5. Bepaal economische relevantie en waarschijnlijk beslissersrol.
6. Kies de kleinste relevante vervolgstap: content, insight, Frisse Blik, benchmark, gesprek, partnerintro of scan.
7. Gebruik geen generieke bulk-cold outreach als default.
8. Dedupe kanaal/contactdag en respecteer suppression/fatigue.
9. Log actie en outcome in bestaande canonical lineage.
10. Kalibreer scoring en vervolgstap op observed outcomes.
11. Projecteer learnings terug naar docs/skills/System Map wanneer gedrag structureel verandert.

## Triggerbibliotheek
- groei
- nieuwe directie
- koop/verkoop/M&A
- investeerder/PE
- integratie
- ERP/AFAS/bedrijfsapplicatie verandering
- marge/kosten/cashflow
- personeelstekort/key-person risk
- regelgeving
- financiering
- turnaround/reorganisatie
- AI/data/digitaliseringsinitiatief

## Funnel
`external data -> trigger -> problem hypothesis -> relevant content/outreach -> Frisse Blik -> benchmark/conversation -> paid scan (€2.900) -> implementation -> portal/SaaS -> measurable outcome -> case/referral`.

## Partner-first waar voordelig
Beoordeel accountants, M&A, PE/investeerders, banken, gemeenten, brancheverenigingen, ERP/AFAS-partners, MSP/IT-partners en bedrijfsadviseurs als leverage-route.

## Fail-closed
Stop commerciële execution wanneer:
- evidence ontbreekt of stale is;
- identiteit/beslisser onzeker is;
- actie duplicate/fatigue veroorzaakt;
- persoonsgegevens of kanaalgebruik niet rechtmatig/veilig zijn;
- een claim niet uit evidence volgt.

## Content
Content is pre-sales. Schrijf vanuit concreet CEO/directie/MT-probleem, data, impact, handelingsperspectief en aantoonbare toepassing van scan/portal.

## Learning
Meet minimaal trigger->response, response->meeting, meeting->scan, scan->sale, realized value en referral. Promote geen heuristiek tot harde policy zonder voldoende evidence.

## Executable trigger runtime
Fingerprint: `powerhouse-trigger-opportunity-runtime-v1`.

Wanneer een observed company trigger via de canonical ingest binnenkomt, projecteert de runtime hem naar de bestaande predictive signal → forecast → opportunity → sales action → decision cycle lineage. Start altijd met `expected_value_eur=0`, `expected_revenue_value=0` en channel `internal_research`. Directe outreach blijft geblokkeerd totdat aparte observed commercial evidence en bestaande outbound-gates dit toestaan. Market/segment-signalen mogen nooit stilzwijgend als company opportunity worden behandeld.
