// Existing catalog is authoritative; this runtime mirror is checked against it by CI.
// Never treat an external sector signal or fictional scene as observed customer evidence.
export const MIRA_ENTREPRENEUR_CAPTION_CONTRACT='mira-entrepreneur-problem-to-portal-caption-v1';
export const MIRA_CANONICAL_LIBRARY_PATH='config/powerhouse-problem-library.json';
export const MIRA_CASES=Object.freeze([
  {
    "id": "PH-P001",
    "name": "Eigenaar is operationele bottleneck",
    "description": "Besluiten, kennis en dagelijkse uitvoering zijn te afhankelijk van de eigenaar/directeur.",
    "signal": "veel approvals bij directie",
    "action": "delegatiematrix opstellen",
    "capability": "Owner Dependency Reduction",
    "metric": "doorlooptijd approvals",
    "impact": "risk",
    "page": "bedrijfssituatie",
    "scene": "Mira wil haar laptop dichtklappen. Op haar telefoon staan nog drie verzoeken die alleen de directeur kan goedkeuren.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P002",
    "name": "Offertes zonder opvolging",
    "description": "Openstaande offertes krijgen niet tijdig een aantoonbare vervolgactie.",
    "signal": "offertes > X dagen zonder activiteit",
    "action": "stale opportunities analyseren",
    "capability": "Opportunity Recovery",
    "metric": "follow-up tijd",
    "impact": "revenue",
    "page": "klanten-commercie",
    "scene": "Vrijdagmiddag. Mira ziet een offerte zonder volgende taak. Niemand weet wie de klant vandaag terugbelt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P003",
    "name": "Groei zonder winst",
    "description": "Omzet of volume groeit sneller dan winst of marge.",
    "signal": "omzet stijgt en brutomarge daalt",
    "action": "marge-driver analyse",
    "capability": "Margin Intelligence",
    "metric": "brutomarge",
    "impact": "cost",
    "page": "cijfers-maatstaven",
    "scene": "Mira ziet dat er meer opdrachten binnenkomen. Toch voelt het alsof er aan het einde van de maand minder overblijft.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P004",
    "name": "Dalende projectmarge",
    "description": "Projecten leveren structureel minder marge dan verwacht.",
    "signal": "meeruren",
    "action": "afwijkende projecten analyseren",
    "capability": "Project Margin Guard",
    "metric": "projectmarge",
    "impact": "risk",
    "page": "operatie",
    "scene": "Mira kijkt naar een project dat volgens de planning klaar was. De extra uren staan in een ander bestand.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P005",
    "name": "Kennis bij sleutelpersonen",
    "description": "Kritieke bedrijfskennis is onvoldoende overdraagbaar.",
    "signal": "één eigenaar per proces",
    "action": "kritieke kennis inventariseren",
    "capability": "Knowledge Capture",
    "metric": "kritieke processen gedocumenteerd",
    "impact": "risk",
    "page": "mensen",
    "scene": "Mira krijgt een vraag over een uitzonderingsafspraak. Degene die het antwoord weet, heeft vandaag vrij.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P006",
    "name": "Excel-afhankelijkheid",
    "description": "Kernprocessen of stuurinformatie draaien op losse spreadsheets.",
    "signal": "veel handmatige exports",
    "action": "spreadsheets classificeren",
    "capability": "Spreadsheet Risk Reduction",
    "metric": "aantal kritieke spreadsheets",
    "impact": "risk",
    "page": "data-ai",
    "scene": "Mira krijgt drie spreadsheets met hetzelfde cijfer. Alleen: elk bestand geeft een ander antwoord.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P007",
    "name": "Dubbele invoer",
    "description": "Dezelfde gegevens worden handmatig in meerdere systemen ingevoerd.",
    "signal": "copy-paste tussen systemen",
    "action": "datastroom mappen",
    "capability": "Data Flow Automation",
    "metric": "uren handwerk",
    "impact": "risk",
    "page": "operatie",
    "scene": "Mira voert één klantwijziging opnieuw in. Eerst in het CRM, daarna in de planning, en nog een keer bij finance.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P008",
    "name": "Capaciteitstekort",
    "description": "Beschikbare capaciteit dreigt de vraag niet te kunnen volgen.",
    "signal": "bezetting > drempel",
    "action": "vraag/capaciteit voorspellen",
    "capability": "Capacity Forecasting",
    "metric": "bezettingsgraad",
    "impact": "capacity",
    "page": "mensen",
    "scene": "Mira ziet de werkvoorraad groeien. De planning zegt dat iedereen al vol zit.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P009",
    "name": "Overcapaciteit",
    "description": "Capaciteit is structureel hoger dan de actuele of verwachte vraag.",
    "signal": "lage bezetting",
    "action": "capaciteitsplan herijken",
    "capability": "Capacity Forecasting",
    "metric": "bezettingsgraad",
    "impact": "capacity",
    "page": "mensen",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: lage bezetting. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P010",
    "name": "Debiteuren lopen op",
    "description": "Openstaande posten worden ouder en drukken op cash.",
    "signal": "DSO stijgt",
    "action": "aging analyseren",
    "capability": "Receivables Accelerator",
    "metric": "DSO",
    "impact": "cash",
    "page": "overzicht",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: DSO stijgt. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P011",
    "name": "Late facturering",
    "description": "Werk wordt te laat of onvolledig gefactureerd.",
    "signal": "lange tijd tussen oplevering en factuur",
    "action": "factureertrigger analyseren",
    "capability": "Billing Acceleration",
    "metric": "dagen tot factuur",
    "impact": "cash",
    "page": "overzicht",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: lange tijd tussen oplevering en factuur. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P012",
    "name": "Klantconcentratie",
    "description": "Een te groot aandeel omzet of marge hangt af van weinig klanten.",
    "signal": "top-1/top-5 omzetconcentratie",
    "action": "concentratie meten",
    "capability": "Customer Concentration Monitor",
    "metric": "top-1/top-5 aandeel",
    "impact": "risk",
    "page": "due-diligence",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: top-1/top-5 omzetconcentratie. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P013",
    "name": "Klantverlies/churn",
    "description": "Bestaande klanten verminderen of stoppen hun afname.",
    "signal": "bestelfrequentie daalt",
    "action": "at-risk klanten detecteren",
    "capability": "Churn Radar",
    "metric": "retentie",
    "impact": "revenue",
    "page": "klanten-commercie",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: bestelfrequentie daalt. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P014",
    "name": "Lage leadconversie",
    "description": "Veel leads worden niet omgezet naar gekwalificeerde kansen of klanten.",
    "signal": "lage MQL→SQL",
    "action": "funnelanalyse",
    "capability": "Conversion Intelligence",
    "metric": "leadconversie",
    "impact": "revenue",
    "page": "klanten-commercie",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: lage MQL→SQL. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P015",
    "name": "Prijslekkage",
    "description": "Prijsafwijkingen, kortingen of verouderde tarieven drukken onnodig op marge.",
    "signal": "veel uitzonderingskorting",
    "action": "prijsafwijkingen detecteren",
    "capability": "Pricing Guard",
    "metric": "gemiddelde korting",
    "impact": "cost",
    "page": "overzicht",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: veel uitzonderingskorting. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P016",
    "name": "Slechte klantwinstgevendheid",
    "description": "Omzetrijke klanten blijken na uren, service en uitzonderingen onvoldoende winstgevend.",
    "signal": "hoge service-uren",
    "action": "cost-to-serve berekenen",
    "capability": "Customer Profitability",
    "metric": "contributiemarge klant",
    "impact": "cost",
    "page": "overzicht",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: hoge service-uren. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P017",
    "name": "Voorraad te hoog",
    "description": "Voorraad bindt onnodig cash of bevat slow movers.",
    "signal": "days inventory stijgt",
    "action": "ABC/XYZ analyse",
    "capability": "Inventory Intelligence",
    "metric": "voorraadwaarde",
    "impact": "risk",
    "page": "operatie",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: days inventory stijgt. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P018",
    "name": "Voorraadtekorten",
    "description": "Beschikbaarheid is onvoldoende om vraag betrouwbaar te leveren.",
    "signal": "stockouts",
    "action": "vraagpatroon analyseren",
    "capability": "Inventory Intelligence",
    "metric": "stockout rate",
    "impact": "risk",
    "page": "operatie",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: stockouts. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P019",
    "name": "Doorlooptijden lopen op",
    "description": "Proces- of levertijden nemen structureel toe.",
    "signal": "backlog groeit",
    "action": "bottleneckanalyse",
    "capability": "Flow Optimization",
    "metric": "doorlooptijd",
    "impact": "risk",
    "page": "operatie",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: backlog groeit. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P020",
    "name": "Veel herstelwerk/fouten",
    "description": "Een significant deel van capaciteit gaat naar correcties en rework.",
    "signal": "rework-uren",
    "action": "fouttypen clusteren",
    "capability": "Quality Guard",
    "metric": "first-time-right",
    "impact": "risk",
    "page": "overzicht",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: rework-uren. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P021",
    "name": "Versnipperde managementinformatie",
    "description": "Directie krijgt geen tijdig, consistent stuurbeeld.",
    "signal": "verschillende KPI-definities",
    "action": "KPI-definities harmoniseren",
    "capability": "Executive Intelligence",
    "metric": "rapportagetijd",
    "impact": "risk",
    "page": "overzicht",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: verschillende KPI-definities. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P022",
    "name": "Acties worden niet opgevolgd",
    "description": "Besluiten en acties uit overleg verdwijnen of missen eigenaarschap.",
    "signal": "veel open acties",
    "action": "actiecontract invoeren",
    "capability": "Execution Follow-through",
    "metric": "actieclosure rate",
    "impact": "risk",
    "page": "overzicht",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: veel open acties. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P023",
    "name": "Strategie komt niet in uitvoering",
    "description": "Strategische doelen zijn onvoldoende verbonden met concrete uitvoering.",
    "signal": "doelen zonder eigenaar",
    "action": "doelen aan capabilities/actions koppelen",
    "capability": "Strategy Execution",
    "metric": "strategic objective progress",
    "impact": "risk",
    "page": "strategie-naar-maandagochtend",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: doelen zonder eigenaar. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P024",
    "name": "ERP wordt onvoldoende benut",
    "description": "Een kernsysteem is aanwezig maar processen blijven eromheen handmatig.",
    "signal": "veel Excel naast ERP",
    "action": "proces-fit analyseren",
    "capability": "ERP Value Recovery",
    "metric": "adoptie",
    "impact": "risk",
    "page": "data-ai",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: veel Excel naast ERP. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P025",
    "name": "Systemen zijn slecht gekoppeld",
    "description": "Informatie stroomt niet betrouwbaar tussen kernsystemen.",
    "signal": "handmatige imports",
    "action": "integratiematrix maken",
    "capability": "Integration Fabric",
    "metric": "sync-fouten",
    "impact": "risk",
    "page": "data-ai",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: handmatige imports. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P026",
    "name": "Datakwaliteit onvoldoende",
    "description": "Besluiten of automatiseringen rusten op onvolledige of inconsistente data.",
    "signal": "missende velden",
    "action": "quality rules",
    "capability": "Data Quality Guard",
    "metric": "completeness",
    "impact": "risk",
    "page": "overzicht",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: missende velden. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P027",
    "name": "Onboarding duurt te lang",
    "description": "Nieuwe medewerkers bereiken te langzaam zelfstandige productiviteit.",
    "signal": "lange inwerktijd",
    "action": "kennisroute bouwen",
    "capability": "Onboarding Accelerator",
    "metric": "time-to-productivity",
    "impact": "capacity",
    "page": "mensen",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: lange inwerktijd. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P028",
    "name": "Compliance/regulatoir risico",
    "description": "Nieuwe of gewijzigde regels zijn onvoldoende vertaald naar processen en bewijs.",
    "signal": "open compliance-acties",
    "action": "impact bepalen",
    "capability": "Regulatory Impact Monitor",
    "metric": "open compliance gaps",
    "impact": "risk",
    "page": "due-diligence",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: open compliance-acties. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P029",
    "name": "Exit readiness onvoldoende",
    "description": "Bedrijf is operationeel of informatie-technisch onvoldoende verkoopklaar.",
    "signal": "eigenaar-afhankelijkheid",
    "action": "readiness assessment",
    "capability": "Exit Readiness",
    "metric": "readiness gaps",
    "impact": "risk",
    "page": "overzicht",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: eigenaar-afhankelijkheid. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P030",
    "name": "Overname-integratierisico",
    "description": "Na acquisitie zijn processen, systemen en verantwoordelijkheden onvoldoende geïntegreerd.",
    "signal": "dubbele systemen",
    "action": "integration map",
    "capability": "Post-Merger Integration",
    "metric": "synergie realisatie",
    "impact": "risk",
    "page": "overzicht",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: dubbele systemen. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P031",
    "name": "Ziekteverzuim structureel hoog",
    "description": "Ziekteverzuim ligt structureel boven de relevante eigen trend of branchebenchmark en beperkt beschikbare capaciteit.",
    "signal": "verzuimpercentage boven trend/benchmark",
    "action": "verzuimtrend segmenteren",
    "capability": "Absence Intelligence",
    "metric": "verzuimpercentage",
    "impact": "capacity",
    "page": "mensen",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: verzuimpercentage boven trend/benchmark. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P032",
    "name": "Langdurig verzuim en re-integratierisico",
    "description": "Langdurige uitval veroorzaakt disproportionele kosten, capaciteitsverlies en dossier- of re-integratierisico.",
    "signal": ">6 weken ziek",
    "action": "langdurige dossiers prioriteren",
    "capability": "Long-term Absence Case Guard",
    "metric": "langdurig verzuimvolume",
    "impact": "cost",
    "page": "mensen",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: >6 weken ziek. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P033",
    "name": "Werkdruk en overbelasting",
    "description": "Vraag, bezetting en werkorganisatie veroorzaken structureel hoge werkdruk met risico op fouten, uitval en verloop.",
    "signal": "structurele overuren",
    "action": "vraag-capaciteit vergelijken",
    "capability": "Workload Pressure Radar",
    "metric": "overuren per FTE",
    "impact": "capacity",
    "page": "mensen",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: structurele overuren. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P034",
    "name": "Personeelsverloop te hoog",
    "description": "Ongewenste uitstroom is hoger dan gewenst en veroorzaakt wervingskosten, capaciteitsverlies en kennisverlies.",
    "signal": "uitstroom stijgt",
    "action": "uitstroom segmenteren",
    "capability": "Retention Radar",
    "metric": "vrijwillig verloop",
    "impact": "cost",
    "page": "mensen",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: uitstroom stijgt. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P035",
    "name": "Werving en vacaturevervulling stagneert",
    "description": "Openstaande functies blijven te lang onvervuld of leveren onvoldoende passende kandidaten op.",
    "signal": "vacatures lang open",
    "action": "vacaturefunnel analyseren",
    "capability": "Recruitment Funnel Intelligence",
    "metric": "time-to-fill",
    "impact": "capacity",
    "page": "mensen",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: vacatures lang open. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P036",
    "name": "Skills-gap en onvoldoende ontwikkeling",
    "description": "Beschikbare vaardigheden sluiten onvoldoende aan op huidige of toekomstige processen, technologie en klantvraag.",
    "signal": "kritieke skills ontbreken",
    "action": "skills matrix bouwen",
    "capability": "Skills Graph",
    "metric": "skill coverage",
    "impact": "capacity",
    "page": "mensen",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: kritieke skills ontbreken. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P037",
    "name": "Personeelskosten drukken marge",
    "description": "Loon-, inhuur-, overwerk- en vervangingskosten groeien sneller dan productiviteit of omzet.",
    "signal": "loonkosten stijgen sneller dan omzet",
    "action": "personeelskosten per output berekenen",
    "capability": "Workforce Cost Intelligence",
    "metric": "personeelskosten/omzet",
    "impact": "cost",
    "page": "mensen",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: loonkosten stijgen sneller dan omzet. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P038",
    "name": "HR-compliance en personeelsdossiers niet op orde",
    "description": "Contract-, verzuim-, dossier- of arbeidsrechtelijke verplichtingen worden niet aantoonbaar tijdig uitgevoerd.",
    "signal": "HR-termijnen gemist",
    "action": "kritieke termijnen monitoren",
    "capability": "HR Compliance Guard",
    "metric": "open compliance gaps",
    "impact": "risk",
    "page": "mensen",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: HR-termijnen gemist. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P039",
    "name": "Leiderschap en teamdynamiek veroorzaken uitval of vertrek",
    "description": "Verzuim, verloop, klachten of lage prestaties concentreren zich aantoonbaar rond specifieke teams, rollen of leidinggevende patronen.",
    "signal": "teamverschil in verzuim/verloop",
    "action": "teamverschillen objectief analyseren",
    "capability": "Team Health Radar",
    "metric": "teamverzuim",
    "impact": "risk",
    "page": "mensen",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: teamverschil in verzuim/verloop. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  },
  {
    "id": "PH-P040",
    "name": "Sociale of fysieke arbeidsveiligheid onder druk",
    "description": "Incidenten, ongewenst gedrag of fysieke belasting creëren aantoonbaar risico voor medewerkers, continuïteit en werkgeverschap.",
    "signal": "incidenten stijgen",
    "action": "incidentpatronen analyseren",
    "capability": "Workplace Safety Radar",
    "metric": "incidentfrequentie",
    "impact": "risk",
    "page": "mensen",
    "scene": "Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: incidenten stijgen. Ze zoekt wie het oppakt.",
    "source": "config/powerhouse-problem-library.json"
  }
].map(p=>Object.freeze(p)));
export function selectMiraProblem(runDate){
 if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(String(runDate||'')))throw new Error('MIRA_RUN_DATE_REQUIRED');
 const d=new Date(runDate+'T00:00:00.000Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==runDate)throw new Error('MIRA_RUN_DATE_INVALID');
 const epoch=Math.floor(d.getTime()/86400000);
 // Fixed deterministic rotation, no AI inventing which canonical problem exists.
 return MIRA_CASES[((epoch%MIRA_CASES.length)+MIRA_CASES.length)%MIRA_CASES.length];
}
export function miraCaption(problem){
 if(!problem?.id||!/^PH-P\\d{3}$/.test(problem.id))throw new Error('MIRA_CANONICAL_PROBLEM_REQUIRED');
 const effects={revenue:'een gemiste verkoopkans',risk:'onnodig risico',cost:'extra kosten',capacity:'oplopende werkdruk',strategic:'besluiten zonder opvolging',people:'werkdruk en afhankelijkheid',operational:'vertraging',financial:'onverwachte financiële druk'};
 const effect=effects[problem.impact]||'vertraging en onzekerheid';
 return [
 problem.scene,
 'Wat hierachter zit: '+problem.description,
 'Het gevolg kan '+effect+' zijn. Dit is een herkenbare situatie, geen gemeten klantresultaat.',
 'Het Bedrijfsgeheugen-portaal kan dit aandachtspunt op de pagina '+problem.page+' in verband brengen met de beschikbare gegevens. Als die zijn gekoppeld, kan de voorgestelde actie «'+problem.action+'» met eigenaar en prioriteit worden beoordeeld. De relevante capaciteit is '+problem.capability+'.',
 'Wat je daarna volgt: '+problem.metric+'. Een signaal is pas bruikbaar als duidelijk is wat de volgende stap is.',
 'Herkenbaar in jouw bedrijf? Kijk eerst welke informatie nu nergens samenkomt. https://www.bedrijfsgeheugen.nl/frisse-blik',
 'Mira is een fictief AI-personage. Voorbeeld gebaseerd op ondernemersprobleem '+problem.id+'; geen klantervaring of bewezen omzet.'
 ].join('\\n\\n');
}
export function miraProductionEvidence(problem){return {contentPersona:'mira',contentClass:'mira_daily_life',caption_contract:MIRA_ENTREPRENEUR_CAPTION_CONTRACT,canonical_problem_id:problem.id,problem_name:problem.name,problem_description:problem.description,problem_signal:problem.signal,portal_page:problem.page,portal_capability:problem.capability,portal_action:problem.action,portal_metric:problem.metric,portal_impact_label:'POTENTIAL',source_catalog:MIRA_CANONICAL_LIBRARY_PATH,fictional_scene:true,source_evidence_status:'CANONICAL_PROBLEM_HYPOTHESIS',scene:problem.scene};}
export function validateMiraCaptionForDelivery(runDate,body,evidence={}){
 let problem;try{problem=selectMiraProblem(runDate)}catch(e){return {ok:false,reason:String(e.message||e)};}
 const expected=miraCaption(problem);const normalized=v=>String(v||'').replace(/\\s+/g,' ').trim();
 const actual=normalized(body);
 if(actual!==normalized(expected))return {ok:false,reason:'MIRA_CAPTION_FIVE_PARTS_OR_EXACT_SOURCE_MISSING',problem_id:problem.id};
 if(evidence.caption_contract!==MIRA_ENTREPRENEUR_CAPTION_CONTRACT||evidence.canonical_problem_id!==problem.id||evidence.source_catalog!==MIRA_CANONICAL_LIBRARY_PATH||evidence.portal_capability!==problem.capability||evidence.portal_page!==problem.page||evidence.portal_action!==problem.action||evidence.portal_metric!==problem.metric||evidence.portal_impact_label!=='POTENTIAL')return {ok:false,reason:'MIRA_PORTAL_LINEAGE_OR_IMPACT_NOT_VERIFIED',problem_id:problem.id};
 if(!/Mira is een fictief AI-personage/.test(body))return {ok:false,reason:'MIRA_FICTION_DISCLOSURE_REQUIRED'};
 return {ok:true,problem_id:problem.id,contract:MIRA_ENTREPRENEUR_CAPTION_CONTRACT};
}
