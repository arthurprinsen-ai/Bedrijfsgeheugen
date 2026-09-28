# Management Accounting Intelligence

## Doel
Verbind operationele klantdata, workforce-data, finance, benchmarks en ondernemingswaarde in één Powerhouse value-driver graph en projecteer bewezen afwijkingen naar executive cockpit en roadmap.

## Canonieke regel
Fingerprint: `management-accounting|value-driver-graph|benchmark-to-roadmap|v1`.

1. Gebruik uitsluitend tenant-scoped klantdata en expliciet opgeslagen benchmarks als feit.
2. Ontbrekende input is een datagap, nooit nul en nooit een geschatte benchmark.
3. Voor arbeidsproductiviteit heeft output per gewerkt uur voorrang zodra uren beschikbaar zijn; omzet/FTE blijft aanvullend.
4. Verbind minimaal: mensen → productiviteit → operatie/kwaliteit → commercie → marge/EBITDA → cash/werkkapitaal → kapitaal/ROIC → ondernemingswaarde.
5. Label scenario's en waarderingen expliciet als POTENTIAL/ESTIMATED. Een EBITDA-multiple is alleen bruikbaar wanneer deze expliciet is ingevoerd en onderbouwd.
6. Een roadmapkandidaat ontstaat alleen bij een aantoonbaar ongunstige afwijking ten opzichte van een expliciete benchmark.
7. Iedere kandidaat bevat metric-id, actuele waarde, benchmark, benchmarkbron, gap, impacttype, potentiële waarde indien verantwoord, effort-score, prioriteit, sprint, duur en source fingerprint.
8. Capaciteitswaarde is geen cashbesparing. Werkkapitaalvrijval is geen EBITDA. Houd deze value types gescheiden.
9. Due-diligenceprojectie focust op duurzame/genormaliseerde EBITDA, vrije kasstroom, werkkapitaal, netto schuld, klantconcentratie, recurring revenue, ROIC en bewijs-/datakwaliteit.
10. De portal is projectie; canonieke business truth blijft in de bestaande Whole Brain state/evidence-laag.

## Kernformules
- Revenue/FTE = omzet / FTE.
- Gross profit/FTE = omzet × brutomarge / FTE.
- Revenue/hour = omzet / werkelijk gewerkte uren.
- Labour cost ratio = loonkosten / omzet.
- EBITDA margin = EBITDA / omzet.
- Cash conversion cycle = DSO + voorraaddagen − DPO.
- Receivables estimate = omzet / 365 × DSO.
- Net debt = schuld − cash.
- Net debt/EBITDA = netto schuld / genormaliseerde EBITDA.
- ROIC = NOPAT / geïnvesteerd kapitaal.
- Economic profit = NOPAT − geïnvesteerd kapitaal × WACC.
- Indicative EV = genormaliseerde EBITDA × expliciet onderbouwde multiple.

## Bronfamilies
Gebruik voor definities en rationale primair IFRS Management Commentary, ONS/BLS productivity, ISO 30414, SHRM workforce productivity, ACCA performance management, CFA valuation, PwC/Deloitte financial due diligence en Damodaran voor growth/ROIC. Bewaar volledige bron-URL's in het broncatalogusbestand of menselijke documentatie.

## Preventie
Nooit een branchegemiddelde, multiple, norm voor verzuim, productiviteit of marge verzinnen. Wanneer geen passende externe benchmark beschikbaar of opgeslagen is, toon de metric zonder norm en creëer geen benchmarkgedreven roadmapactie.
