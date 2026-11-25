import { PORTAL_PAGE_INDEX } from './page-registry.js';
import { screenCsrdEsrsScope } from './csrd-legal-source-gate.js';

// Read-only, source-aware explanation of where a reported regulatory change
// may affect a tenant. These are review dependencies, not legal determinations.
const COMMON = Object.freeze(['wet-regelgeving','omgevingsradar','overzicht','compliance-governance','due-diligence','advies','roadmap','taken-werkstromen']);
const AREAS = Object.freeze([
  {id:'ai',test:/(?:(?:EU[_ -]?)?AI[_ -]?ACT|ARTIFICIAL[_ -]?INTELLIGENCE|AI[_ -]?REGULATION)/i,
   label:'AI-modellen, inzet en menselijk toezicht',
   pages:['data-ai','ai-capabilities','ai-scan','eu-ai-act-audit','data-ai-passport','trust-center','koppelingen','businesscase','waarde-financiering'],
   reviews:['Inventariseer AI-toepassingen, rollen en risicoclassificatie','Toets menselijk toezicht, leveranciersbewijs en eventuele implementatiekosten']},
  {id:'privacy',test:/(?:GDPR|AVG|PRIVACY|DATA[_ -]?PROTECTION)/i,
   label:'Persoonsgegevens, verwerkers en doorgifte',
   pages:['trust-center','data-ai-passport','koppelingen','data-ai','documenten','audit','waarde-financiering'],
   reviews:['Toets gegevensstromen, grondslag, bewaartermijn en contracten','Bepaal noodzakelijke beveiligings- en proceswijzigingen']},
  {id:'cyber',test:/(?:NIS2?|CYBER|CBW|CYBERBEVEILIGINGSWET|DORA)/i,
   label:'Cyberweerbaarheid, leveranciers en bedrijfscontinuïteit',
   pages:['trust-center','koppelingen','datahubstatus','herstel-continuiteit','audit','uitvoeringsladder','businesscase','waarde-financiering'],
   reviews:['Controleer sector, entiteitsgrootte en ketenrol','Toets incidentrespons, herstelvermogen, leveranciers en capaciteit']},
  {id:'sustainability',test:/(?:CSRD|ESRS|CSDDD|DUURZAAM|SUSTAINAB|ESG)/i,
   label:'Duurzaamheid, rapportage en keteninformatie',
   pages:['csrd-impact','cijfers-maatstaven','bronnenbibliotheek','koppelingen','onderzoek','waarde-financiering','businesscase'],
   reviews:['Toets toepasselijkheid, ingangsdatum en materialiteit','Breng ontbrekende brongegevens, meetmethoden, eigenaars en kosten in kaart']},
  {id:'people',test:/(?:ARBEID|EMPLOYMENT|LABOU?R|PERSONEEL|WORKFORCE)/i,
   label:'Mensen, arbeidsvoorwaarden en capaciteit',
   pages:['mensen','arbeidsmarkt-personeel','uitvoeringsladder','herstel-continuiteit','businesscase','waarde-financiering'],
   reviews:['Toets personeels- en contractscope','Bepaal operationele aanpassing, capaciteitsgevolgen en opleidingsbehoefte']},
  {id:'finance',test:/(?:BELASTING|TAX|FINANC|ACCOUNT|RAPPORTAGE|REPORTING)/i,
   label:'Financiële administratie, verslaglegging en liquiditeit',
   pages:['cijfers-maatstaven','waarde-financiering','businesscase','audit','exit','portfolio-control'],
   reviews:['Toets de feitelijke verslagleggings- of fiscale verplichting','Bereken pas na gevalideerde uitgangspunten kosten, kasstroom en waarderingsscenario’s']}
]);
const uniq=items=>[...new Set(items)];
const valid=items=>uniq(items).filter(x=>Boolean(PORTAL_PAGE_INDEX[x]));
const normalized=v=>String(v??'').trim();
const asDate=v=>/^\d{4}-\d\d-\d\d$/.test(normalized(v))?normalized(v):null;

export function regulatoryContextTrace(event={}) {
  const topic=[event.framework,event.regime,event.category,event.topic,event.title].filter(Boolean).join(' ');
  const matched=AREAS.filter(x=>x.test.test(topic));
  const sections=matched.length?matched:[]; // unknown regulations: generic review, never invented scope
  const verified=event.authority==='source-universe-company-impact'&&event.tenantScoped===true&&event.evidenceStatus==='VERIFIED';
  const reportedApplicable=verified&&event.customerRelevance==='applicable';
  const fallbackPages=sections.length?[]:['csrd-impact','waarde-financiering','businesscase'];
  const affectedPages=valid([...COMMON,...fallbackPages,...sections.flatMap(x=>x.pages)]);
  const reviews=uniq([...sections.flatMap(x=>x.reviews),
    'Controleer de officiële brontekst, actuele versie, datum en toepasselijkheid op de klant',
    'Bepaal risico, verantwoordelijke, benodigde bewijsstukken, prioriteit en herbeoordelingsmoment']);
  const missing=[];
  if(!normalized(event.sourceUrl))missing.push('Officiële bronlink ontbreekt of is niet gekoppeld');
  if(!asDate(event.effectiveDate||event.deadline))missing.push('Ingangsdatum of toepasselijke deadline is nog niet bevestigd');
  if(!reportedApplicable)missing.push('Klanttoepasselijkheid is nog niet onafhankelijk vastgesteld');
  if(!sections.length)missing.push('Onderwerp heeft nog geen specifieke domeinmapping: inhoudelijke triage vereist');
  const legalBasis=sections.some(section=>section.id==='sustainability')?screenCsrdEsrsScope({
    financialYearStart:event.financialYearStart,
    averageEmployees:event.averageEmployees,
    netTurnoverEur:event.netTurnoverEur,
    entityScope:event.entityScope,
    memberState:event.memberState,
    nationalImplementationEvidence:event.nationalImplementationEvidence,
    legalReviewEvidence:event.legalReviewEvidence,
    esrsMaterialityEvidence:event.esrsMaterialityEvidence
  }):null;
  const impactByPage=affectedPages.map(page=>({
    page,
    via:sections.filter(x=>x.pages.includes(page)).map(x=>x.id),
    why:sections.filter(x=>x.pages.includes(page)).map(x=>x.label).join('; ')||'Overkoepelend besluit, compliancecontrole of opvolging'
  }));
  return Object.freeze({
    framework:normalized(event.framework||event.regime||'Onbekend'),
    sourceUrl:normalized(event.sourceUrl)||null,
    effectiveDate:asDate(event.effectiveDate||event.deadline),
    eventId:normalized(event.id||event.title)||null,
    priority:reportedApplicable?'P1':'P2',
    customerRelevance:reportedApplicable?'SOURCE_VERIFIED_REVIEW_REQUIRED':'APPLICABILITY_REVIEW_REQUIRED',
    legalStatus:'REVIEW_REQUIRED',
    ...(legalBasis?{legalBasis}:{}),
    financialStatus:'NOT_QUANTIFIED',
    domainLabels:Object.freeze(sections.map(x=>x.label)),
    affectedPages:Object.freeze(affectedPages),
    impactByPage:Object.freeze(impactByPage.map(x=>Object.freeze(x))),
    requiredReviews:Object.freeze(reviews),
    missingEvidence:Object.freeze(missing),
    provenanceStatus:reportedApplicable?'TENANT_SOURCE_VERIFIED_LEGAL_REVIEW_REQUIRED':'SOURCE_AND_TENANT_REVIEW_REQUIRED'
  });
}
