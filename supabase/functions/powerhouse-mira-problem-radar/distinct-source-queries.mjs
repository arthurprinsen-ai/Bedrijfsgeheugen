// Local to the SINGLE original Mira radar Edge deploy scope. Never edit a
// globally shared _shared helper just to expand one publisher's search supply.
import {MIRA_SOURCE_TOPIC_QUERIES,MIRA_SOURCE_ALTERNATE_QUERIES}
  from '../_shared/mira-source-query-rotation.mjs';

// Additional short Dutch query phrasings for exactly the existing twelve
// canonical PH-P subjects. Queries discover leads; they are NOT source evidence.
export const MIRA_SOURCE_DISTINCT_DISCOVERY_QUERIES=Object.freeze({
 'offertes-zonder-opvolging':'offerte opvolging bedrijven',
 'directie-bottleneck':'directeur besluitvorming vertraging',
 'kennisoverdracht':'kennisverlies personeel bedrijven',
 'excel-chaos':'Excel fouten administraties',
 'dubbele-invoer':'dubbele invoer software',
 'projectmarge':'meerwerk bouwproject marge',
 'groei-zonder-winst':'groei omzet winst ondernemers',
 'capaciteitsplanning':'planning personeelstekort ondernemers',
 'debiteuren':'betaalachterstand debiteuren ondernemers',
 'late-facturering':'late facturering ondernemers',
 'klantafhankelijkheid':'mkb afhankelijkheid omzetconcentratie',
 'klantverlies':'klantverlies bedrijven'
});
// Original production source radar readback #31075 (14 Nov): the old
// alternate "ondernemer afhankelijk grote klant" returned mostly Nvidia,
// listed-equity and celebrity succession headlines. Those are not a real
// customer-concentration problem in a Dutch MKB company. Correct this ONE
// existing original radar search slot; do not change global shared rotation,
// add provider calls, or treat the search term as evidence or an approval.
export const MIRA_SOURCE_ALTERNATE_LOCAL_PRECISION_QUERIES=Object.freeze({
  'klantafhankelijkheid':'mkb klantconcentratie omzet'
});
const familyLookup=new Map(MIRA_SOURCE_TOPIC_QUERIES.flatMap(f=>[
 [f.query,f.topic],[MIRA_SOURCE_ALTERNATE_QUERIES[f.topic],f.topic]
]));

/**
 * Extend source novelty within the SAME original six business / two personal
 * queries. No provider call, queue, scheduler, media generation or send occurs.
 * Original provider URL/freshness/score/PH-P/90d source and 3d topic gates
 * remain solely in the original radar and PostgreSQL materializer.
 */
export function rotateDistinctMiraQueries(runDate,canonicalQueries){
 const d=String(runDate??''),timestamp=Date.parse(d+'T00:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(timestamp)||
   new Date(timestamp).toISOString().slice(0,10)!==d)
   throw new Error('MIRA_RUN_DATE_INVALID');
 if(!Array.isArray(canonicalQueries)||canonicalQueries.length!==8||
   canonicalQueries.filter(x=>x?.channel==='instagram_company').length!==6||
   canonicalQueries.filter(x=>x?.channel==='linkedin_personal').length!==2)
   throw new Error('ORIGINAL_RADAR_EIGHT_CALL_SCOPE_REQUIRED');
 // Two out of six business dates use the third distinct wording, the
 // other dates retain exact existing protected source-search behavior.
 const day=Math.floor(timestamp/86400000),useDistinct=day%6>=4;
 const rows=canonicalQueries.map(x=>{
   if(x.channel!=='instagram_company')return x;
   const topic=familyLookup.get(x.query);
   if(!topic)throw new Error('MIRA_UNKNOWN_PH_P_SOURCE_FAMILY');
   // Only replace the proven low-precision ALTERNATE query inside the
   // existing Mira-owned six-business search slots. No new topic or slot.
   const originalAlternate=MIRA_SOURCE_ALTERNATE_QUERIES[topic];
   const originalQuery=x.query;
   const precision=MIRA_SOURCE_ALTERNATE_LOCAL_PRECISION_QUERIES[topic];
   const approvedQuery=useDistinct?MIRA_SOURCE_DISTINCT_DISCOVERY_QUERIES[topic]
     :precision && originalQuery===originalAlternate?precision:originalQuery;
   return Object.freeze({...x,query:approvedQuery});
 });
 if(new Set(rows.map(x=>x.query)).size!==8)
   throw new Error('ORIGINAL_RADAR_QUERY_DUPLICATE');
 return Object.freeze(rows);
}
