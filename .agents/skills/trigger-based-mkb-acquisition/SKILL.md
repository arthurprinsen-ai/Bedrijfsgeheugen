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

## Runtime projection
De canonical opportunity authority projecteert commerciële context via `scripts/opportunity/opportunity-scout.mjs`. Voor `commercial_acquisition=true` zijn `trigger_type`, `problem_hypothesis`, `decision_maker_role`, `recommended_next_action`, voldoende `confidence` en minimaal één `evidence_ref` vereist voordat `commercial_execution_class=trigger-led-next-action` mag ontstaan. Ontbrekende velden blijven null en de uitvoering blijft `observe` met een `do_not_contact_reason`; geen inferentie of bulk-outreach als fallback.


## Supabase runtime authority
De production authority is `public.powerhouse_mkb_trigger_intelligence_v1` + `public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(date)`. Alleen expliciete company-trigger evidence/headlines/samenvattingen of company-scoped predictive signals mogen worden geclassificeerd; een gewone connection/relationship activation is geen kooptrigger. De materialisatie hergebruikt `powerhouse_opportunities`, `powerhouse_forecasts` en `powerhouse_sales_actions`. Automatisch wordt uitsluitend `research_enrichment` via kanaal `internal` aangemaakt; direct outbound blijft onder de bestaande execution gates. De bestaande cron `powerhouse-commercial-learning-v1` wordt hergebruikt via `powerhouse_trigger_based_mkb_acquisition_cycle_v1`; nooit een tweede scheduler maken.
