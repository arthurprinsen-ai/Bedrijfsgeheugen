import { readFile, writeFile } from 'node:fs/promises';

// The last customer-facing homepage copy projection runs after the existing V18,
// product-led, localization, and coherence passes. It never creates a second hero.
const COPY = Object.freeze({
  nl: {
    headline:'Je bedrijf verandert elke dag. <span class="mark">Je besturing moet mee.</span>',
    lead:'Bedrijfsgeheugen verbindt wat er <strong>binnen én buiten je onderneming</strong> verandert met je strategie, doelen, mensen, processen en financiën. Je ziet wat geraakt wordt, welke beslissing nodig is en wie de actie oppakt. Het resultaat wordt gemeten en helpt bij de volgende keuze. <strong>Geen extra AI-tool: een manier om je onderneming iedere dag beter te sturen.</strong> Bovenop de systemen die je al gebruikt.',
    eyebrow:'POWERHOUSE · DAGELIJKSE ONDERNEMINGSSTURING',
    sectionHeading:'Niet alleen inzicht. <span class="mark">Van verandering naar actie en resultaat.</span>',
    sectionLead:'Een chatbot geeft antwoord. Een dashboard toont cijfers. Een automatisering voert een losse stap uit. Bedrijfsgeheugen verbindt juist interne en externe signalen met je strategie en bedrijfssituatie, helpt gevolgen en prioriteiten bepalen, zet acties uit met een eigenaar en gebruikt de gemeten uitkomst voor de volgende beslissing. POWERHOUSE is de motor; betere ondernemingssturing is het doel.'
  },
  en: {
    headline:'Your business changes every day. <span class="mark">Your decisions should keep up.</span>',
    lead:'Bedrijfsgeheugen connects what changes <strong>inside and outside your business</strong> to your strategy, goals, people, processes and finances. See what is affected, which decision matters and who owns the next action. Measure outcomes and use them to improve the next decision. <strong>Not another AI tool: a practical way to run your business better every day.</strong> On top of the software you already use.',
    eyebrow:'POWERHOUSE · EVERYDAY BUSINESS STEERING',
    sectionHeading:'Beyond insights. <span class="mark">From change to action and results.</span>',
    sectionLead:'A chatbot answers questions. A dashboard displays figures. An automation executes one predefined step. Bedrijfsgeheugen instead connects internal and external signals to your strategy and business context, helps assess impact and priorities, assigns actions and feeds measured results into the next decision. POWERHOUSE is the engine; better daily steering is the outcome.'
  }
});

function replaceFirstHero(input,copy) {
  const mainAt=input.search(/<main(?:\s|>)/i);
  if(mainAt<0)throw new Error('DAILY_STEERING_NO_MAIN');
  const pre=input.slice(0,mainAt), main=input.slice(mainAt);
  if(main.includes('data-bg-daily-steering-title="v1"'))return input;
  const h1=/<h1\b[^>]*>[\s\S]*?<\/h1>/i.exec(main);
  if(!h1)throw new Error('DAILY_STEERING_NO_H1');
  let updated=main.replace(h1[0],'<h1 data-bg-daily-steering-title="v1">'+copy.headline+'</h1>');
  const hEnd=updated.indexOf('data-bg-daily-steering-title="v1"');
  const nearby=updated.slice(hEnd,hEnd+4500);
  const lead=/<p\b[^>]*class=["'][^"']*\blead\b[^"']*["'][^>]*>[\s\S]*?<\/p>/i.exec(nearby);
  if(lead) {
    const existing=lead[0];
    const attrs=existing.match(/^<p\b([^>]*)>/i)?.[1]||' class="lead"';
    updated=updated.slice(0,hEnd)+nearby.replace(existing,'<p'+attrs+' data-bg-daily-steering-copy="v1">'+copy.lead+'</p>')+updated.slice(hEnd+nearby.length);
  } else {
    const finish=updated.indexOf('</h1>',hEnd)+5;
    updated=updated.slice(0,finish)+'\n<p class="lead" data-bg-daily-steering-copy="v1">'+copy.lead+'</p>'+updated.slice(finish);
  }
  return pre+updated;
}

function positionPowerhouse(input,copy) {
  const section=/<section\b[^>]*data-section=["']ai-ecosysteem["'][^>]*>[\s\S]*?<\/section>/i.exec(input);
  if(!section)return input;
  if(section[0].includes('data-bg-daily-steering-ecosystem="v1"'))return input;
  let s=section[0];
  s=s.replace(/<h2\b([^>]*)>[\s\S]*?<\/h2>/i,(_,attrs)=>'<h2'+attrs+'>'+copy.sectionHeading+'</h2>');
  s=s.replace(/(<span\b[^>]*class=["'][^"']*(?:eyebrow|bg-ai-eyebrow)[^"']*["'][^>]*>)[\s\S]*?(<\/span>)/i,(_,a,z)=>a+copy.eyebrow+z);
  s=s.replace(/<p\b([^>]*class=["'][^"']*(?:lead|bg-ai-lead)[^"']*["'][^>]*)>[\s\S]*?<\/p>/i,(_,attrs)=>'<p'+attrs+'>'+copy.sectionLead+'</p>');
  s=s.replace(/^<section\b/, '<section data-bg-daily-steering-ecosystem="v1"');
  return input.replace(section[0],s);
}

export function applyDailySteeringPositioning(html,locale='nl') {
  const copy=COPY[locale];
  if(!copy)throw new Error('DAILY_STEERING_LOCALE_UNSUPPORTED');
  const hero=replaceFirstHero(String(html||''),copy);
  return positionPowerhouse(hero,copy);
}

export async function updateDailySteeringFiles(root='.') {
  const results=[];
  for(const [locale,relative] of [['nl','index.html'],['en','en/index.html']]) {
    const file=root+'/'+relative;
    const html=await readFile(file,'utf8');
    const next=applyDailySteeringPositioning(html,locale);
    if(next!==html)await writeFile(file,next,'utf8');
    results.push({locale,file,changed:next!==html,hero:next.includes('data-bg-daily-steering-title="v1"'),ecosystem:next.includes('data-bg-daily-steering-ecosystem="v1"')});
  }
  return results;
}

if(process.argv[1]&&import.meta.url.endsWith(process.argv[1].replace(/\\/g,'/'))){
  console.log(JSON.stringify(await updateDailySteeringFiles()));
}
