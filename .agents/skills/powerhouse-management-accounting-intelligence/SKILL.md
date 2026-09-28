# Powerhouse Management Accounting & Value Driver Intelligence

## Doel
Gebruik management accounting, workforce/productivity, cash/werkkapitaal en M&A/waarderingslogica als één evidence-first value-driver graph. Deze skill is verplicht zodra een agent of chat financiële performance, productiviteit, personeel, cash, due diligence, ondernemingswaarde, KPI-benchmarks of klantroadmaps analyseert.

## Canonieke regel
- Geen los KPI-dashboard en geen tweede waarheid.
- Lees altijd de bestaande tenant-scoped Portal/Brain state en de expliciete benchmarkrecords.
- Bereken alleen een metric wanneer de benodigde inputs aanwezig zijn.
- Ontbrekende input blijft een datagap; nooit 0, branchegemiddelde of een generieke internetbenchmark invullen alsof het klantfeit is.
- Een benchmark is pas actie-sturend wanneer hij expliciet in portal.market.benchmarks staat met bron/context.
- Cross-industry of buitenlands onderzoek mag context geven, maar is geen klanttarget zonder sector-/land-/omvangsfit.

## Value-driver keten
Mensen → Productiviteit → Operatie & kwaliteit → Commercie & klant → Marge/EBITDA → Cash & werkkapitaal → Kapitaal/ROIC → Ondernemingswaarde.

Iedere relevante metric moet waar mogelijk gekoppeld worden aan: actuele klantwaarde, expliciete benchmark en bron, afwijking/richting, root-cause hypothese, €-impacttype, effort, tijd-tot-waarde, roadmap-item, outcome metric en realized-value readback.

## Productiviteit
Voorkeur voor output per werkelijk gewerkt uur boven alleen output per medewerker als uren beschikbaar zijn. Output per FTE blijft bruikbaar als bestuurlijke ratio. Houd revenue/output, gross-profit output en EBITDA-output uit elkaar.

Minimaal ondersteunen: omzet/FTE; brutowinst/FTE; EBITDA/FTE; omzet/uur; brutowinst/uur; declarabel/productief %; orders/FTE; doorlooptijd; op tijd geleverd; foutpercentage.

## Mensen
Minimaal ondersteunen: loonkosten/omzet; verzuim; verloop; training; vacatures/critical-role coverage zodra beschikbaar; capaciteitseffect en kennisrisico als aparte impacttypen. Gebruik ISO 30414 als taxonomische basis; maak nooit medische of individuele werknemersconclusies.

## Management accounting
Minimaal ondersteunen: brutomarge; EBITDA-marge; contribution margin; break-even omzet; operating leverage zodra vaste/variabele kosten betrouwbaar zijn; ROI/ROCE/ROIC alleen met correcte kapitaalbasis; EVA/economic profit = NOPAT minus capital charge; vrije kasstroom en cash conversion; scenario-/sensitivity-analyse.

## Cash & working capital
Minimaal ondersteunen: DSO; inventory days; DPO; cash conversion cycle; indicatief debiteurenbeslag; werkkapitaalvrijval als cash-impact, nooit als EBITDA-besparing.

## M&A / verkoopklaarheid
Projecteer minimaal: genormaliseerde/maintainable EBITDA; quality-of-earnings signalen; recurring revenue; klantconcentratie; netto schuld en debt-like exposures; genormaliseerd werkkapitaal; FCF/cash conversion; CAPEX-behoefte; leverage/rentedekking; groeikwaliteit en benchmarkcontext; onderbouwde EV/EBITDA multiple; enterprise value → equity value bridge.

Een multiple is input/context, geen universele waarheid. Geen ondernemingswaarde claimen zonder onderbouwde earningsbasis én multiple.

## Roadmap
buildManagementAccountingRoadmap maakt alleen kandidaten wanneer een expliciete benchmark bestaat en de klant ongunstig afwijkt. Iedere kandidaat bevat sourceFingerprint, metric/current/benchmark/source, effort score, priority score, start sprint en duration, impact label POTENTIAL, expected value alleen als de formule verantwoord is, value type en rationale.

Dedupe altijd op sourceFingerprint; nooit dubbele roadmapitems maken.

## Waardetypen
- working_capital_release: cash/balans, geen winst.
- annual_gross_profit_potential: scenario op brutowinst.
- annual_ebitda_potential: scenario op EBITDA.
- capacity_value: vrijspeelbare/benutte capaciteit, niet automatisch cashbesparing.
- unquantified: eerst bewijs/inputs aanvullen.

## Bronbasis
- IFRS Management Commentary: https://www.ifrs.org/issued-standards/list-of-standards/management-commentary-practice-statement-1/
- ONS labour productivity: https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/labourproductivity/methodologies/labourproductivityqmi
- BLS productivity: https://www.bls.gov/productivity/overview.htm
- ISO 30414:2025: https://www.iso.org/standard/30414
- SHRM Revenue per FTE brief: https://www.shrm.org/content/dam/en/shrm/topics-tools/research/chro-benchmarking-data-brief.pdf
- ACCA performance management: https://www.accaglobal.com/gb/en/student/exam-support-resources/professional-exams-study-resources/p5/technical-articles/divisional-performance-management.html
- ACCA EVA: https://www.accaglobal.com/uk/en/student/exam-support-resources/professional-exams-study-resources/p4/technical-articles/economic-value-added.html
- CFA free cash flow valuation: https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/free-cash-flow-valuation
- CFA market multiples: https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/market-based-valuation-price-enterprise-value-multiples
- PwC financial due diligence: https://www.pwc.com/us/en/services/consulting/deals/joint-ventures-alliances/financial-due-diligence.html
- Deloitte due diligence: https://www.deloitte.com/content/dam/assets-zone2/ie/en/docs/services/financial-advisory/2023/IE_CF_MA_Preparing_your_business_Due_Diligence_A4_2pp_0119_FINAL.pdf
- Damodaran growth/value: https://pages.stern.nyu.edu/adamodar/New_Home_Page/valquestions/growth.htm

## Productieregel
Een portalvisual mag alleen observed, estimated, input of POTENTIAL tonen volgens de onderliggende truth class. Geen gerealiseerde besparing of bedrijfswaarde claimen zonder productie/readback en gerealiseerde outcome-evidence.