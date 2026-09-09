/**
 * De bouwstenenkast van het bedrijfsmodel.
 *
 * Eén op één overgenomen uit het vorige klantportaal (`const CAP`), waar dit de
 * bron was onder zowel de impactweergave bij een wijziging als de zoekfunctie in
 * Strategy DNA. Elke capability hangt aan één bedrijfsonderdeel en activeert
 * afdelingen, processen, gegevens, systemen, AI-toepassingen, governance,
 * maatstaven en projecten. De volwassenheid komt uit de scan, niet hieruit.
 */

export const NIVEAUS=Object.freeze(["","in hoofden","in lijstjes","in systemen","verbonden","zelfsturend"]);

export const CAPABILITIES=Object.freeze({
 "klantbeeld": {
  "n": "Klantbeeld op één plek",
  "dim": "commercie",
  "afd": [
   "Sales",
   "Service",
   "Marketing"
  ],
  "proc": [
   "Lead tot order",
   "Klantvraag afhandelen"
  ],
  "data": [
   "Klantgegevens",
   "Orderhistorie",
   "Contactmomenten"
  ],
  "sys": [
   "CRM of ERP-klantmodule"
  ],
  "ai": [
   "Samenvatting van klantcontact",
   "Signaal bij afhaakgedrag"
  ],
  "gov": [
   "Wie is eigenaar van klantgegevens"
  ],
  "kpi": [
   "Omzet per klant",
   "Reactietijd",
   "Herhaalopdrachten"
  ],
  "proj": [
   "Klantgegevens uit één bron"
  ]
 },
 "opvolging": {
  "n": "Opvolging die vanzelf gaat",
  "dim": "commercie",
  "afd": [
   "Sales",
   "Binnendienst"
  ],
  "proc": [
   "Offerte opvolgen",
   "Contact vastleggen"
  ],
  "data": [
   "Offertes",
   "Contactmomenten"
  ],
  "sys": [
   "CRM",
   "E-mailkoppeling"
  ],
  "ai": [
   "Concept-opvolgmail",
   "Voorspelling welke offerte scoort"
  ],
  "gov": [
   "Wie bewaakt de trechter"
  ],
  "kpi": [
   "Conversie per stap",
   "Aantal open offertes"
  ],
  "proj": [
   "Automatische opvolging na verzending"
  ]
 },
 "doorstroom": {
  "n": "Werk stroomt zonder overtypen",
  "dim": "tech",
  "afd": [
   "Operatie",
   "Finance",
   "Binnendienst"
  ],
  "proc": [
   "Order naar planning",
   "Uren naar factuur"
  ],
  "data": [
   "Orders",
   "Uren",
   "Artikelen"
  ],
  "sys": [
   "ERP",
   "Urenregistratie",
   "Koppeling"
  ],
  "ai": [
   "Documenten uitlezen",
   "Afwijkingen signaleren"
  ],
  "gov": [
   "Eén bron per gegeven"
  ],
  "kpi": [
   "Keer per week overgetypt",
   "Doorlooptijd offerte-factuur"
  ],
  "proj": [
   "Koppeling tussen de twee zwaarste systemen"
  ]
 },
 "sturing": {
  "n": "Sturen op cijfers",
  "dim": "analytics",
  "afd": [
   "Directie",
   "Finance"
  ],
  "proc": [
   "Maandafsluiting",
   "Maandelijks overleg"
  ],
  "data": [
   "Omzet",
   "Marge",
   "Uren",
   "Verzuim"
  ],
  "sys": [
   "Rapportage bovenop de bron"
  ],
  "ai": [
   "Vooruitkijken op eigen historie",
   "Toelichting bij afwijkingen"
  ],
  "gov": [
   "Definities en eigenaren",
   "Rapportagekalender"
  ],
  "kpi": [
   "Dagen tot maandcijfers",
   "Aantal versies van hetzelfde cijfer"
  ],
  "proj": [
   "Dashboard met vijf getallen"
  ]
 },
 "kwaliteit": {
  "n": "Gegevens die kloppen",
  "dim": "quality",
  "afd": [
   "Finance",
   "Operatie",
   "IT"
  ],
  "proc": [
   "Invoer en controle"
  ],
  "data": [
   "Definities van klant, order, uur"
  ],
  "sys": [
   "Validatie bij invoer"
  ],
  "ai": [
   "Dubbele records herkennen"
  ],
  "gov": [
   "Eén eigenaar per bron"
  ],
  "kpi": [
   "Foutpercentage",
   "Herstelwerk"
  ],
  "proj": [
   "Definitielijst op één A4"
  ]
 },
 "kennis": {
  "n": "Kennis van het bedrijf, niet van personen",
  "dim": "mensen",
  "afd": [
   "Alle afdelingen",
   "HR"
  ],
  "proc": [
   "Werk vastleggen",
   "Inwerken"
  ],
  "data": [
   "Werkinstructies",
   "Kennismatrix",
   "Uitzonderingen"
  ],
  "sys": [
   "Gedeelde documentomgeving"
  ],
  "ai": [
   "Zoeken in eigen documenten",
   "Notities samenvatten"
  ],
  "gov": [
   "Eigenaar per kernproces"
  ],
  "kpi": [
   "Taken met één naam",
   "Inwerktijd"
  ],
  "proj": [
   "Kennismatrix en drie procesbeschrijvingen"
  ]
 },
 "wendbaar": {
  "n": "Verandering die beklijft",
  "dim": "culture",
  "afd": [
   "Directie",
   "Leidinggevenden"
  ],
  "proc": [
   "Verbetercyclus"
  ],
  "data": [
   "Medewerkerssignalen"
  ],
  "sys": [
   "Takenlijst met eigenaar"
  ],
  "ai": [
   "Terugkerende signalen groeperen"
  ],
  "gov": [
   "Eén verbetering per kwartaal"
  ],
  "kpi": [
   "Afgeronde verbeteringen",
   "eNPS"
  ],
  "proj": [
   "Vast verbetermoment"
  ]
 },
 "service": {
  "n": "Klantvragen op één plek",
  "dim": "service",
  "afd": [
   "Klantenservice",
   "Binnendienst"
  ],
  "proc": [
   "Vraag aannemen",
   "Klacht afhandelen"
  ],
  "data": [
   "Tickets",
   "Veelgestelde vragen"
  ],
  "sys": [
   "Servicepostbus of ticketsysteem"
  ],
  "ai": [
   "Antwoordconcept",
   "Vragen sorteren"
  ],
  "gov": [
   "Eigenaar per vraag"
  ],
  "kpi": [
   "Reactietijd",
   "Oplostijd",
   "NPS"
  ],
  "proj": [
   "Eén servicepostbus met status"
  ]
 },
 "geld": {
  "n": "Grip op geld",
  "dim": "finance",
  "afd": [
   "Finance",
   "Directie"
  ],
  "proc": [
   "Factureren",
   "Debiteurenbeheer",
   "Afsluiten"
  ],
  "data": [
   "Facturen",
   "Bank",
   "Openstaande posten"
  ],
  "sys": [
   "Boekhouding",
   "Automatische herinnering"
  ],
  "ai": [
   "Facturen uitlezen",
   "Betaalgedrag voorspellen"
  ],
  "gov": [
   "Wie grijpt in bij afwijking"
  ],
  "kpi": [
   "Debiteurendagen",
   "Dagen tot cijfers"
  ],
  "proj": [
   "Afsluitkalender en automatische herinneringen"
  ]
 },
 "veilig": {
  "n": "Veilig en aantoonbaar",
  "dim": "security",
  "afd": [
   "Directie",
   "IT"
  ],
  "proc": [
   "Toegang beheren",
   "Incident afhandelen"
  ],
  "data": [
   "Toegangsrechten",
   "Back-ups"
  ],
  "sys": [
   "MFA",
   "Back-upvoorziening"
  ],
  "ai": [
   "Afwijkend inloggedrag signaleren"
  ],
  "gov": [
   "Incidentplan",
   "Uitdienstlijst"
  ],
  "kpi": [
   "Geteste back-ups",
   "Openstaande accounts"
  ],
  "proj": [
   "MFA en een geteste back-up"
  ]
 },
 "duurzaam": {
  "n": "Duurzaamheidscijfers uit de administratie",
  "dim": "duurzaam",
  "afd": [
   "Finance",
   "Facilitair",
   "Inkoop"
  ],
  "proc": [
   "Verbruik registreren",
   "Rapporteren"
  ],
  "data": [
   "Energie",
   "Afval",
   "Vervoer",
   "Inkoop"
  ],
  "sys": [
   "Boekhouding",
   "Wagenparkbeheer"
  ],
  "ai": [
   "Facturen omzetten naar verbruik"
  ],
  "gov": [
   "Eigenaar duurzaamheid"
  ],
  "kpi": [
   "CO₂ per omzet",
   "Dekking van de onderwerpen"
  ],
  "proj": [
   "Verbruik uit de facturen halen"
  ]
 },
 "overdraagbaar": {
  "n": "Overdraagbaar bedrijf",
  "dim": "governance",
  "afd": [
   "Directie",
   "Finance",
   "HR"
  ],
  "proc": [
   "Besluiten vastleggen",
   "Contracten beheren"
  ],
  "data": [
   "Contracten",
   "Bevoegdheden",
   "Klantafspraken"
  ],
  "sys": [
   "Documentbeheer"
  ],
  "ai": [
   "Contracten doorzoeken op einddatum"
  ],
  "gov": [
   "Wie mag wat tekenen"
  ],
  "kpi": [
   "Dertig-dagentoets",
   "Klantconcentratie"
  ],
  "proj": [
   "Contract- en bevoegdhedenregister"
  ]
 }
});

const VELDEN=Object.freeze({
  afd:'afdelingen', proc:'processen', data:'gegevens', sys:'systemen',
  ai:'AI-toepassingen', gov:'governance', kpi:'maatstaven', proj:'acties'
});

const norm=value=>String(value??'').toLocaleLowerCase('nl').trim();
const uniq=list=>[...new Set(list)];

/**
 * Wat er aan een bedrijfsonderdeel hangt. Zelfde opzet als `impact(k)` in het
 * vorige portaal: alles verzamelen uit de capabilities van dat onderdeel.
 */
export function capabilityImpact(dimensionId){
  const ids=Object.keys(CAPABILITIES).filter(key=>CAPABILITIES[key].dim===dimensionId);
  const collect=field=>uniq(ids.flatMap(key=>CAPABILITIES[key][field]||[]));
  return Object.freeze({
    capabilities:ids.map(key=>CAPABILITIES[key].n||key),
    afd:collect('afd'), proc:collect('proc'), data:collect('data'),
    sys:collect('sys'), ai:collect('ai'), gov:collect('gov'),
    kpi:collect('kpi'), proj:collect('proj')
  });
}

/** Gecombineerde impact van meerdere wijzigingen, zonder dubbeltelling. */
export function combinedImpact(dimensionIds=[]){
  const parts=uniq(dimensionIds).map(capabilityImpact);
  const merge=field=>uniq(parts.flatMap(part=>part[field]));
  return Object.freeze({
    capabilities:merge('capabilities'), afd:merge('afd'), proc:merge('proc'),
    data:merge('data'), sys:merge('sys'), ai:merge('ai'), gov:merge('gov'),
    kpi:merge('kpi'), proj:merge('proj')
  });
}

/**
 * Zoeken in de kast, op capabilitynaam én op alles wat een capability
 * activeert — systeem, proces, maatstaf, gegeven, afdeling.
 */
export function searchCatalog(query){
  const needle=norm(query);
  if(!needle)return Object.keys(CAPABILITIES).map(key=>({id:key,...CAPABILITIES[key],treffers:[]}));
  return Object.keys(CAPABILITIES).map(key=>{
    const item=CAPABILITIES[key];
    const treffers=[];
    if(norm(item.n).includes(needle))treffers.push({veld:'naam',waarde:item.n});
    for(const [veld,label] of Object.entries(VELDEN))
      for(const waarde of item[veld]||[])
        if(norm(waarde).includes(needle))treffers.push({veld:label,waarde});
    return treffers.length?{id:key,...item,treffers}:null;
  }).filter(Boolean);
}

/**
 * "Vertel het in je eigen woorden": losse taal naar de onderdelen van het model.
 * Woorden van drie letters of korter worden genegeerd, en een capability telt
 * mee zodra één woord ergens in zijn bouwstenen voorkomt. Geen AI nodig — dit
 * is een woordmatch op de kast, en dat is ook wat het portaal belooft.
 */
export function translateToModel(text){
  const woorden=uniq(norm(text).split(/[^a-z0-9\u00e0-\u017f]+/).filter(word=>word.length>3));
  if(!woorden.length)return Object.freeze({woorden:[],capabilities:[],dimensies:[]});
  const scored=Object.keys(CAPABILITIES).map(key=>{
    const item=CAPABILITIES[key];
    const haystack=norm([item.n,...Object.keys(VELDEN).flatMap(veld=>item[veld]||[])].join(' '));
    const raak=woorden.filter(word=>haystack.includes(word));
    return raak.length?{id:key,naam:item.n,dim:item.dim,score:raak.length,woorden:raak}:null;
  }).filter(Boolean).sort((a,b)=>b.score-a.score);
  return Object.freeze({woorden,capabilities:scored,dimensies:uniq(scored.map(item=>item.dim))});
}

export function capabilitiesForDimension(dimensionId){
  return Object.keys(CAPABILITIES).filter(key=>CAPABILITIES[key].dim===dimensionId).map(key=>({id:key,...CAPABILITIES[key]}));
}

export const CATALOG_FIELD_LABELS=VELDEN;
