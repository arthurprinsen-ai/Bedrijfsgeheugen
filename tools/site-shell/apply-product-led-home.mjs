import { readFile, writeFile } from 'node:fs/promises';

const files = ['index.html','prototype-v18-stable.html'];
const marker = 'data-bg-product-led-home-v1';

const section = `
<section class="pgl" ${marker} aria-labelledby="pgl-title">
  <style>
    .pgl{padding:72px 20px;background:#0b1220;color:#fff}
    .pgl *{box-sizing:border-box}
    .pgl-in{max-width:1180px;margin:0 auto}
    .pgl-head{max-width:850px;margin:0 auto 34px;text-align:center}
    .pgl-eyebrow{display:inline-flex;padding:7px 12px;border:1px solid rgba(255,255,255,.22);border-radius:999px;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#ffe86b}
    .pgl h2{margin:16px 0 14px;font-size:clamp(2rem,4.6vw,4.25rem);line-height:1.02;letter-spacing:-.045em;color:#fff}
    .pgl-lead{margin:0 auto;max-width:760px;font-size:clamp(1rem,1.8vw,1.25rem);line-height:1.6;color:#cbd5e1}
    .pgl-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
    .pgl-card{display:flex;flex-direction:column;min-height:310px;padding:26px;border:1px solid rgba(255,255,255,.15);border-radius:22px;background:linear-gradient(145deg,rgba(255,255,255,.095),rgba(255,255,255,.035));box-shadow:0 18px 48px rgba(0,0,0,.18)}
    .pgl-card-kicker{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#ffe86b}
    .pgl-card h3{margin:10px 0 12px;font-size:1.65rem;letter-spacing:-.025em;color:#fff}
    .pgl-card p{margin:0 0 22px;color:#cbd5e1;line-height:1.65}
    .pgl-card a{margin-top:auto;color:#fff;font-weight:800;text-decoration:none}
    .pgl-card a:hover{text-decoration:underline;text-underline-offset:4px}
    .pgl-flow{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;margin:28px 0 0;padding:16px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(255,255,255,.04)}
    .pgl-flow span{font-size:13px;font-weight:750;color:#e2e8f0}
    .pgl-flow i{font-style:normal;color:#ffe86b}
    .pgl-trust{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:18px;padding:22px 24px;border-radius:18px;background:#fff;color:#14171a}
    .pgl-trust-copy b{display:block;font-size:1.05rem}
    .pgl-trust-copy span{display:block;margin-top:4px;color:#5c646e;font-size:.92rem}
    .pgl-logos{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
    .pgl-logo{padding:9px 12px;border:1px solid #dcdfe6;border-radius:10px;background:#fbfaf7;font-size:.82rem;font-weight:800;white-space:nowrap}
    .pgl-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:26px}
    .pgl-btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 18px;border-radius:12px;background:#ffe86b;color:#14171a!important;font-weight:800;text-decoration:none}
    .pgl-btn.secondary{background:transparent;color:#fff!important;border:1px solid rgba(255,255,255,.32)}
    @media(max-width:900px){.pgl-grid{grid-template-columns:1fr}.pgl-card{min-height:0}.pgl-trust{align-items:flex-start;flex-direction:column}.pgl-logos{justify-content:flex-start}}
    @media(max-width:600px){.pgl{padding:52px 16px}.pgl-card{padding:22px}.pgl-flow{justify-content:flex-start}.pgl h2{text-align:left}.pgl-head{text-align:left}}
  </style>
  <div class="pgl-in">
    <div class="pgl-head">
      <span class="pgl-eyebrow">Powerhouse · één platform</span>
      <h2 id="pgl-title">Je bedrijf hoeft niet méér software. Het heeft één brein nodig.</h2>
      <p class="pgl-lead">Powerhouse verbindt wat je bedrijf weet, ziet en wil bereiken — en zet dat om in beslissingen en acties.</p>
    </div>

    <div class="pgl-grid">
      <article class="pgl-card">
        <span class="pgl-card-kicker">Zien &amp; begrijpen</span>
        <h3>Powerhouse Intelligence</h3>
        <p>Brengt bedrijfsdata, kennis, benchmarks en externe signalen samen tot één actueel beeld van wat er speelt en waar de grootste kans ligt.</p>
        <a href="/product">Bekijk Intelligence →</a>
      </article>
      <article class="pgl-card">
        <span class="pgl-card-kicker">Beslissen &amp; doen</span>
        <h3>Powerhouse Agents</h3>
        <p>Zet inzichten om in concrete acties voor sales, operations, finance, HR en management — binnen duidelijke guardrails en met bewijs van wat er is gebeurd.</p>
        <a href="/ai-ecosysteem">Bekijk Agents →</a>
      </article>
      <article class="pgl-card">
        <span class="pgl-card-kicker">Verbinden &amp; automatiseren</span>
        <h3>Powerhouse Connect</h3>
        <p>Laat AFAS, Exact, Microsoft 365 en andere systemen samenwerken, zodat informatie één keer wordt vastgelegd en daarna doorstroomt.</p>
        <a href="/systemen-koppelen">Bekijk Connect →</a>
      </article>
    </div>

    <div class="pgl-flow" aria-label="Powerhouse closed loop">
      <span>Data</span><i>→</i><span>Context</span><i>→</i><span>Intelligence</span><i>→</i><span>Beslissing</span><i>→</i><span>Actie</span><i>→</i><span>Bewijs</span><i>→</i><span>Leren</span>
    </div>

    <div class="pgl-trust">
      <div class="pgl-trust-copy">
        <b>Werkt bovenop de systemen die je al hebt.</b>
        <span>Geen rip-and-replace. Powerhouse verbindt de bestaande werkelijkheid en maakt die bestuurbaar.</span>
      </div>
      <div class="pgl-logos" aria-label="Ondersteunde ecosystemen">
        <span class="pgl-logo">AFAS</span><span class="pgl-logo">Exact</span><span class="pgl-logo">Microsoft 365</span><span class="pgl-logo">API</span>
      </div>
    </div>

    <div class="pgl-actions">
      <a class="pgl-btn" href="/zelfscan">Start gratis met je Bedrijfslek-scan →</a>
      <a class="pgl-btn secondary" href="/product">Bekijk Powerhouse</a>
    </div>
  </div>
</section>`;

for (const file of files) {
  let html = await readFile(file,'utf8');
  if (html.includes(marker)) continue;
  const mainOpen = html.search(/<main\b[^>]*>/i);
  if (mainOpen < 0) throw new Error(`No <main> found in ${file}`);
  const mainTagEnd = html.indexOf('>', mainOpen) + 1;
  const firstSectionEnd = html.indexOf('</section>', mainTagEnd);
  const insertAt = firstSectionEnd >= 0 ? firstSectionEnd + '</section>'.length : mainTagEnd;
  html = html.slice(0, insertAt) + '\n' + section + '\n' + html.slice(insertAt);
  await writeFile(file, html, 'utf8');
}
console.log('Powerhouse product-led homepage architecture applied');
