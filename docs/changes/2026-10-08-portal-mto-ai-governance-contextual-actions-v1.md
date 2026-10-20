# Portaal — MTO, AI-governance, prioriteit en klantgerichte impactkaarten

Datum: 2026-10-08. Subobligation: `portal-mto-ai-governance-contextual-actioncards-20261008-v1`. Canoniek auditissue #4215.

## Bestaande route

Alle invoer gaat via de bestaande `domainState.set` van Portal V2 en dezelfde geauthenticeerde tenant-state/BusinessInput/ONE BRAIN. Dit is een afgeleide gebruikersinterface; geen extra client database, scheduler, autonome uitvoering of juridische beslisautoriteit.

## Inventaris (native V2)

Het exporteerbare `inventoryPortalCustomerFields()` leest `functionalSchema`, `companyInputSchema` en `fullCompanyInputSchema`; dedupliceert exact op `portal.*` veldpad; registreert voor ieder veld een paginakoppeling, veldtype en eventuele herhaalkolommen. Native pagina's zonder form-schema zijn geen bewezen invoerpagina. **Deze inventaris is niet gelijk aan alle werkelijk aanwezige DOM-formulieren van Portal Next, legacy en losse integraties.** Die 100%-audit blijft in #4215.

Bevestigde hoofdgroepen in de native invoer:
- **Profiel/gegevens invullen:** bedrijfsgrootte, uurkosten, volwassenheid per afdeling, handwerk, context.
- **Cijfers & maatstaven:** omzet, EBITDA, marge, klanten, NPS, productie, foutpercentages, diverse metingen.
- **Waarde & financiering:** balans, eigen vermogen, schuld/kas, DCF-parameters, investeringsruimte.
- **Mensen:** verzuim, verloop, eNPS, vacatures, rollen/kennisrisico; nieuw: MTO-score, respons, datum, thema's en opvolging.
- **Data & AI:** AI-volwassenheid, veranderbereidheid, governance; nieuw: use-case, verantwoordingseigenaar, klantingevulde risicoklasse, menselijk toezicht, model/leverancier, datalocatie, reviewdatum.
- **AI-scan:** taken, handwerkuren, datagereedheid en foutrisico.
- **Compliance/CSRD:** beleid en ESG-meetpunten met vastgelegde status.
- **Markt/onderzoek:** branchebenchmarks, bronnen, aannames en hypothesen.
- **Strategie & uitvoering:** canvassen, strategiekeuzen, actieadvies, roadmaps, taken, due-diligence-bevindingen en wijzigingsdossiers.

## Contextueel besliscontract

`buildContextualActionCards(state)` projecteert een bestaande tenant-state, zonder opslag:
1. MTO <=5/10 geeft P1-beoordelingsvoorstel; 5–7/10 P2; lage respons vraagt representativiteitsreview. Het zijn *interne signaleringsgrenzen*, geen sector- of wettelijke normen.
2. AI-gebruik met ontbrekend eigenaarschap/risicoclassificatie of hoge zelfingevulde klasse leidt tot reviewkaarten op Data & AI, Compliance, AI Act, CSRD, risico, geld en roadmap. Geen juridische AI Act-classificatie.
3. Ontbrekende beleidsstatus, negatief eigen vermogen, hoge grootste-klantconcentratie en langere DSO genereren verklaarbare signalen, geen automatische handhavings- of financiële uitspraak.
4. Nieuwe regelgevingssignalen krijgen alleen verhoogde prioriteit bij expliciete `source-universe-company-impact`, tenant-scoped en `VERIFIED` plus gerichte toepasselijkheid; ze blijven `PROPOSAL_REVIEW_REQUIRED`. Zonder bron-, tenant- of scopebewijs: eerst bron en toepasbaarheid verifiëren.
5. Kaarten hebben prioriteit, bronpad, reden, geraakt paginabereik, volgende stap, evidence-status en `financialImpact.amount=null` totdat kwantificatie onderbouwd kan worden.
6. De bestaande `mountContextualForesight` toont contextkaarten op betrokken pagina's en laat een gebruiker expliciet een roadmapvoorstel maken. `sourceFingerprint` voorkomt dubbel toevoegen; het voorstel is geen uitgevoerde taak. Server-confirmatie wordt niet gefingeerd als `flush` nog dirty/pending is.

## Buiten scope en bewijsgrenzen

Automatisch extern wetgevingsnieuws ophalen, juridische toepasselijkheid vaststellen, alle legacy/standalone inputs verbinden, daadwerkelijke €-risicoberekening vanuit MTO zonder kostenbenchmark, en de volledige klant-end-to-end browserreadback zijn **niet** gerealiseerd met deze UI-wijziging. Externe source-events moeten via de bestaande Source Universe/Company Impact naar tenantcontext geprojecteerd worden en mogen klantinvoer nooit overschrijven.

## Verificatie en preventie

`node --test portal-v2/tests/contextual-action-cards.test.mjs`.
Negatieve scenario's: lege state, lage MTO-respons, ontbrekende AI-eigenaar, voorlopig hoog risico zonder human oversight, niet-geverifieerde wet, financiële risicosignalen, idempotent roadmapvoorstel. Beschermd merge/Netlify exact-SHA plus geauthenticeerde tenant-browserreadback vereist voor bewezen productie.
