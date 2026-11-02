import { readFile, writeFile } from 'node:fs/promises';

// The last customer-facing homepage copy projection runs after the existing V18,
// product-led, localization, and coherence passes. It never creates a second hero.
const COPY = Object.freeze({
  nl: {
    headline:'Je bedrijf verandert elke dag. <span class="mark">Je besturing moet mee.</span>',
    lead:'Bedrijfsgeheugen verbindt wat er <strong>binnen én buiten je onderneming</strong> verandert met je strategie, doelen, mensen, processen en financiën. Je ziet wat geraakt wordt, welke beslissing nodig is en wie de actie oppakt. Het resultaat wordt gemeten en helpt bij de volgende keuze. <strong>Geen extra AI-tool: een manier om je onderneming iedere dag beter te sturen.</strong> Bovenop de systemen die je al gebruikt.',
    eyebrow:'POWERHOUSE · DAGELIJKSE ONDERNEMINGSSTURING',
    kicker:'Iedere dag beter sturen',
    benefitsLabel:'Waarde voor ondernemers',
    benefits:['Kansen eerder herkennen','Risico’s tijdig begrijpen','Keuzes onderbouwen','Acties met eigenaar','Effecten meten','Continu verbeteren'],
    technologyCta:'Bekijk de technologie erachter →',
    sectionHeading:'Niet alleen inzicht. <span class="mark">Van verandering naar actie en resultaat.</span>',
    sectionLead:'Een chatbot geeft antwoord. Een dashboard toont cijfers. Een automatisering voert een losse stap uit. Bedrijfsgeheugen verbindt juist interne en externe signalen met je strategie en bedrijfssituatie, helpt gevolgen en prioriteiten bepalen, zet acties uit met een eigenaar en gebruikt de gemeten uitkomst voor de volgende beslissing. POWERHOUSE is de motor; betere ondernemingssturing is het doel.'
  },
  en: {
    headline:'Your business changes every day. <span class="mark">Your decisions should keep up.</span>',
    lead:'Bedrijfsgeheugen connects what changes <strong>inside and outside your business</strong> to your strategy, goals, people, processes and finances. See what is affected, which decision matters and who owns the next action. Measure outcomes and use them to improve the next decision. <strong>Not another AI tool: a practical way to run your business better every day.</strong> On top of the software you already use.',
    eyebrow:'POWERHOUSE · EVERYDAY BUSINESS STEERING',
    kicker:'Better decisions, every day',
    benefitsLabel:'Value for business owners',
    benefits:['Spot opportunities sooner','Understand emerging risks','Make informed decisions','Assign accountable actions','Measure real outcomes','Keep improving'],
    technologyCta:'Explore the technology behind it →',
    sectionHeading:'Beyond insights. <span class="mark">From change to action and results.</span>',
    sectionLead:'A chatbot answers questions. A dashboard displays figures. An automation executes one predefined step. Bedrijfsgeheugen instead connects internal and external signals to your strategy and business context, helps assess impact and priorities, assigns actions and feeds measured results into the next decision. POWERHOUSE is the engine; better daily steering is the outcome.'
  }
});

function replaceFirstHero(input,copy) {
  const mainAt=input.search(/<main(?:\s|>)/i);
  if(mainAt<0)throw new Error('DAILY_STEERING_NO_MAIN');
  const pre=input.slice(0,mainAt), main=input.slice(mainAt);
  if(main.includes('data-bg-daily-steering-title="v2"') && main.includes('data-bg-daily-steering-copy="v2"'))return input;
  const h1=/<h1\b[^>]*>[\s\S]*?<\/h1>/i.exec(main);
  if(!h1)throw new Error('DAILY_STEERING_NO_H1');
  let updated=main.replace(h1[0],'<h1 data-bg-daily-steering-title="v2">'+copy.headline+'</h1>');
  const hEnd=updated.indexOf('data-bg-daily-steering-title="v2"');
  const window=updated.slice(hEnd,hEnd+5500);
  // Early v1 put a second <p class="lead"> before the already-present .hero-sub.
  // Remove that injected copy and reuse the original hero paragraph in place.
  let nearby=window.replace(/<p\b[^>]*data-bg-daily-steering-copy=["']v1["'][^>]*>[\s\S]*?<\/p>\s*/i,'');
  const originalHero=/<p\b[^>]*class=["'][^"']*\bhero-sub\b[^"']*["'][^>]*>[\s\S]*?<\/p>/i.exec(nearby);
  const fallbackLead=/<p\b[^>]*class=["'][^"']*\blead\b[^"']*["'][^>]*>[\s\S]*?<\/p>/i.exec(nearby);
  const paragraph=originalHero||fallbackLead;
  if(paragraph){
    const attrs=paragraph[0].match(/^<p\b([^>]*)>/i)?.[1]||' class="hero-sub"';
    nearby=nearby.replace(paragraph[0],'<p'+attrs+' data-bg-daily-steering-copy="v2">'+copy.lead+'</p>');
  } else {
    const finish=nearby.indexOf('</h1>')+5;
    if(finish<5)throw new Error('DAILY_STEERING_HERO_CONTEXT_MISSING');
    nearby=nearby.slice(0,finish)+'\n<p class="hero-sub" data-bg-daily-steering-copy="v2">'+copy.lead+'</p>'+nearby.slice(finish);
  }
  updated=updated.slice(0,hEnd)+nearby+updated.slice(hEnd+window.length);
  // Tell the entrepreneur what is delivered, before mentioning AI as technology.
  updated=updated.replace(
    /(<div\b[^>]*class=["'][^"']*\bhero-kicker\b[^"']*["'][^>]*>\s*(?:<span\b[^>]*><\/span>)?\s*)[^<]*(<\/div>)/i,
    (_,a,z)=>a+copy.kicker+z
  );
  return pre+updated;
}

function positionPowerhouse(input,copy) {
  const section=/<section\b[^>]*data-section=["']ai-ecosysteem["'][^>]*>[\s\S]*?<\/section>/i.exec(input);
  if(!section)return input;
  if(section[0].includes('data-bg-daily-steering-ecosystem="v2"'))return input;
  let s=section[0];
  s=s.replace(/<h2\b([^>]*)>[\s\S]*?<\/h2>/i,(_,attrs)=>'<h2'+attrs+'>'+copy.sectionHeading+'</h2>');
  s=s.replace(/(<span\b[^>]*class=["'][^"']*(?:eyebrow|bg-ai-eyebrow)[^"']*["'][^>]*>)[\s\S]*?(<\/span>)/i,(_,a,z)=>a+copy.eyebrow+z);
  s=s.replace(/<p\b([^>]*class=["'][^"']*(?:lead|bg-ai-lead)[^"']*["'][^>]*)>[\s\S]*?<\/p>/i,(_,attrs)=>'<p'+attrs+'>'+copy.sectionLead+'</p>');
  const benefits='<div class="bg-ai-agents" aria-label="'+copy.benefitsLabel+'">'+copy.benefits.map(x=>'<span>'+x+'</span>').join('')+'</div>';
  s=s.replace(/<div\b[^>]*class=["'][^"']*\bbg-ai-agents\b[^"']*["'][^>]*aria-label=["'](?:Voorbeelden van AI-agents|Examples of AI agents)["'][^>]*>[\s\S]*?<\/div>/i,benefits);
  s=s.replace(/(<a\b[^>]*href=["'](?:https:\/\/www\.bedrijfsgeheugen\.nl)?\/ai-ecosysteem["'][^>]*>)[\s\S]*?(<\/a>)/i,(_,a,z)=>a+copy.technologyCta+z);
  if(s.includes('data-bg-daily-steering-ecosystem="v1"'))s=s.replace('data-bg-daily-steering-ecosystem="v1"','data-bg-daily-steering-ecosystem="v2"');
  else s=s.replace(/^<section\b/, '<section data-bg-daily-steering-ecosystem="v2"');
  return input.replace(section[0],s);
}


/**
 * Present the actual buyer decision before the platform architecture.
 * Static explanatory copy only: never project sample revenue, claims or simulated ROI.
 * The same final Netlify pipeline renders Dutch and English variants.
 */
const VALUE_FIRST = Object.freeze({
  nl: {
    eyebrow:'VOOR ONDERNEMERS · NIET VOOR DASHBOARDS',
    title:'Wat levert een betere beslissing jouw bedrijf op?',
    intro:'Je wilt meer grip op omzet, winst, klanten en tijd. Bedrijfsgeheugen helpt zien wat aandacht vraagt, kiezen wat je als eerste verbetert en controleren wat het werkelijk oplevert.',
    cards:[
      ['Meer omzet','Zie welke klant- en verkoopprocessen aandacht verdienen. Een kans is nog geen extra order.'],
      ['Minder verspilling','Ontdek dubbel werk, vertragingen en kennisafhankelijkheid. Een besparingsschatting is nog geen besparing.'],
      ['Bewijs van verbetering','Volg wat is voorgesteld, goedgekeurd, uitgevoerd en met betrouwbare brongegevens bevestigd.']
    ],
    proof:'Transparant over bewijs: de publieke portaalweergave kan voorbeeldgegevens bevatten. Je eigen resultaten worden pas getoond wanneer je bent ingelogd en de bronnen zijn gecontroleerd.',
    primary:'Ontdek gratis jouw bedrijfslekken →',secondary:'Bekijk hoe het portaal werkt →'
  },
  en: {
    eyebrow:'FOR BUSINESS OWNERS · NOT MORE DASHBOARDS',
    title:'What does a better decision deliver for your business?',
    intro:'You want a clearer view of revenue, profit, customers and time. Bedrijfsgeheugen helps identify what matters, choose the next improvement and verify the actual result.',
    cards:[
      ['Grow revenue','See where customer and sales processes need attention. An opportunity is not a paid order.'],
      ['Reduce waste','Find duplicated work, delays and critical knowledge dependencies. Estimated savings are not realised savings.'],
      ['Prove improvement','Track what was proposed, approved, executed and verified against reliable source data.']
    ],
    proof:'Evidence matters: public portal views may contain sample data. Your own results appear only after authentication and source verification.',
    primary:'Start your free business scan →',secondary:'See how the portal works →'
  }
});
const valueEscape = value => String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export function insertEntrepreneurValueFirst(html,locale='nl'){
  const content=VALUE_FIRST[locale];
  if(!content)throw new Error('VALUE_FIRST_LOCALE_UNSUPPORTED');
  if(html.includes('data-bg-business-value-first="v1"'))return html;
  const main=/<main\b[^>]*>/i.exec(html);
  if(!main)throw new Error('VALUE_FIRST_NO_MAIN');
  const cards=content.cards.map(([title,body])=>'<article class="bgvf-card"><h3>'+valueEscape(title)+'</h3><p>'+valueEscape(body)+'</p></article>').join('');
  const section=`<section class="bgvf" data-bg-business-value-first="v1" aria-labelledby="bgvf-title">
<style>
.bgvf{background:#11233e;color:#fff;padding:clamp(2.2rem,5vw,4.2rem) 1.25rem}
.bgvf-inner{max-width:72rem;margin:0 auto}
.bgvf-kicker{display:block;color:#b9d6ff;font-size:.78rem;font-weight:800;letter-spacing:.09em}
.bgvf h2{color:#fff;max-width:850px;font-size:clamp(1.9rem,4.6vw,3.35rem);line-height:1.1;letter-spacing:-.035em;margin:.8rem 0}
.bgvf-intro{max-width:770px;color:#e6effc;font-size:clamp(1rem,1.9vw,1.19rem);line-height:1.6}
.bgvf-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:1.75rem 0}
.bgvf-card{background:#fff;color:#152b43;padding:1.3rem;border-radius:15px;min-width:0}
.bgvf-card h3{font-size:1.18rem;color:#132944;margin:0 0 .55rem}
.bgvf-card p{color:#38506b;font-size:.94rem;line-height:1.55;margin:0}
.bgvf-proof{max-width:850px;padding-left:14px;border-left:3px solid #a4d5ef;color:#d8e8f7;font-size:.88rem;line-height:1.55}
.bgvf-actions{display:flex;flex-wrap:wrap;gap:11px;margin-top:1.3rem}
.bgvf-actions a{min-height:48px;display:inline-flex;align-items:center;justify-content:center;border-radius:10px;padding:12px 18px;background:#ffdf66;color:#14213b!important;text-decoration:none;font-weight:800}
.bgvf-actions a.secondary{background:transparent;color:#fff!important;border:1px solid #a7b8d1}
.bgvf-actions a:focus-visible{outline:3px solid #fff;outline-offset:4px}
@media(max-width:750px){.bgvf-cards{grid-template-columns:1fr}.bgvf-actions a{width:100%}}
</style>
<div class="bgvf-inner"><span class="bgvf-kicker">${valueEscape(content.eyebrow)}</span>
<h2 id="bgvf-title">${valueEscape(content.title)}</h2><p class="bgvf-intro">${valueEscape(content.intro)}</p>
<div class="bgvf-cards">${cards}</div>
<p class="bgvf-proof">${valueEscape(content.proof)}</p>
<div class="bgvf-actions"><a href="https://www.bedrijfsgeheugen.nl/zelfscan" data-bg-conversion="bedrijfslek">${valueEscape(content.primary)}</a><a class="secondary" href="https://www.bedrijfsgeheugen.nl/product">${valueEscape(content.secondary)}</a></div></div></section>`;
  const at=main.index+main[0].length;
  return html.slice(0,at)+'\n'+section+'\n'+html.slice(at);
}

export function applyDailySteeringPositioning(html,locale='nl') {
  const copy=COPY[locale];
  if(!copy)throw new Error('DAILY_STEERING_LOCALE_UNSUPPORTED');
  const hero=replaceFirstHero(String(html||''),copy);
  return insertEntrepreneurValueFirst(positionPowerhouse(hero,copy),locale);
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
