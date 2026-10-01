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
    <span class="bg-product-truth-kicker">POWERHOUSE · HET ACTUELE PRODUCT</span>
    <h2 id="bg-product-truth-title">Van losse informatie naar een bedrijf dat zichzelf beter bestuurt.</h2>
    <p class="bg-product-truth-lead">Powerhouse brengt drie dingen samen die in veel organisaties los van elkaar staan: begrijpen wat er speelt, besluiten wat er moet gebeuren en het vervolgens ook uitvoeren in de systemen die je al gebruikt.</p>
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
    <span class="bg-product-truth-kicker">POWERHOUSE · THE CURRENT PRODUCT</span>
    <h2 id="bg-product-truth-title">From scattered information to a company that can steer itself better.</h2>
    <p class="bg-product-truth-lead">Powerhouse brings together three things that are often disconnected: understanding what is happening, deciding what needs to happen and actually executing it in the systems you already use.</p>
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
      <a href="https://www.bedrijfsgeheugen.nl/portal-v2/">View interactive portal demo</a>
      <a href="https://www.bedrijfsgeheugen.nl/en/systemen-koppelen">View integrations</a>
    </div>
  </div>
</section>`;

function ensureProductTruth(html,route){
  if(!['/product','/en/product'].includes(route) || html.includes('data-bg-product-truth-v1')) return html;
  const m=html.match(/<main\b[^>]*>/i);
  if(!m) return html;
  const at=(m.index||0)+m[0].length;
  const section=route==='/en/product'?productTruthEn:productTruth;
  return html.slice(0,at)+'\n'+section+'\n'+html.slice(at);
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
  failKnownBroken(next,path);
  if(next!==html){await writeFile(path,next,'utf8');changed++}
}
console.log(`Website coherence v1 applied to ${changed} pages`);
