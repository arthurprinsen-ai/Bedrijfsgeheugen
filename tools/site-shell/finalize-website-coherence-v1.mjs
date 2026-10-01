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
    <h2 id="bg-product-truth-title">Website en portaal vertellen voortaan exact hetzelfde verhaal.</h2>
    <p class="bg-product-truth-lead">Powerhouse is één platform met drie productlijnen. De website verkoopt alleen mogelijkheden die in het portaal terugkomen en het actieve pakket bepaalt wat beschikbaar is.</p>
    <div class="bg-product-truth-grid">
      <article><span>Zien &amp; begrijpen</span><h3>Powerhouse Intelligence</h3><p>Bedrijfsdata, kennis, benchmarks en externe signalen worden samengebracht tot actuele context, prioriteiten en managementinformatie.</p></article>
      <article><span>Beslissen &amp; uitvoeren</span><h3>Powerhouse Agents</h3><p>Inzichten worden vertaald naar taken, workflows en acties met eigenaarschap, goedkeuringen, bewijs en terugkoppeling.</p></article>
      <article><span>Verbinden &amp; automatiseren</span><h3>Powerhouse Connect</h3><p>AFAS, Exact, Microsoft 365, webshops, CRM en API's sluiten aan op dezelfde gegevens- en uitvoeringslaag.</p></article>
    </div>
    <div class="bg-product-truth-loop" aria-label="Powerhouse closed loop">
      <b>Data</b><i>→</i><b>Context</b><i>→</i><b>Intelligence</b><i>→</i><b>Besluit</b><i>→</i><b>Actie</b><i>→</i><b>Bewijs</b><i>→</i><b>Leren</b>
    </div>
    <div class="bg-product-truth-actions">
      <a class="primary" href="https://www.bedrijfsgeheugen.nl/prijzen">Bekijk pakketten →</a>
      <a href="https://www.bedrijfsgeheugen.nl/portal-v2/">Bekijk het portaal</a>
      <a href="https://www.bedrijfsgeheugen.nl/systemen-koppelen">Bekijk koppelingen</a>
    </div>
  </div>
</section>`;

const productTruthEn=`
<section class="bg-product-truth-v1" data-bg-product-truth-v1 aria-labelledby="bg-product-truth-title">
  <div class="bg-product-truth-wrap">
    <span class="bg-product-truth-kicker">POWERHOUSE · THE CURRENT PRODUCT</span>
    <h2 id="bg-product-truth-title">Website and portal now tell exactly the same product story.</h2>
    <p class="bg-product-truth-lead">Powerhouse is one platform with three product lines. The website only sells capabilities that exist in the portal, and the active plan determines what is available.</p>
    <div class="bg-product-truth-grid">
      <article><span>See &amp; understand</span><h3>Powerhouse Intelligence</h3><p>Company data, knowledge, benchmarks and external signals become current context, priorities and management intelligence.</p></article>
      <article><span>Decide &amp; execute</span><h3>Powerhouse Agents</h3><p>Insights become tasks, workflows and actions with ownership, approvals, evidence and outcome readback.</p></article>
      <article><span>Connect &amp; automate</span><h3>Powerhouse Connect</h3><p>AFAS, Exact, Microsoft 365, webshops, CRM and APIs connect to the same data and execution layer.</p></article>
    </div>
    <div class="bg-product-truth-loop" aria-label="Powerhouse closed loop">
      <b>Data</b><i>→</i><b>Context</b><i>→</i><b>Intelligence</b><i>→</i><b>Decision</b><i>→</i><b>Action</b><i>→</i><b>Evidence</b><i>→</i><b>Learning</b>
    </div>
    <div class="bg-product-truth-actions">
      <a class="primary" href="https://www.bedrijfsgeheugen.nl/en/prijzen">View plans →</a>
      <a href="https://www.bedrijfsgeheugen.nl/portal-v2/">View the portal</a>
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
