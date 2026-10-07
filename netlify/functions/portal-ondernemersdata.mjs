import { getUser } from '@netlify/identity';
import { resolveIdentityTenant } from '../../platform/read-models/portal-server-state.mjs';

const PROJECT_URL='https://adhjwmvyoixzjtmiroln.supabase.co';
const env=name=>String(Netlify.env.get(name)||'').trim();
const serviceKey=()=>env('SUPABASE_SERVICE_ROLE_KEY')||env('SUPABASE_SERVICE_KEY')||env('SUPABASE_SECRET_KEY');
const supabaseUrl=()=>env('SUPABASE_URL')||PROJECT_URL;
const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, max-age=60, stale-while-revalidate=240','content-type':'application/json; charset=utf-8','vary':'authorization, cookie'}});

const DOMAIN_META=Object.freeze({
  REGULATION_COMPLIANCE:{label:'Wetgeving & compliance',pillar:'Regels & vertrouwen',description:'Wetgeving, toezicht, privacy, AI-regels, cyberwetgeving, vergunningen en sectorspecifieke verplichtingen.'},
  CYBER_SECURITY:{label:'Cybersecurity',pillar:'Regels & vertrouwen',description:'Kwetsbaarheden, ransomware, identity threats, supply-chain attacks en security-advisories.'},
  AI_TECHNOLOGY:{label:'AI & technologie',pillar:'Technologie',description:'AI-modellen, agents, cloud, software, chips, data-platformen en technische doorbraken.'},
  MARKET_CUSTOMER:{label:'Markt & klantgedrag',pillar:'Markt & klant',description:'Vraag, zoekgedrag, reviews, prijsgevoeligheid, klantvoorkeuren en veranderende segmenten.'},
  COMPETITION:{label:'Concurrentie',pillar:'Markt & klant',description:'Producten, prijzen, vacatures, campagnes, partnerships, investeringen en positionering van concurrenten.'},
  ECONOMY_FINANCE:{label:'Economie & financiering',pillar:'Economie & kapitaal',description:'Inflatie, rente, krediet, groei, faillissementen, vertrouwen, cashflow- en financieringscondities.'},
  SUBSIDIES_INCENTIVES:{label:'Subsidies & fiscale kansen',pillar:'Economie & kapitaal',description:'RVO, EU-fondsen, fiscale regelingen, garanties, innovatie- en verduurzamingssteun.'},
  LABOR_SKILLS:{label:'Arbeidsmarkt & skills',pillar:'Mensen',description:'Vacatures, lonen, schaarste, beroepen, vaardigheden, opleidingen en AI-literacy.'},
  ENERGY_CLIMATE:{label:'Energie & klimaat',pillar:'Resources & keten',description:'Energieprijzen, netcongestie, fysieke klimaatrisico’s, CO₂, circulariteit en verduurzaming.'},
  SUPPLY_CHAIN:{label:'Supply chain & grondstoffen',pillar:'Resources & keten',description:'Leveranciers, logistiek, havens, vracht, levertijden, grondstoffen en single-source dependencies.'},
  GEOPOLITICS_TRADE:{label:'Geopolitiek & handel',pillar:'Wereld & handel',description:'Sancties, oorlog, verkiezingen, import/export, douane, handelsbeperkingen en landenrisico.'},
  PUBLIC_PROCUREMENT:{label:'Publieke aanbestedingen',pillar:'Markt & klant',description:'TenderNed, TED en andere publieke inkoopkansen passend bij bedrijfs-capabilities.'},
  IP_INNOVATION:{label:'Patenten & innovatie',pillar:'Technologie',description:'Octrooien, merken, technologieclusters en nieuwe intellectuele-eigendomsactiviteit.'},
  LOCATION_MOBILITY:{label:'Locatie & mobiliteit',pillar:'Assets & locatie',description:'Vastgoed, bereikbaarheid, infrastructuur, bedrijfsterreinen, vervoer en wagenpark.'},
  TRUST_FINANCIAL_CRIME:{label:'Reputatie, fraude & verzekering',pillar:'Regels & vertrouwen',description:'Reviews, recalls, rechtszaken, fraude, AML, sanctielijsten, verzekering en verzekerbaarheid.'},
  GENERAL_ENVIRONMENT:{label:'Algemene omgeving',pillar:'Maatschappij',description:'Demografie, gezondheid, maatschappelijke trends, media en overige externe veranderingen.'},
  COMPANY_MARKET:{label:'Bedrijfsregisters & marktstructuur',pillar:'Markt & klant',description:'Bedrijfsregisters, oprichtingen, bestuurderswissels, M&A en marktstructuur.'},
  LOCAL_ENVIRONMENT:{label:'Lokale omgeving',pillar:'Assets & locatie',description:'Gemeente, provincie, lokale vergunningen, infrastructuur, economie en arbeidsmarkt.'},
  STANDARDS_GOVERNANCE:{label:'Normen & standaarden',pillar:'Regels & vertrouwen',description:'ISO, NEN, CEN/CENELEC en andere management-, security-, quality- en AI-standaarden.'},
  HEALTH_DISRUPTION:{label:'Gezondheid & verstoringen',pillar:'Maatschappij',description:'Publieke gezondheid, ziekteverzuim en verstoringen die workforce of keten kunnen raken.'},
  DEMOGRAPHY_SOCIAL:{label:'Demografie & maatschappij',pillar:'Maatschappij',description:'Vergrijzing, migratie, huishoudens, regionale ontwikkeling en sociaal-culturele trends.'},
  MEDIA_COMMUNITIES:{label:'Media & communities',pillar:'Markt & klant',description:'Vakmedia, nieuws, LinkedIn, Reddit, YouTube en andere publieke conversaties als signaal.'},
  SEARCH_DIGITAL_DEMAND:{label:'Zoek- & digitale vraag',pillar:'Markt & klant',description:'Zoekvolume, SERP’s, SEO, digitale intentie en opkomende klantvragen.'},
  PRICING:{label:'Prijsinformatie',pillar:'Markt & klant',description:'Concurrentprijzen, leveranciersprijzen, marktprijzen, indexaties en prijsbewegingen.'},
  INSURANCE:{label:'Verzekering & verzekerbaarheid',pillar:'Economie & kapitaal',description:'Premies, dekking, cyberverzekering, aansprakelijkheid en acceptatievoorwaarden.'},
  BUSINESS_REGISTERS_MA:{label:'Bedrijfsregisters & M&A',pillar:'Markt & klant',description:'Bedrijfsstatus, filings, bestuurderswissels, overnames, investeringen en consolidatie.'},
  INTERNAL_FINANCE:{label:'Financiën & cashflow',pillar:'Binnen het bedrijf',description:'Boekhouding, omzet, marge, cashflow, betalingen, budget en financiering.'},
  INTERNAL_CUSTOMERS_SALES:{label:'Klanten & sales',pillar:'Binnen het bedrijf',description:'CRM, pipeline, offertes, orders, klantwaarde, churn, behoeften en commerciële uitkomsten.'},
  INTERNAL_PEOPLE:{label:'Mensen & HR',pillar:'Binnen het bedrijf',description:'Capaciteit, verzuim, skills, verloop, engagement en workforce planning.'},
  INTERNAL_PROJECTS:{label:'Projecten & delivery',pillar:'Binnen het bedrijf',description:'Portfolio, projecten, milestones, dependencies, issues, tijd en budget.'},
  INTERNAL_SYSTEMS_DATA:{label:'Systemen & data',pillar:'Binnen het bedrijf',description:'Applicaties, integraties, data-platforms, BI, datakwaliteit en technische afhankelijkheden.'},
  INTERNAL_KNOWLEDGE:{label:'Documenten & kennis',pillar:'Binnen het bedrijf',description:'Documenten, contracten, besluiten, procedures, e-mailcontext en bedrijfskennis.'},
  INTERNAL_SUPPLIERS:{label:'Leveranciers & inkoop',pillar:'Binnen het bedrijf',description:'Leveranciers, contracten, spend, afhankelijkheden, kwaliteit en supplier performance.'},
  INTERNAL_MARKETING:{label:'Marketing & digitaal',pillar:'Binnen het bedrijf',description:'Website, analytics, advertenties, content, SEO, campagnes en conversie.'},
  INTERNAL_SERVICE:{label:'Service & kwaliteit',pillar:'Binnen het bedrijf',description:'Helpdesk, klachten, NPS, SLA, servicekwaliteit, defecten en herstel.'},
  INTERNAL_OPERATIONS:{label:'Processen & operatie',pillar:'Binnen het bedrijf',description:'ERP, productie, voorraad, kwaliteit, doorlooptijden en operationele afwijkingen.'}
});

async function table(path,key){
  const response=await fetch(`${supabaseUrl()}/rest/v1/${path}`,{headers:{apikey:key,authorization:`Bearer ${key}`,accept:'application/json'}});
  if(!response.ok)throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  return response.json();
}

function normalizeCatalog(rows){
  return rows.map(item=>({
    source_key:item.source_key,
    label:item.label,
    publisher:item.provider,
    scope:item.authority_tier==='INTERNAL'?'internal':'external',
    domain_keys:[item.domain_key],
    source_kind:item.source_type,
    authority_tier:item.authority_tier,
    activation_mode:item.acquisition_mode==='connector'?'CONNECTOR_REQUIRED':item.acquisition_mode==='search'?'PROVIDER_REQUIRED':'PUBLIC_ALWAYS',
    canonical_url:item.official_url,
    adapter_key:item.acquisition_mode,
    update_cadence:item.refresh_cadence,
    jurisdiction:item.geography,
    availability_state:item.availability_state,
    metadata:{description:item.description,updatedAt:item.updated_at}
  }));
}

function normalizeSignals(rows){
  return rows.map(item=>({
    tenant_id:item.tenant_id,
    signal_key:item.signal_key,
    source_key:'external-intelligence',
    external_url:item.source_url,
    domain_key:item.domain_key,
    signal_type:item.nature,
    direction:'UNKNOWN',
    title:item.signal_title,
    summary:item.evidence?.summary||'',
    observed_at:item.observed_at,
    deadline:item.evidence?.deadline||null,
    source_trust:item.evidence?.source_trust??null,
    confirmation:item.evidence?.confirmation??null,
    freshness:item.evidence?.freshness??null,
    relevance:item.relevance,
    source_confidence:item.confidence,
    probability:item.likelihood,
    magnitude:item.magnitude,
    exposure:item.exposure,
    urgency:item.urgency,
    signal_score:item.impact_score,
    impact_score:item.exposure==null?null:item.impact_score,
    impact_status:item.exposure==null?'NEEDS_COMPANY_CONTEXT':'SCORED',
    estimated_value_eur:item.value_eur,
    estimated_loss_eur:item.downside_eur,
    time_horizon_days:null,
    status:item.action_status,
    evidence:item.evidence
  }));
}

function actionCandidates(signals){
  return signals
    .filter(item=>Number(item.signal_score)>=65&&item.status!=='CLOSED')
    .map(item=>({
      action_key:`environment:${item.signal_key}`,
      signal_key:item.signal_key,
      domain_key:item.domain_key,
      title:`Beoordeel impact: ${item.title}`,
      rationale:item.impact_status==='SCORED'
        ? 'Bedrijfsspecifieke exposure is beschikbaar; bepaal eigenaar, concrete maatregel en meetbaar outcome.'
        : 'Koppel dit externe signaal eerst aan eigen exposure, proces, KPI, klant, leverancier of systeem. Zonder die context blijft euro-impact onbekend.',
      action_type:'IMPACT_REVIEW',
      priority_score:Number(item.signal_score)||0,
      owner_hint:null,
      due_at:item.deadline||null,
      expected_value_eur:item.estimated_value_eur,
      estimated_loss_avoided_eur:item.estimated_loss_eur,
      status:item.impact_status==='SCORED'?'READY':'CANDIDATE',
      evidence:{canonicalExecutionAuthority:'existing Brain/action/obligation layer',noSyntheticMoney:true}
    }));
}

function buildSnapshot(catalog,signals){
  const now=Date.now();
  const ageDays=(value)=>value?Math.max(0,(now-new Date(value).getTime())/86400000):Infinity;
  const values=signals.map(x=>Number(x.estimated_value_eur)).filter(Number.isFinite);
  const losses=signals.map(x=>Number(x.estimated_loss_eur)).filter(Number.isFinite);
  return {
    tenant_id:'canonical',
    refreshed_at:new Date().toISOString(),
    catalog_source_count:catalog.length,
    public_source_count:catalog.filter(x=>x.activation_mode==='PUBLIC_ALWAYS').length,
    connector_source_count:catalog.filter(x=>x.activation_mode==='CONNECTOR_REQUIRED').length,
    domain_count:new Set(catalog.flatMap(x=>x.domain_keys)).size,
    observed_signal_count:signals.length,
    signals_24h:signals.filter(x=>ageDays(x.observed_at)<=1).length,
    signals_7d:signals.filter(x=>ageDays(x.observed_at)<=7).length,
    high_attention_count:signals.filter(x=>Number(x.signal_score)>=70).length,
    scored_impact_count:signals.filter(x=>x.impact_status==='SCORED').length,
    action_candidate_count:actionCandidates(signals).length,
    known_opportunity_value_eur:values.length?values.reduce((a,b)=>a+b,0):null,
    known_risk_value_eur:losses.length?losses.reduce((a,b)=>a+b,0):null,
    status:signals.length?'CURRENT':'EMPTY'
  };
}

export default async request=>{
  const user=await getUser(request).catch(()=>null);
  if(!user?.id)return json({error:'UNAUTHENTICATED'},401);
  const tenantId=resolveIdentityTenant(user);
  if(!tenantId)return json({error:'TENANT_SCOPE_REQUIRED'},403);
  const key=serviceKey();
  if(!key)return json({error:'SUPABASE_SERVICE_KEY_MISSING'},503);

  try{
    const [sources,publications,signalsRaw,catalogRaw,radarRaw]=await Promise.all([
      table('bronnen?select=id,naam,uitgever,soort,controle_frequentie,laatst_gecontroleerd,laatste_controle_gelukt,actief,trefwoorden&actief=eq.true&order=uitgever.asc,naam.asc',key),
      table('bronpublicaties?select=id,bron_id,titel,samenvatting,publicatiedatum,url,opgehaald_op,goedgekeurd,uitgever_url&order=publicatiedatum.desc.nullslast&limit=350',key),
      table('bg_externe_signalen?select=url,onderwerp,titel,samenvatting,domein,gepubliceerd_op,brontrouw,bevestiging,versheid,relevantie,vertrouwen,toegestaan,opgehaald_op,deadline&toegestaan=eq.true&order=gepubliceerd_op.desc.nullslast&limit=250',key),
      table('powerhouse_source_catalog_v1?select=source_key,domain_key,source_type,provider,label,authority_tier,geography,acquisition_mode,official_url,refresh_cadence,availability_state,description,updated_at&enabled=eq.true&order=domain_key.asc,label.asc&limit=500',key),
      table('powerhouse_signal_impact_assessment_v1?select=tenant_id,signal_key,source_url,domain_key,signal_title,observed_at,nature,relevance,magnitude,likelihood,urgency,exposure,confidence,impact_score,value_eur,downside_eur,time_horizon,impacted_dimensions,action_status,recommended_action,assessment_basis,evidence,updated_at&tenant_id=eq.canonical&order=impact_score.desc,observed_at.desc&limit=250',key)
    ]);

    const sourceCatalog=normalizeCatalog(catalogRaw);
    const radar=normalizeSignals(radarRaw);
    const domains=[...new Set(sourceCatalog.flatMap(item=>item.domain_keys))]
      .map(domain_key=>({domain_key,...(DOMAIN_META[domain_key]||{label:domain_key,pillar:'Overig',description:'Aanvullend intelligence-domein.'})}));
    const actions=actionCandidates(radar);
    const snapshot=buildSnapshot(sourceCatalog,radar);

    return json({
      sources,
      publications,
      signals:signalsRaw,
      intelligence:{
        domains,
        sourceCatalog,
        signals:radar,
        actionCandidates:actions,
        snapshot,
        projectionScope:'generic external baseline; tenant-specific exposure only after company evidence',
        truthPolicy:'measured_or_evidence_backed_else_unknown'
      },
      scope:{
        authenticatedTenant:tenantId,
        signalProjectionTenant:'canonical',
        tenantExposureApplied:false,
        monetaryImpactSynthesized:false
      },
      stats:{
        generatedAt:new Date().toISOString(),
        sourceCount:sources.length,
        publicationCount:publications.length,
        signalCount:signalsRaw.length,
        sourceUniverseCount:sourceCatalog.length,
        connectedSourceCount:sourceCatalog.filter(item=>['CONNECTED','OBSERVED','LIVE'].includes(item.availability_state)).length,
        observedSourceCount:sourceCatalog.filter(item=>['OBSERVED','LIVE'].includes(item.availability_state)).length,
        sourceDomainCount:domains.length,
        radarCount:radar.length,
        highAttentionCount:snapshot.high_attention_count
      }
    });
  }catch(error){
    return json({error:'EXTERNAL_DATA_READ_FAILED',message:error?.message||String(error)},502);
  }
};
export const config={path:'/api/portal-ondernemersdata'};
