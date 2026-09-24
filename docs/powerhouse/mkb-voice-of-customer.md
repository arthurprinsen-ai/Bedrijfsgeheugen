# MKB Voice of Customer, Probleemradar & Opportunity Intelligence

## Purpose
Make public, first-hand entrepreneur complaints and frustrations a canonical input for Powerhouse opportunity detection, product intelligence, blogs, and LinkedIn company content. This is not a separate content island: it is the front end of the existing Powerhouse intelligence/opportunity/content loop.

## Canonical closed loop
voice of customer -> normalize -> deduplicate -> cluster -> quantify -> opportunity score -> problem hypothesis -> buying trigger -> company/sector relevance -> recommended Powerhouse capability -> content candidate -> blog/company LinkedIn -> publish gate -> readback -> engagement/lead/outcome -> learning writeback

## Source policy
Use:
- first-hand entrepreneur signals from public forums, Reddit, Higherlevel, public business communities and interviews;
- quantitative validation from CBS, KVK, RVO, DNB, MKB-Nederland/VNO-NCW, banks and industry bodies;
- existing Powerhouse external signals such as sector changes, growth, new management, M&A, ERP/accounting changes, margin pressure, staff shortages, regulation, financing and post-acquisition integration.

Forum/interview evidence is qualitative and must never be represented as a market statistic.

## Signal schema
For every signal store:
- date;
- source type;
- sector/company type;
- company size if public;
- short paraphrased complaint;
- symptom;
- root problem;
- business impact;
- buying trigger;
- urgency;
- recurrence count;
- sector spread;
- quantitative validation status;
- related Powerhouse capability;
- opportunity hypothesis;
- content angle;
- source URL;
- evidence status.

## Canonical recurring problems
1. Growth breaks Excel, Outlook and loose task lists.
2. The owner becomes the operational bottleneck.
3. Knowledge and customer commitments live in people's heads.
4. Disconnected systems create duplicate entry and reconciliation.
5. Planning, capacity and availability become opaque.
6. CRM/ERP/software is too heavy, expensive or creates extra administration.
7. Accountant/bookkeeper dependency without real-time management insight.
8. Tax, cash-flow and forecast surprises.
9. Manual invoicing, debtor follow-up and bank reconciliation.
10. Inventory growth requires working-capital financing.
11. Staff shortages, absenteeism and knowledge loss.
12. Sales/acquisition activity without predictable conversion.
13. Permits, subsidies, privacy and regulatory burden are hard to navigate.
14. Grid congestion blocks expansion, locations and sustainability investments.
15. Energy, labour, purchasing and transport costs compress margins.
16. Lack of time, people and expertise slows innovation, digitalisation and AI.
17. Cyber, cloud, internet and operational continuity risks.
18. Strategy exists but ownership, prioritisation and execution lag.
19. Management information is late, fragmented or not decision-ready.
20. Business sale, succession, due diligence or acquisition exposes undocumented knowledge and weak processes.

## Opportunity Intelligence integration
Every normalized signal is eligible for the existing Powerhouse Opportunity layer.

Create or update an opportunity when at least one of these holds:
- the same problem recurs independently;
- the problem is quantitatively validated;
- a buying trigger is visible;
- a concrete company/sector trigger matches the problem;
- the problem maps to a measurable Powerhouse capability;
- the expected business impact is material.

For every opportunity derive:
- target segment/sector;
- trigger;
- problem hypothesis;
- decision-maker;
- evidence strength;
- urgency;
- commercial intent;
- Powerhouse fit;
- next best action;
- recommended content;
- recommended Frisse Blik/scan/implementation route.

## Opportunity scoring
Use a 0-100 score with explicit components:
- recurrence 0-15;
- recency 0-10;
- quantitative validation 0-15;
- business impact 0-15;
- buying-trigger strength 0-15;
- decision-maker relevance 0-10;
- Powerhouse capability fit 0-10;
- content/SEO opportunity 0-5;
- lead/revenue potential 0-5.

Do not fabricate numeric evidence. The score is prioritisation logic, not a market statistic.

## Content engine integration
The problem radar is a mandatory candidate source for:
- company LinkedIn posts;
- blogs;
- SEO opportunity content;
- Frisse Blik hooks;
- sector pages;
- case/problem explainers;
- commercial outreach hypotheses.

Company LinkedIn and blogs must start with a concrete CEO/MT problem in entrepreneur language, not with product features.

Preferred structure:
problem recognition -> concrete symptoms -> business impact -> current evidence -> root cause -> practical approach -> relevant Powerhouse capability -> measurable result -> CTA

## Daily content selection
When selecting the next company LinkedIn post or blog:
1. read current entrepreneur signals and existing content state;
2. exclude duplicates and recently exhausted angles;
3. rank candidate problems by opportunity score;
4. prefer a current signal with concrete entrepreneur language plus quantitative validation;
5. connect it to a real Powerhouse capability already present or explicitly mark a product gap;
6. generate channel-specific copy;
7. pass existing publication, identity and duplicate gates;
8. after publishing, write back reach, clicks, leads and qualitative reactions;
9. increase/decrease future priority based on observed outcome.

## Product intelligence
A repeated complaint that Powerhouse cannot currently solve is not forced into marketing. Mark it as PRODUCT_GAP and feed it to product/portal intelligence with:
- problem evidence;
- affected segment;
- expected value;
- missing capability;
- suggested experiment;
- success metric.

## Quality and privacy gates
- Do not identify or profile forum users.
- Do not invent numbers, quotes or company details.
- Always retain source URL and date.
- Deduplicate repeated signals while preserving recurrence counts.
- Old signals may support a pattern, but current content requires current validation.
- Do not claim representative prevalence from anecdotes.
- Do not publish a capability claim that production evidence cannot support.
- Fail closed on duplicate publication or uncertain provider readback.

## Operating loop
1. Gather new entrepreneur signals.
2. Normalize into the signal schema.
3. Deduplicate and cluster.
4. Validate high-value clusters quantitatively.
5. Score for urgency, recurrence, commercial intent and Powerhouse fit.
6. Feed the canonical problem radar and Opportunity Intelligence.
7. Generate content/opportunity candidates.
8. Publish through existing company LinkedIn/blog gates.
9. Read back publication and performance.
10. Write outcome and learning back to opportunity, problem radar and this skill.

## Governance
This document is canonical documentation for the Powerhouse MKB Voice-of-Customer integration. The skill file is the executable/reusable instruction projection. Both must remain aligned.

## Evidence contract
A content item or opportunity derived from this source must be traceable to source URLs and dates. Anecdotal evidence stays qualitative. Quantitative claims require a quantitative source.

## Integration contract
This capability must reuse the existing Powerhouse opportunity, content, publication, deduplication, learning and production-readback mechanisms. Do not create a parallel scheduler, publisher, content calendar or opportunity database.
