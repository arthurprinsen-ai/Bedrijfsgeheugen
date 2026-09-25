import { readFile, writeFile } from 'node:fs/promises';

const STYLE = `<style id="bg-ai-ecosysteem-style">
.bg-ai-ecosysteem{padding:72px 0;background:linear-gradient(180deg,#fbfaf7 0%,#f2f4ff 100%);border-top:1px solid #dcdfe6;border-bottom:1px solid #dcdfe6}
.bg-ai-ecosysteem .bg-ai-wrap{max-width:1120px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:.92fr 1.08fr;gap:36px;align-items:center}
.bg-ai-ecosysteem .bg-ai-eyebrow{font:600 12px/1.4 "IBM Plex Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:#ff4f17}
.bg-ai-ecosysteem h2{font-family:"Bricolage Grotesque",sans-serif;font-size:clamp(30px,4vw,46px);line-height:1.06;letter-spacing:-.035em;margin:10px 0 14px;color:#14171a}
.bg-ai-ecosysteem .bg-ai-lead{font-size:17px;line-height:1.65;color:#4f5862;max-width:60ch}
.bg-ai-agents{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:18px 0}
.bg-ai-agents span{font-size:12px;font-weight:700;background:#edf0fd;border:1px solid #d6dcf7;border-radius:999px;padding:7px 10px;text-align:center}
.bg-ai-cta{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
.bg-ai-cta a{display:inline-flex;align-items:center;justify-content:center;padding:11px 14px;border-radius:10px;text-decoration:none;font-weight:700;border:1px solid #2742d6;background:#2742d6;color:#fff}
.bg-ai-cta a:last-child{background:#fff;color:#14171a;border-color:#dcdfe6}
.bg-ai-flow{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.bg-ai-node{background:#fff;border:1px solid #dcdfe6;border-radius:12px;padding:14px;min-height:100px}
.bg-ai-node strong{display:block;font:700 15px/1.2 "Bricolage Grotesque",sans-serif;margin-bottom:5px}
.bg-ai-node span{display:block;font-size:12px;line-height:1.45;color:#5c646e}
.bg-ai-node.bg-ai-core{grid-column:1/-1;background:#0e2148;border-color:#0e2148;color:#fff}
.bg-ai-node.bg-ai-core span{color:#c7d0e5}
@media(max-width:860px){.bg-ai-ecosysteem .bg-ai-wrap{grid-template-columns:1fr}.bg-ai-flow{grid-template-columns:1fr 1fr}.bg-ai-agents{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.bg-ai-flow,.bg-ai-agents{grid-template-columns:1fr}.bg-ai-ecosysteem{padding:48px 0}}
</style>`;

const SECTION = `<section class="bg-ai-ecosysteem" data-section="ai-ecosysteem" aria-labelledby="bg-ai-ecosysteem-title">
  <div class="bg-ai-wrap">
    <div>
      <span class="bg-ai-eyebrow">POWERHOUSE · AI-ECOSYSTEEM</span>
      <h2 id="bg-ai-ecosysteem-title">Niet één AI-tool. <span>Een bedrijf dat samenwerkt.</span></h2>
      <p class="bg-ai-lead">Bedrijfsgeheugen verbindt bedrijfsdata, kennis, applicaties, processen en AI-agents in één werkend geheel. Signalen worden herkend, context wordt toegevoegd, acties worden voorgesteld of uitgevoerd en de uitkomst vloeit terug in het bedrijfsgeheugen.</p>
      <div class="bg-ai-agents" aria-label="Voorbeelden van AI-agents">
        <span>Sales-agent</span><span>Finance-agent</span><span>HR-agent</span>
        <span>Operations-agent</span><span>Management-agent</span><span>Strategie-agent</span>
      </div>
      <div class="bg-ai-cta">
        <a href="/ai-ecosysteem">Bekijk het AI-ecosysteem →</a>
        <a href="/frisse-blik">Ontdek waar het bij jou begint</a>
      </div>
    </div>
    <div class="bg-ai-flow" aria-label="Hoe het AI-ecosysteem werkt">
      <div class="bg-ai-node"><strong>1. Data &amp; signalen</strong><span>ERP, CRM, finance, HR, web, BI en externe bronnen.</span></div>
      <div class="bg-ai-node"><strong>2. Kennis &amp; context</strong><span>Processen, afspraken, doelen, besluiten en bedrijfsspecifieke kennis.</span></div>
      <div class="bg-ai-node"><strong>3. Systemen</strong><span>AFAS, Exact, Microsoft 365, webshops en branchespecifieke software.</span></div>
      <div class="bg-ai-node bg-ai-core"><strong>POWERHOUSE — het bedrijfsbrein</strong><span>Verbindt wat er gebeurt met wat het bedrijf weet, wil bereiken en moet doen.</span></div>
      <div class="bg-ai-node"><strong>4. AI-agents</strong><span>Analyseren, signaleren, voorstellen, uitvoeren en controleren binnen afgesproken grenzen.</span></div>
      <div class="bg-ai-node"><strong>5. Acties</strong><span>Van opvolging en planning tot rapportage, escalatie en besluitvorming.</span></div>
      <div class="bg-ai-node"><strong>6. Leren &amp; verbeteren</strong><span>Resultaten en feedback worden opnieuw context voor de volgende beslissing.</span></div>
    </div>
  </div>
</section>`;

export function applyAiEcosystemPropositionHtml(input) {
  let html=String(input || '');
  if (!/<html\b/i.test(html) || !/<main\b/i.test(html)) throw new Error('AI ecosystem projection requires a complete HTML page with <main>');
  if (!html.includes('id="bg-ai-ecosysteem-style"')) html=html.replace(/<\/head>/i, STYLE+'\n</head>');
  if (!html.includes('data-section="ai-ecosysteem"')) {
    const mainIndex=html.search(/<main\b/i);
    const closeIndex=html.indexOf('</section>',mainIndex);
    if (closeIndex>=0) {
      const at=closeIndex+'</section>'.length;
      html=html.slice(0,at)+'\n'+SECTION+'\n'+html.slice(at);
    } else {
      html=html.replace(/<\/main>/i, SECTION+'\n</main>');
    }
  }
  if (!html.includes('data-bg-ai-ecosysteem-nav') && !/href=["']\/ai-ecosysteem["']/.test(html.slice(0, html.search(/<main\b/i)))) {
    html=html.replace(/<a\b([^>]*href=["']\/systemen-koppelen["'][^>]*)>/i,'<a data-bg-ai-ecosysteem-nav href="/ai-ecosysteem">AI-ecosysteem</a><a$1>');
  }
  if (!html.includes('href="/ai-ecosysteem"')) throw new Error('AI ecosystem projection did not create a public route link');
  return html;
}

export async function applyAiEcosystemProposition(file='index.html') {
  const html=await readFile(file,'utf8');
  const next=applyAiEcosystemPropositionHtml(html);
  await writeFile(file,next,'utf8');
  return {file,changed:next!==html,hasSection:next.includes('data-section="ai-ecosysteem"'),hasLink:next.includes('href="/ai-ecosysteem"')};
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g,'/'))) {
  console.log(JSON.stringify(await applyAiEcosystemProposition()));
}
