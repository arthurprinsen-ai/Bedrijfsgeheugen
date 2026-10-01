import { readFile, writeFile, glob } from 'node:fs/promises';

const ORIGIN='https://www.bedrijfsgeheugen.nl';
const STYLE='/assets/site-coherence-v1.css?v=20261001';

function routeFor(path){
  const p=String(path).replace(/\\/g,'/');
  if(p==='index.html') return '/';
  if(p.endsWith('/index.html')) return '/'+p.slice(0,-'index.html'.length);
  return '/'+p.replace(/\.html$/,'');
}

function fixContactLinks(html){
  return String(html)
    .replace(/href=(["'])https:\/\/www\.bedrijfsgeheugen\.nl\/#contact\1/gi,'href=$1https://www.bedrijfsgeheugen.nl/contact$1')
    .replace(/href=(["'])\/#contact\1/gi,'href=$1/contact$1')
    .replace(/href=(["'])#contact\1/gi,'href=$1/contact$1')
    .replace(/href=(["'])https:\/\/bedrijfsgeheugen\.nl\/#contact\1/gi,'href=$1https://www.bedrijfsgeheugen.nl/contact$1');
}

function markRoute(html,route){
  const safe=route.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  if(/<body\b[^>]*data-bg-route=/i.test(html)){
    return html.replace(/(<body\b[^>]*data-bg-route=)(["'])[^"']*\2/i,`$1"${safe}"`);
  }
  return html.replace(/<body\b([^>]*)>/i,`<body$1 data-bg-route="${safe}">`);
}

function ensureStyle(html){
  if(html.includes('site-coherence-v1.css')) return html;
  return html.replace('</head>',`<link rel="stylesheet" href="${STYLE}">\n</head>`);
}

const productTruth=`
<section class="bg-product-truth-v1" data-bg-product-truth-v1 aria-labelledby="bg-product-truth-title">
  <div class="bg-product-truth-wrap">
    <span class="bg-product-truth-kicker">ZO WERKT POWERHOUSE</span>
    <h2 id="bg-product-truth-title">Eén platform. Drie lagen die samenwerken.</h2>
    <p class="bg-product-truth-lead">Je ziet wat er speelt, zet inzicht om in concrete acties en voert die uit in de systemen die je al gebruikt. Intelligence, Agents en Connect vormen samen één gesloten werklijn van bron tot resultaat.</p>
    <div class="bg-product-truth-grid">
      <article><span>Zien &amp; begrijpen</span><h3>Powerhouse Intelligence</h3><p>Bedrijfsdata, kennis, benchmarks en externe signalen worden samengebracht tot actuele context, prioriteiten en managementinformatie.</p></article>
      <article><span>Beslissen &amp; uitvoeren</span><h3>Powerhouse Agents</h3><p>Inzichten worden vertaald naar taken, workflows en acties met eigenaarschap, goedkeuringen, bewijs en terugkoppeling.</p></article>
      <article><span>Verbinden &amp; automatiseren</span><h3>Powerhouse Connect</h3><p>AFAS, Exact, Microsoft 365, webshops, CRM en API's sluiten aan op dezelfde gegevens- en uitvoeringslaag.</p></article>
    </div>
    <div class="bg-product-model" aria-label="Zo werkt Powerhouse">
      <div class="bg-product-node"><small>1</small><b>Bronnen</b><span>Data · kennis · systemen</span></div><i>→</i>
      <div class="bg-product-node"><small>2</small><b>Intelligence</b><span>Context · kansen · risico's</span></div><i>→</i>
      <div class="bg-product-node"><small>3</small><b>Agents</b><span>Besluiten · taken · workflows</span></div><i>→</i>
      <div class="bg-product-node"><small>4</small><b>Connect</b><span>AFAS · Exact · M365 · API</span></div><i>→</i>
      <div class="bg-product-node accent"><small>5</small><b>Resultaat</b><span>Bewijs · impact · leren</span></div>
    </div>
    <div class="bg-product-ai-links"><b>Verder met AI:</b><a href="/ai-modelwijzer">AI-modelwijzer</a><a href="/ai-capability-model">AI-capabilitymodel</a><a href="/ai-adoptie">AI-adoptie</a><a href="/ai-governance">AI-governance</a><a href="/ai-act">AI Act</a><a href="/data-soevereiniteit">Data-soevereiniteit</a></div>
    <div class="bg-product-truth-loop" aria-label="Powerhouse closed loop">
      <b>Data</b><i>→</i><b>Context</b><i>→</i><b>Intelligence</b><i>→</i><b>Besluit</b><i>→</i><b>Actie</b><i>→</i><b>Bewijs</b><i>→</i><b>Leren</b>
    </div>
    <div class="bg-product-truth-actions">
      <a class="primary" href="https://www.bedrijfsgeheugen.nl/prijzen">Bekijk pakketten →</a>
      <a href="https://www.bedrijfsgeheugen.nl/portaal-demo">Bekijk interactieve portaal-demo</a>
      <a href="https://www.bedrijfsgeheugen.nl/systemen-koppelen">Bekijk koppelingen</a>
    </div>
  </div>
</section>`;

const productTruthEn=`
<section class="bg-product-truth-v1" data-bg-product-truth-v1 aria-labelledby="bg-product-truth-title">
  <div class="bg-product-truth-wrap">
    <span class="bg-product-truth-kicker">HOW POWERHOUSE WORKS</span>
    <h2 id="bg-product-truth-title">One platform. Three layers working together.</h2>
    <p class="bg-product-truth-lead">See what is happening, turn insight into concrete actions and execute them in the systems you already use. Intelligence, Agents and Connect form one closed workflow from source to outcome.</p>
    <div class="bg-product-truth-grid">
      <article><span>See &amp; understand</span><h3>Powerhouse Intelligence</h3><p>Company data, knowledge, benchmarks and external signals become current context, priorities and management intelligence.</p></article>
      <article><span>Decide &amp; execute</span><h3>Powerhouse Agents</h3><p>Insights become tasks, workflows and actions with ownership, approvals, evidence and outcome readback.</p></article>
      <article><span>Connect &amp; automate</span><h3>Powerhouse Connect</h3><p>AFAS, Exact, Microsoft 365, webshops, CRM and APIs connect to the same data and execution layer.</p></article>
    </div>
    <div class="bg-product-model" aria-label="How Powerhouse works">
      <div class="bg-product-node"><small>1</small><b>Sources</b><span>Data · knowledge · systems</span></div><i>→</i>
      <div class="bg-product-node"><small>2</small><b>Intelligence</b><span>Context · opportunities · risks</span></div><i>→</i>
      <div class="bg-product-node"><small>3</small><b>Agents</b><span>Decisions · tasks · workflows</span></div><i>→</i>
      <div class="bg-product-node"><small>4</small><b>Connect</b><span>AFAS · Exact · M365 · API</span></div><i>→</i>
      <div class="bg-product-node accent"><small>5</small><b>Outcome</b><span>Evidence · impact · learning</span></div>
    </div>
    <div class="bg-product-ai-links"><b>Explore AI:</b><a href="/en/ai-modelwijzer">AI model guide</a><a href="/en/ai-capability-model">AI capability model</a><a href="/en/ai-adoptie">AI adoption</a><a href="/en/ai-governance">AI governance</a><a href="/en/ai-act">AI Act</a><a href="/en/data-soevereiniteit">Data sovereignty</a></div>
    <div class="bg-product-truth-loop" aria-label="Powerhouse closed loop">
      <b>Data</b><i>→</i><b>Context</b><i>→</i><b>Intelligence</b><i>→</i><b>Decision</b><i>→</i><b>Action</b><i>→</i><b>Evidence</b><i>→</i><b>Learning</b>
    </div>
    <div class="bg-product-truth-actions">
      <a class="primary" href="https://www.bedrijfsgeheugen.nl/en/prijzen">View plans →</a>
      <a href="https://www.bedrijfsgeheugen.nl/portaal-demo">View interactive portal demo</a>
      <a href="https://www.bedrijfsgeheugen.nl/en/systemen-koppelen">View integrations</a>
    </div>
  </div>
</section>`;

function ensureProductTruth(html,route){
  if(!['/product','/en/product'].includes(route)) return html;
  const section=route==='/en/product'?productTruthEn:productTruth;

  // Never create a second hero. The build pipeline can rewrite /product before this
  // finalizer runs, so anchor the Powerhouse model inside the customer narrative.
  // Prefer replacing the legacy "website/portal parity" implementation section.
  // Keep the match inside one section so build-time rewrites cannot consume the hero H1.\n  const legacySection=/<section\b[^>]*>(?:(?!<section\b)[\s\S]){0,2500}?(?:Website en portaal spreken nu dezelfde taal\.|Website and portal now speak the same language\.)(?:(?!<section\b)[\s\S])*?<\/section>/i;
  if(legacySection.test(html)){
    return html.replace(legacySection,section);
  }

  // Remove an older injected truth block before relocating it.
  html=html.replace(/<section\b[^>]*data-bg-product-truth-v1[^>]*>[\s\S]*?<\/section>/i,'');

  // Put the model after the actual page hero, whatever class the build produced.
  const mainStart=html.search(/<main\b[^>]*>/i);
  if(mainStart<0) return html;
  const afterMain=html.slice(mainStart);
  const firstSection=afterMain.match(/<section\b[^>]*>[\s\S]*?<\/section>/i);
  if(firstSection){
    const at=mainStart+(firstSection.index||0)+firstSection[0].length;
    return html.slice(0,at)+'\n'+section+'\n'+html.slice(at);
  }
  const main=html.match(/<main\b[^>]*>/i);
  const at=(main.index||0)+main[0].length;
  return html.slice(0,at)+'\n'+section+'\n'+html.slice(at);
}

const routeMetadata=new Map([
  ['/prijzen',{title:'Kosten digitalisering mkb | Powerhouse prijzen',description:'Vergelijk Powerhouse SaaS, workshops, scans en begeleiding. Transparante prijzen, mogelijkheden en een direct pakketadvies voor het mkb.'}],
  ['/pakketadvies',{title:'Welk Powerhouse-pakket past bij mij? | Bedrijfsgeheugen',description:'Krijg een passend Powerhouse-pakketadvies op basis van organisatiegrootte, doel en gewenste aanpak.'}],
  ['/portaal-demo',{title:'Interactieve Powerhouse portaal-demo | Bedrijfsgeheugen',description:'Bekijk interactief hoe Powerhouse Intelligence, Agents en Connect samenwerken van signaal naar actie en resultaat.'}],
  ['/contact',{title:'Contact — even bellen of appen | Bedrijfsgeheugen',description:'Neem direct contact op over kennisborging, automatisering, koppelingen, data en AI voor het mkb.'}],
  ['/product',{title:'Bedrijfsgeheugen platform voor het mkb | Bedrijfsgeheugen',description:'Powerhouse brengt Intelligence, Agents en Connect samen: van bedrijfscontext en besluitvorming naar actie in je bestaande systemen.'}],
  ['/en/prijzen',{title:'Digital Transformation Pricing for SMEs | Bedrijfsgeheugen',description:'See practical pricing for digitalisation, automation and AI. Compare what you need now with scalable options for growth and control.'}],
  ['/en/pakketadvies',{title:'Which Powerhouse plan fits me? | Bedrijfsgeheugen',description:'Get a Powerhouse plan recommendation based on organisation size, goal and preferred way of working.'}],
  ['/en/portaal-demo',{title:'Interactive Powerhouse portal demo | Bedrijfsgeheugen',description:'See how Powerhouse Intelligence, Agents and Connect work together from signal to action and measurable outcome.'}],
  ['/en/contact',{title:'Contact | Bedrijfsgeheugen',description:'Contact Bedrijfsgeheugen directly about knowledge continuity, automation, integrations, data and AI.'}],
  ['/en/product',{title:'Business Knowledge Platform | Bedrijfsgeheugen',description:'A company knowledge platform that connects strategy, operations, data, AI and actions in one continuously learning business system.'}]
]);

function setHeadText(html,tagRe,replacement){
  return tagRe.test(html)?html.replace(tagRe,replacement):html.replace(/<\/head>/i,replacement+'\n</head>');
}

function ensureProductHeroVisibility(html,route){
  if(route!=='/product' && route!=='/en/product') return html;
  const invariant='<style id="bg-product-hero-visibility-invariant">body[data-bg-route="/product"] main>section:first-of-type,body[data-bg-route="/en/product"] main>section:first-of-type,body[data-bg-route="/product"] main>section:first-of-type>*,body[data-bg-route="/en/product"] main>section:first-of-type>*{display:block!important;visibility:visible!important;opacity:1!important;transform:none!important;content-visibility:visible!important}body[data-bg-route="/product"] main h1:first-of-type,body[data-bg-route="/en/product"] main h1:first-of-type{display:block!important;visibility:visible!important;opacity:1!important;transform:none!important;clip:auto!important;clip-path:none!important}</style>';
  if(!html.includes('bg-product-hero-visibility-invariant')) html=html.replace(/<\/head>/i,invariant+'\n</head>');
  html=html.replace(/<h1\b([^>]*)>/i,(m,attrs)=>{
    const cleaned=attrs.replace(/\sstyle=("[^"]*"|'[^']*')/i,'');
    return '<h1'+cleaned+' style="display:block!important;visibility:visible!important;opacity:1!important;transform:none!important;clip:auto!important;clip-path:none!important">';
  });
  return html;
}

function ensureBedrijfslekProductCta(html,route){
  if(route!=='/zelfscan') return html;
  return html
    .replace(/href=(["'])\/product\1/gi,'href=$1https://www.bedrijfsgeheugen.nl/product$1')
    .replace(/href=(["'])https:\/\/bedrijfsgeheugen\.nl\/product\1/gi,'href=$1https://www.bedrijfsgeheugen.nl/product$1');
}

function ensureRouteMetadata(html,route){
  const meta=routeMetadata.get(route);
  if(!meta) return html;
  const canonical='https://www.bedrijfsgeheugen.nl'+route;
  html=setHeadText(html,/<title>[\s\S]*?<\/title>/i,`<title>${meta.title}</title>`);
  html=setHeadText(html,/<meta\b[^>]*name=(["'])description\1[^>]*>/i,`<meta name="description" content="${meta.description.replace(/"/g,'&quot;')}">`);
  html=setHeadText(html,/<link\b[^>]*rel=(["'])canonical\1[^>]*>/i,`<link rel="canonical" href="${canonical}">`);
  html=setHeadText(html,/<meta\b[^>]*property=(["'])og:title\1[^>]*>/i,`<meta property="og:title" content="${meta.title.replace(/"/g,'&quot;')}">`);
  html=setHeadText(html,/<meta\b[^>]*property=(["'])og:description\1[^>]*>/i,`<meta property="og:description" content="${meta.description.replace(/"/g,'&quot;')}">`);
  html=setHeadText(html,/<meta\b[^>]*name=(["'])twitter:title\1[^>]*>/i,`<meta name="twitter:title" content="${meta.title.replace(/"/g,'&quot;')}">`);
  html=setHeadText(html,/<meta\b[^>]*name=(["'])twitter:description\1[^>]*>/i,`<meta name="twitter:description" content="${meta.description.replace(/"/g,'&quot;')}">`);
  return html;
}

function failKnownBroken(html,path){
  const bad=[
    /href=(["'])#contact\1/i,
    /href=(["'])\/#contact\1/i,
    /href=(["'])https:\/\/www\.bedrijfsgeheugen\.nl\/#contact\1/i
  ];
  for(const re of bad) if(re.test(html)) throw new Error(`Broken contact navigation remains in ${path}`);
}

const files=[];
for await (const p of glob('*.html')) files.push(p);
for await (const p of glob('blog/**/index.html')) files.push(p);
for await (const p of glob('en/**/*.html')) files.push(p);
for await (const p of glob('*-ai-modellen/index.html')) files.push(p);
for await (const p of glob('*-vs-*/index.html')) files.push(p);

let changed=0;
for(const path of [...new Set(files)]){
  if(path.startsWith('portal-v2/')) continue;
  let html;
  try{html=await readFile(path,'utf8')}catch{continue}
  if(!/<html\b/i.test(html)||!/<body\b/i.test(html)) continue;
  const route=routeFor(path);
  let next=fixContactLinks(html);
  next=markRoute(next,route);
  next=ensureStyle(next);
  next=ensureProductTruth(next,route);
  next=ensureRouteMetadata(next,route);
  next=ensureProductHeroVisibility(next,route);
  next=ensureBedrijfslekProductCta(next,route);
  failKnownBroken(next,path);
  if(next!==html){await writeFile(path,next,'utf8');changed++}
}
console.log(`Website coherence v1 applied to ${changed} pages`);
