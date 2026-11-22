// Deterministic, explainable context suggestions for existing Portal V2 file intake.
// Suggestions are never authority: the authenticated customer must confirm
// source, business purpose, category, destination and column roles before save.
export const IMPORT_DATA_KINDS=Object.freeze([
 {id:"sales",label:"Verkoop en omzet",area:"metrics",grain:"transaction",purpose:"Omzet, orders en verkooptrends onderzoeken"},
 {id:"invoices",label:"Facturen en debiteuren",area:"finance",grain:"invoice",purpose:"Facturatie, betaalgedrag en openstaande posten analyseren"},
 {id:"customers",label:"Klanten en relaties",area:"customers",grain:"customer",purpose:"Klantrelaties en commerciële kansen onderzoeken"},
 {id:"service",label:"Service en incidenten",area:"service",grain:"case",purpose:"Servicekwaliteit, incidenten en doorlooptijden onderzoeken"},
 {id:"inventory",label:"Voorraad en producten",area:"inventory",grain:"item",purpose:"Voorraad, producten en leveringen onderzoeken"},
 {id:"finance",label:"Kosten en financiële cijfers",area:"finance",grain:"measurement",purpose:"Kosten, budget en financiële ontwikkeling onderzoeken"},
 {id:"people",label:"Personeel en organisatie",area:"people",grain:"person",purpose:"Personeelsontwikkeling en capaciteit onderzoeken"},
 {id:"marketing",label:"Marketing en website",area:"marketing",grain:"measurement",purpose:"Marketing, bereik en conversie onderzoeken"},
 {id:"energy",label:"Energie en verbruik",area:"energy",grain:"measurement",purpose:"Verbruik, teruglevering en energiekosten onderzoeken"},
 {id:"projects",label:"Projecten en planning",area:"projects",grain:"project",purpose:"Projectvoortgang, planning en capaciteit onderzoeken"},
 {id:"other",label:"Andere bedrijfsgegevens",area:"research",grain:"record",purpose:"Een dataset verkennen en verbanden onderzoeken"}
]);
export const IMPORT_AREAS=Object.freeze([
 {id:"metrics",label:"KPI's en bedrijfsresultaten"},
 {id:"finance",label:"Financiën"},
 {id:"customers",label:"Klanten en markt"},
 {id:"service",label:"Service en operations"},
 {id:"inventory",label:"Voorraad en producten"},
 {id:"people",label:"Personeel en organisatie"},
 {id:"marketing",label:"Marketing en conversies"},
 {id:"energy",label:"Energie en duurzaamheid"},
 {id:"projects",label:"Projecten en planning"},
 {id:"research",label:"Onderzoek en verkenning"}
]);
export const IMPORT_GRAINS=Object.freeze([
 {id:"transaction",label:"Eén regel per transactie of order"},
 {id:"invoice",label:"Eén regel per factuur"},
 {id:"customer",label:"Eén regel per klant of relatie"},
 {id:"case",label:"Eén regel per incident of ticket"},
 {id:"item",label:"Eén regel per product of voorraadpositie"},
 {id:"person",label:"Eén regel per medewerker"},
 {id:"project",label:"Eén regel per project"},
 {id:"measurement",label:"Eén regel per meetpunt of periode"},
 {id:"record",label:"Eén regel per registratie"}
]);
export const IMPORT_ROLES=Object.freeze([
 {id:"identifier",label:"Uniek kenmerk (ID)"},
 {id:"date",label:"Datum / tijd"},
 {id:"amount",label:"Geldbedrag"},
 {id:"number",label:"Aantal / getal"},
 {id:"percentage",label:"Percentage"},
 {id:"status",label:"Status"},
 {id:"category",label:"Categorie"},
 {id:"personal",label:"Persoonsgegeven"},
 {id:"text",label:"Beschrijving / tekst"},
 {id:"unknown",label:"Nog te bepalen"}
]);
const categorySignals=Object.freeze({
 sales:/\b(omzet\w*|revenue\w*|verkoop\w*|sales|orders?|order\w*|bestellingen|turnover)\b/i,
 invoices:/\b(factuur\w*|invoice\w*|debiteur\w*|vervaldatum|betaaltermijn|outstanding)\b/i,
 customers:/\b(klant\w*|customer\w*|crm|contactpersoon|relatiebeheer|leads?|accountnaam)\b/i,
 service:/\b(incident\w*|ticket\w*|servicenow|cases?|caseid|storingen?|afhandeltijd|responstijd|sla|mttc|mtt[cr])\b/i,
 inventory:/\b(voorraad\w*|stock\w*|inventory|sku|artikel\w*|magazijn|warehouse|leveringen?)\b/i,
 finance:/\b(kosten|cost|costs|budget|grootboek|winst|profit|verlies|ebitda|balans|cashflow)\b/i,
 people:/\b(medewerker\w*|employee\w*|personeel|fte|verzuim|dienstverband|salaris|payroll)\b/i,
 marketing:/\b(campagne|campaign|utm|impressions|clicks|advertentie|advertenties|conversies?|sessions|pageviews)\b/i,
 energy:/\b(kwh|energie|energy|gasverbruik|stroomverbruik|teruglevering|zonnepanelen|vermogen)\b/i,
 projects:/\b(project|projecten|planning|mijlpaal|milestone|resourceplanning|begrotingsuren)\b/i
});
const hardRestricted=/(^|[^a-z])(bsn|burgerservicenummer|paspoortnummer|passportnumber|wachtwoord|password|api.?key|secret.?key|access.?token|medische.?diagnose|diagnose|medisch|gezondheid|health.?record)([^a-z]|$)/i;
const personalPattern=/\b(naam|voornaam|achternaam|name|firstname|lastname|e.?mail|email|telefoon|phone|mobiel|adres|address|postcode|geboortedatum|dateofbirth|iban|bankrekening|salaris|salary|klantnummer|klant id|customerid|customer id|medewerkernummer|medewerker id|employeeid|employee id)\b/i;
const DATE=/\b(datum|date|tijd|time|created|updated|verval|deadline|maand|month|jaar|year|periode|period)\b/i;
const IDENTIFIER=/\b(id|nummer|number|nr|code|uuid|reference|referentie|sku|ticketid|caseid)\b/i;
const AMOUNT=/\b(bedrag|amount|omzet|revenue|kosten|cost|prijs|price|waarde|value|saldo|balance|budget|eur|euro|usd)\b/i;
const NUMBER=/\b(aantal|quantity|qty|count|volume|uren|hours|kwh|verbruik)\b/i;
const PERCENTAGE=/\b(percentage|procent|percent|pct|ratio|rate|conversie)\b/i;
const STATUS=/\b(status|state|fase|phase|stage)\b/i;
const CATEGORY=/\b(categorie|category|segment|groep|group|product|afdeling|department|regio|region|kanaal|channel)\b/i;
function normalize(value){
  return String(value??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .replace(/([a-z])([A-Z])/g,"$1 $2").toLowerCase()
    .replace(/[_./\\-]+/g," ").replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim();
}
const isDigits=value=>/^[-+]?(?:\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,]\d+)?$/.test(value);
const ROLE_IDS=new Set(IMPORT_ROLES.map(x=>x.id));
const KIND_IDS=new Set(IMPORT_DATA_KINDS.map(x=>x.id));
const AREA_IDS=new Set(IMPORT_AREAS.map(x=>x.id));
const GRAIN_IDS=new Set(IMPORT_GRAINS.map(x=>x.id));

export function inferColumnRole(header,values=[]){
  const name=normalize(header);
  if(hardRestricted.test(name)||personalPattern.test(name))return "personal";
  if(DATE.test(name))return "date";
  if(PERCENTAGE.test(name))return "percentage";
  if(AMOUNT.test(name))return "amount";
  if(NUMBER.test(name))return "number";
  if(STATUS.test(name))return "status";
  if(IDENTIFIER.test(name))return "identifier";
  if(CATEGORY.test(name))return "category";
  const nonempty=values.map(x=>String(x??"").trim()).filter(Boolean).slice(0,20);
  if(nonempty.length>=3&&nonempty.every(isDigits))return "number";
  return name?"text":"unknown";
}
function inferDates(table,mapping){
  const dateCol=mapping.findIndex(x=>x.role==="date");
  if(dateCol<0)return null;
  const dates=table.rows.map(row=>String(row[dateCol]||"").trim()).filter(Boolean);
  if(!dates.length)return null;
  const iso=dates.map(value=>{
    const match=value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$/);
    if(!match)return null;
    const [y,m,d]=match.slice(1).map(Number);
    const time=Date.UTC(y,m-1,d),date=new Date(time);
    return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?match.slice(1).join("-"):null;
  }).filter(Boolean);
  if(iso.length!==dates.length)return null;
  iso.sort();
  return {from:iso[0],to:iso[iso.length-1],column:table.columns[dateCol],source:"filename-and-column-independent-iso-values"};
}
export function analyzeImportTable(table,{fileName=""}={}){
  if(!Array.isArray(table?.columns)||!Array.isArray(table?.rows)||!table.columns.length)
    throw new TypeError("IMPORT_TABLE_REQUIRED");
  const headers=table.columns.map(normalize),file=normalize(fileName);
  const scores=Object.entries(categorySignals).map(([kind,pattern])=>{
    const hits=headers.filter(name=>pattern.test(name));
    const filenameMatch=pattern.test(file);
    return {kind,score:hits.length*3+(filenameMatch?1:0),hits:hits.length,filenameMatch,matchedColumns:table.columns.filter((_,i)=>pattern.test(headers[i]))};
  }).sort((a,b)=>b.score-a.score);
  const top=scores[0],next=scores[1];
  const tie=top.score>0&&top.score===next.score;
  const suggestedKind=!top.score||tie?"other":top.kind;
  // Strong confidence requires two independent column cues and a clear lead.
  const confidence=suggestedKind==="other"?"unknown":top.hits>=2&&top.score>=next.score+3?"high":"low";
  const definition=IMPORT_DATA_KINDS.find(item=>item.id===suggestedKind);
  const columnMappings=table.columns.map((column,index)=>({
    column,role:inferColumnRole(column,table.rows.map(row=>row[index])),
    suggestedRole:inferColumnRole(column,table.rows.map(row=>row[index]))
  }));
  const restricted=table.columns.filter(name=>hardRestricted.test(normalize(name)));
  const personal=table.columns.filter((name,i)=>columnMappings[i].role==="personal");
  const missingCells=table.rows.reduce((sum,row)=>sum+row.filter(v=>String(v??"").trim()==="").length,0);
  const duplicatedRows=table.rows.length-new Set(table.rows.map(row=>JSON.stringify(row))).size;
  const period=inferDates(table,columnMappings);
  return Object.freeze({
    suggestedKind,confidence,
    suggestedArea:definition.area,suggestedGrain:definition.grain,suggestedPurpose:definition.purpose,
    matchedColumns:suggestedKind==="other"?[]:top.matchedColumns,
    columnMappings,restrictedColumns:restricted,personalColumns:personal,
    period,quality:{rows:table.rows.length,columns:table.columns.length,missingCells,duplicatedRows},
    readOnly:true,requiresReview:true
  });
}
function requireSelected(value,allowed,label){
  if(!allowed.has(value))throw new Error("Selecteer een geldige "+label+".");
  return value;
}
export function confirmImportContext(analysis,form={}){
  if(!analysis||typeof analysis!=="object")throw new Error("Er is geen geldige bestandsanalyse.");
  if(analysis.restrictedColumns?.length)
    throw new Error("Import geblokkeerd: "+analysis.restrictedColumns.join(", ")+". Gebruik de beveiligde gegevenskoppeling na privacycontrole.");
  if(form.confirmed!==true)throw new Error("Controleer en bevestig eerst het datatype, doel, bestemming en de kolommen.");
  if(analysis.personalColumns?.length&&form.personalAuthorized!==true)
    throw new Error("De gegevens bevatten mogelijke persoonsgegevens. Bevestig eerst de rechtmatige verwerking.");
  const kind=requireSelected(form.kind,KIND_IDS,"gegevenssoort");
  const area=requireSelected(form.area,AREA_IDS,"bestemming");
  const grain=requireSelected(form.grain,GRAIN_IDS,"betekenis per rij");
  const purpose=String(form.purpose??"").trim();
  if(purpose.length<8||purpose.length>180)throw new Error("Omschrijf het zakelijke doel (8–180 tekens).");
  const system=String(form.sourceSystem??"").trim();
  if(system.length>100)throw new Error("De bronnaam is te lang.");
  if(!Array.isArray(form.mappings)||form.mappings.length!==analysis.columnMappings.length)
    throw new Error("Controleer de betekenis van alle kolommen.");
  const mappings=form.mappings.map((item,index)=>{
    const expected=analysis.columnMappings[index].column;
    if(item?.column!==expected)throw new Error("Kolomvolgorde is gewijzigd. Selecteer het bestand opnieuw.");
    const role=requireSelected(item.role,ROLE_IDS,"kolomrol");
    if(analysis.columnMappings[index].suggestedRole==="personal"&&role!=="personal")
      throw new Error("Persoonsgegevens kunnen niet als gewone gegevens worden aangemerkt: "+expected);
    return {column:expected,role};
  });
  if(analysis.personalColumns?.length&&mappings.some(m=>m.role==="personal")&&form.personalAuthorized!==true)
    throw new Error("Bevestig eerst de verwerking van persoonsgegevens.");
  return Object.freeze({
    version:"portal-file-semantic-context-v1",
    kind,area,grain,purpose,sourceSystem:system||"Handmatige bestandsimport",
    columnMappings:mappings,
    period:analysis.period&&mappings.some(m=>m.column===analysis.period.column&&m.role==="date")?analysis.period:null,
    quality:analysis.quality,
    sensitivity:analysis.personalColumns?.length||mappings.some(m=>m.role==="personal")?"personal":"business",
    detection:{suggestedKind:analysis.suggestedKind,confidence:analysis.confidence,matchedColumns:analysis.matchedColumns},
    authorization:{humanReviewed:true,personalProcessingConfirmed:form.personalAuthorized===true,confirmedAt:new Date().toISOString()},
    usePolicy:{readOnlyAnalysis:true,automaticKpiWrite:false,automaticExternalAction:false,automaticRelationshipMerge:false},
    destinationStatus:"intended-area-not-automatically-mapped"
  });
}
