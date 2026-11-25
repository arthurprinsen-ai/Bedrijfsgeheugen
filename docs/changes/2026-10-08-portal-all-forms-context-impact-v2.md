# Portaal: alle native invulvelden in context, gerelateerde kaarten, prioriteiten en roadmap

Datum: 2026-10-08. P0 audit #4215; subobligation `portal-all-form-context-action-coverage-20261008-v2`.

## Werkelijke broncode geïnventariseerd

Recursieve GitHub-tree van main bevatte 235 JS/MJS/HTML-bestanden in Portal V2 en 27 in Portal Next (bestandstelling, **niet** 262 bewezen invoerformulieren). De centrale `functionalSchema`, `companyInputSchema` en `fullCompanyInputSchema` leveren de getypeerde native declaraties. Daarnaast expliciet bekeken: `business-context-workspace`, `change-wizard`, `ai-capability-workspace`, `strategic-model-workspace`, Portal Next connector-builder en legacy compliance-input adapter.

`inventoryPortalCustomerFields()` publiceert het exacte canonieke veldpad, eigenaarspagina, type, herhaalkolommen en nu impactclassificatie plus geraakte paginas en modelgroepen. Iedere regel draagt `declarationOnly=true` en `readbackStatus=TENANT_ACK_REQUIRED`; hierdoor is statische schema-inventaris geen misleidende claim dat ieder werkend DOM-veld live end-to-end bewezen is. Speciale schermen zonder statische paden blijven expliciet in `SUPPLEMENTAL_PORTAL_INPUT_SURFACES` als aparte provider-/tenant-audit. Onbekende paden blijven `REVIEW_REQUIRED`.

## Koppeling naar tenantrelevante gevolgen

De bestaande `contextual-action-cards` en `mountContextualForesight` blijven één bestaande projectielaag. Regels in `contextual-action-rules-extended` behandelen naast reeds live MTO/AI/financiën/wetsignalen ook:
- profielvolwassenheid en capacititeitsrisico;
- personeelsverloop en kritieke kennis zonder vervanger;
- negatieve EBITDA, lage EBITDA-marge, brutomarge, klant-NPS en klanttevredenheid;
- uitvoeringsfouten, leverbetrouwbaarheid, klantverloop en offerteconversie;
- AI-taakrisico, datagereedheid en taakcijfers;
- ontbrekend ESG-meetbewijs, benchmarkverschillen en hypothesen zonder sterk bewijs;
- red flags en materialiteit in due diligence;
- gekozen bedrijfsfase, financiering, koop/verkoop, overname en andere strategische triggers;
- open grote bedrijfswijzigingen, geblokkeerde taken en achterstallige deadlines.

Elke kaart vermeldt bronpad, priority P1/P2, voorwaardelijke betekenis, concrete volgende stap, getroffen paginacontext, status `PROPOSAL_REVIEW_REQUIRED`. `toRoadmapProposal` blijft expliciet; alleen een gebruikersactie maakt een voorstel, geen autonome daadwerkelijke bedrijfsinterventie. Geen tweede Brain/Heartbeat/queue.

## Financiële modellen en grenzen

Wanneer klant **omzet** (€ × 1.000) en **DSO** invoert: indicatief vrijvalscenario bij DSO=60 is omzet × 1.000 × max(DSO-60,0) / 365. Wanneer klant uurtarief en handwerkuren invoert: taakjaarkosten = uren/week × 46 × tarief. Beide uitsluitend `SCENARIO_ONLY`, **geen gegarandeerde besparing, kasstroom of aangetoond resultaat**. Zonder volledige gegevens: `NOT_QUANTIFIED` en lege bedragwaarde. Wettelijke toepasselijkheid, compliance en ESG-emissies nooit zonder bron-/tenantbewijs berekenen.

## Belangrijk herstel: wijzigingenwizard

De oude wizard riep `domainState.set({...state})` aan terwijl de contractuele API `set(path,value)` vereist. Nu wordt met `saveChangeProposal` alleen `portal.changes.items` gewijzigd en `flush()` afgewacht, zonder dubbel voorstel bij een retry. `impactSemantics='affected_capability_count'` verhindert verwarring met subjectieve materialiteit 1–5. Een voorstel is geen geautoriseerde uitvoering.

## Bewijsgrenzen

- De volledige DOM-field, Portal Next, legacy, connector, upload, aparte AI- en abonnement/workspace-inventaris plus write-target/readback is **niet** sluitend door een statische native schema-registry.
- Mutatie-naar-echte modelberekening / verified external result / wettelijk geldende deadline / provideracties is niet automatisch bewezen door een contextueel actiekaartje.
- Productie-evidence vereist beschermde merge + exact-source Netlify + geauthenticeerde tenant/Brain DOM-readback; P0 audit #4215 blijft open tot die onafhankelijke bewijzen er zijn.

Tests: `node --test portal-v2/tests/all-forms-contextual-impact.test.mjs portal-v2/tests/contextual-action-cards.test.mjs portal-v2/tests/portal-causal-propagation.test.mjs`.
