import { readFile } from 'node:fs/promises';
import { ORIGIN } from './registry.mjs';

function norm(value){return String(value??'').trim().toLocaleLowerCase('en-US');}
function expectedEnRoute(source){
  const url=new URL(source);
  const path=url.pathname||'/';
  return path==='/' ? `${ORIGIN}/en/` : `${ORIGIN}/en${path}`;
}

export async function loadLocaleRevenueMap(path='site/seo-locale-revenue-map.json'){
  return JSON.parse(await readFile(path,'utf8'));
}

export function validateLocaleRevenueMap(map,registry){
  const errors=[];
  if(!map||typeof map!=='object') return ['locale revenue map moet een object zijn'];
  if(!Array.isArray(map.pages)) return ['locale revenue map pages ontbreekt'];
  const bySource=new Map();
  const nlClaims=new Map();
  const enClaims=new Map();

  for(const [i,row] of map.pages.entries()){
    const label=`pages[${i}]`;
    if(!row?.source_route?.startsWith(`${ORIGIN}/`)) errors.push(`${label}.source_route ongeldig`);
    if(bySource.has(row.source_route)) errors.push(`${label}.source_route duplicate: ${row.source_route}`);
    bySource.set(row.source_route,row);

    if(row?.nl?.route!==row.source_route) errors.push(`${label}.nl.route moet gelijk zijn aan source_route`);
    if(row?.en?.route!==expectedEnRoute(row.source_route)) errors.push(`${label}.en.route moet exact locale-pair zijn: ${expectedEnRoute(row.source_route)}`);

    for(const [locale,data,claims] of [['nl',row.nl,nlClaims],['en',row.en,enClaims]]){
      if(!data?.primary_keyword) errors.push(`${label}.${locale}.primary_keyword ontbreekt`);
      const all=[data?.primary_keyword,...(data?.secondary_keywords||[])].filter(Boolean);
      for(const phrase of all){
        const k=norm(phrase);
        const owner=claims.get(k);
        if(owner&&owner!==row.source_route) errors.push(`${label}.${locale}: keyword collision "${phrase}" met ${owner}`);
        if(!owner) claims.set(k,row.source_route);
      }
    }

    if(!row?.en?.title||row.en.title.length<20) errors.push(`${label}.en.title te kort/ontbreekt`);
    if(!row?.en?.description||row.en.description.length<70) errors.push(`${label}.en.description te kort/ontbreekt`);
    if(row.role==='money'&&!row.conversion_destination) errors.push(`${label}: money page mist conversion_destination`);
  }

  for(const entry of registry?.pages||[]){
    const row=bySource.get(entry.route);
    if(!row){errors.push(`locale revenue map mist registry owner ${entry.route}`);continue;}
    if(row.role!==entry.role) errors.push(`${entry.route}: role mismatch locale map=${row.role} registry=${entry.role}`);
    if(row.funnel_stage!==entry.funnel_stage) errors.push(`${entry.route}: funnel mismatch`);
    if(row.nl?.primary_keyword!==entry.primary_keyword) errors.push(`${entry.route}: NL primary keyword wijkt af van canonical registry`);
    if((entry.primary_cta?.url||null)!==(row.conversion_destination||null)) errors.push(`${entry.route}: conversion destination wijkt af van registry CTA`);
  }

  const evidence=map.measured_keyword_evidence||[];
  if(!evidence.some(x=>x.locale==='nl'&&x.market==='Netherlands')) errors.push('gemeten Nederlandse keyword evidence ontbreekt');
  if(!evidence.some(x=>x.locale==='en'&&x.market==='United Kingdom')) errors.push('gemeten Engelse UK keyword evidence ontbreekt');

  return [...new Set(errors)];
}
