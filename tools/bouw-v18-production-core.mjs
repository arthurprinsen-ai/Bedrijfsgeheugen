import { readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const FILES = [
  'v18-full/chunk-00.txt','v18-full/chunk-gap.txt','v18-full/chunk-01.txt','v18-full/chunk-02.txt',
  'v18-full/chunk-03-0.txt','v18-full/chunk-03-1a.txt','v18-full/chunk-03-1b.txt','v18-full/chunk-03-2.txt',
  'v18-full/chunk-03-3.txt','v18-full/chunk-03-4.txt','v18-full/chunk-03-5a0.txt','v18-full/chunk-03-5a1.txt','v18-full/chunk-03-5b.txt',
  'v18-full/chunk-04.txt','v18-full/chunk-05.txt','v18-full/chunk-06.txt'
];
const EXPECTED_BASE64_LENGTH = 108484;
const EXPECTED_BASE64_SHA256 = '64c33847585fb3d93e3a4bbe8bfd33aee5221678a047f613f6144330f69e305b';
const EXPECTED_HTML_SHA256 = 'be938e95870994b89773d141a400318a1be3eac4829d69aac6bac48942bd230b';
const HERO_VIDEO_URL = '/assets/openart-hero-iphone-safe-v1.mp4';
const HERO_POSTER_URL = '/og-image.png';
const LEGACY_PEOPLE_IMAGE = 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1600';
const sha256 = value => createHash('sha256').update(value).digest('hex');

const parts = await Promise.all(FILES.map(path => readFile(path, 'utf8')));
const base64 = parts.join('').replace(/\s+/g, '');
if (base64.length !== EXPECTED_BASE64_LENGTH) throw new Error(`V18 payload length ${base64.length}, expected ${EXPECTED_BASE64_LENGTH}`);
if (sha256(base64) !== EXPECTED_BASE64_SHA256) throw new Error(`V18 payload integrity mismatch: ${sha256(base64)}`);
let html = gunzipSync(Buffer.from(base64, 'base64')).toString('utf8');
if (sha256(html) !== EXPECTED_HTML_SHA256) throw new Error(`V18 HTML integrity mismatch: ${sha256(html)}`);
if (!html.includes('id="v18-4-video-controller"')) throw new Error('Canonical proven V18 controller missing');

const heroMatch = html.match(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/);
if (!heroMatch) throw new Error('Canonical hero video element missing');
let hero = heroMatch[0];
if (/poster="[^"]*"/.test(hero)) hero = hero.replace(/poster="[^"]*"/, `poster="${HERO_POSTER_URL}"`);
else hero = hero.replace('<video', `<video poster="${HERO_POSTER_URL}"`);
hero = hero.replace(/<source\s+src="[^"]+"\s+type="video\/mp4"\s*\/?>/, `<source src="${HERO_VIDEO_URL}" type="video/mp4">`);
if (!hero.includes(HERO_VIDEO_URL)) throw new Error('Local hero media swap failed');
html = html.replace(heroMatch[0], hero).split(LEGACY_PEOPLE_IMAGE).join(HERO_POSTER_URL);

// Preview-only crawler blocks are forbidden on production.
html = html.replace(/<meta\s+name=["']robots["'][^>]*>/gi, '');
const canonical = '<link rel="canonical" href="https://bedrijfsgeheugen.nl/">';
if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonical);
else html = html.replace('</head>', `  <meta name="robots" content="index,follow">\n  ${canonical}\n</head>`);
if (!/name=["']robots["']/i.test(html)) html = html.replace('</head>', '  <meta name="robots" content="index,follow">\n</head>');

const mobileNavStyles = '\n<link rel="stylesheet" href="/assets/v18-mobile-drilldown.css?v=1">';
html = html.replace('</head>', `${mobileNavStyles}\n</head>`);

const mobileNav = `
<div id="bgMobileNav" aria-hidden="true" aria-label="Mobiele hoofdnavigatie">
  <div class="bg-mobile-shell">
    <div class="bg-mobile-brandline"><span class="bg-mobile-kicker">Bedrijfsgeheugen</span></div>

    <div class="bg-mobile-view" data-bg-mobile-view="root">
      <button class="bg-mobile-row" type="button" data-bg-mobile-target="oplossingen">Oplossingen <span class="bg-mobile-arrow" aria-hidden="true">→</span></button>
      <button class="bg-mobile-row" type="button" data-bg-mobile-target="bedrijfsgeheugen">Bedrijfsgeheugen <span class="bg-mobile-arrow" aria-hidden="true">→</span></button>
      <button class="bg-mobile-row" type="button" data-bg-mobile-target="koppelingen">Koppelingen <span class="bg-mobile-arrow" aria-hidden="true">→</span></button>
      <button class="bg-mobile-row" type="button" data-bg-mobile-target="kennis">Kennis <span class="bg-mobile-arrow" aria-hidden="true">→</span></button>
      <a class="bg-mobile-row" href="/over-ons">Over ons <span class="bg-mobile-arrow" aria-hidden="true">→</span></a>
      <a class="bg-mobile-row" href="/expertises">Alle expertises <span class="bg-mobile-arrow" aria-hidden="true">→</span></a>
      <a class="bg-mobile-cta" href="/frisse-blik">Plan een Frisse blik →</a>
      <div class="bg-mobile-meta">Vaste prijs · In twee weken draaiend · Voor het Nederlandse mkb</div>
    </div>

    <div class="bg-mobile-view" data-bg-mobile-view="oplossingen" hidden>
      <div class="bg-mobile-subtitle"><button class="bg-mobile-back" type="button" data-bg-mobile-back aria-label="Terug">← Terug</button><h2>Oplossingen</h2></div>
      <a class="bg-mobile-link" href="/systemen-koppelen"><span>Systemen koppelen<small>Twee pakketten laten praten, zonder overtypen</small></span><span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/ai-adoptie"><span>AI &amp; governance<small>Verantwoord aan de slag, met afspraken die gelden</small></span><span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/ai-marketing-mkb"><span>AI-marketing<small>Zichtbaar blijven zonder er elke week tijd in te steken</small></span><span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/due-diligence"><span>Due diligence &amp; exit<small>Wat weet dit bedrijf, en wat als de eigenaar wegloopt</small></span><span aria-hidden="true">→</span></a>
    </div>

    <div class="bg-mobile-view" data-bg-mobile-view="bedrijfsgeheugen" hidden>
      <div class="bg-mobile-subtitle"><button class="bg-mobile-back" type="button" data-bg-mobile-back aria-label="Terug">← Terug</button><h2>Bedrijfsgeheugen</h2></div>
      <a class="bg-mobile-link" href="/bedrijfsgeheugen"><span>Wat is een bedrijfsgeheugen?<small>Waar het over gaat, in gewone taal</small></span><span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/product"><span>Het portaal<small>Waar alles doorheen loopt en zichtbaar blijft</small></span><span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/frisse-blik"><span>Frisse blik<small>In 30 minuten zien waar de grootste kansen liggen</small></span><span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/zelfscan"><span>Zelfscan<small>Zeven vragen over waar kennis bij jou weglekt</small></span><span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/ai-scan"><span>AI-scan<small>Waar levert AI bij jou echt iets op</small></span><span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/afmaakindex"><span>De Afmaakindex<small>Wat draait er nog van vorig jaar</small></span><span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/monitor"><span>Bedrijfsgeheugen-index<small>Meet in tien minuten wat overtypen je kost</small></span><span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/benchmark"><span>Benchmark<small>Hoe je scoort naast vergelijkbare bedrijven</small></span><span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/hoe-het-werkt"><span>Hoe het werkt<small>Een handeling per keer, vaste prijs, geen traject</small></span><span aria-hidden="true">→</span></a>
    </div>

    <div class="bg-mobile-view" data-bg-mobile-view="koppelingen" hidden>
      <div class="bg-mobile-subtitle"><button class="bg-mobile-back" type="button" data-bg-mobile-back aria-label="Terug">← Terug</button><h2>Koppelingen</h2></div>
      <a class="bg-mobile-link" href="/afas-koppeling">AFAS-koppeling <span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/exact-online-koppeling">Exact Online <span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/twinfield-koppeling">Twinfield <span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/webshop-koppeling">Webshop koppelen <span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/api-koppeling-laten-maken">API-koppeling laten maken <span aria-hidden="true">→</span></a>
    </div>

    <div class="bg-mobile-view" data-bg-mobile-view="kennis" hidden>
      <div class="bg-mobile-subtitle"><button class="bg-mobile-back" type="button" data-bg-mobile-back aria-label="Terug">← Terug</button><h2>Kennis</h2></div>
      <a class="bg-mobile-link" href="/blog/">Blog <span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/ai-act">AI Act <span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/data-soevereiniteit">Data-soevereiniteit <span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/ai-in-bi">AI in business intelligence <span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/ai-in-data-engineering">AI in data engineering <span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/monitor">Bedrijfsgeheugen-index <span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/ai-capability-model">AI-capabilitymodel <span aria-hidden="true">→</span></a>
      <a class="bg-mobile-link" href="/begrippen">Begrippenlijst <span aria-hidden="true">→</span></a>
    </div>
  </div>
</div>`;

const menuStateScript = '\n<script src="/assets/js/v18-menu-state.js?v=1" defer></script>';
const mobileDrilldownScript = '\n<script src="/assets/js/v18-mobile-drilldown.js?v=1" defer></script>';
const productionMarker = `\n<script id="bg-production-v18-marker">window.__BG_PRODUCTION_VERSION__='V18.8';</script>`;
html = html.replace('</body>', `${mobileNav}${menuStateScript}${mobileDrilldownScript}${productionMarker}\n</body>`);

if (/noindex|nofollow/i.test(html.match(/<head>[\s\S]*?<\/head>/i)?.[0] || '')) throw new Error('Production homepage still contains crawler blocking metadata');
if (!html.includes(HERO_VIDEO_URL)) throw new Error('Production homepage does not reference accepted local hero media');
if (!html.includes('/assets/js/v18-menu-state.js?v=1')) throw new Error('V18 menu state layer missing');
if (!html.includes('id="bgMobileNav"')) throw new Error('Mobile drilldown navigation missing');
if (!html.includes('/assets/js/v18-mobile-drilldown.js?v=1')) throw new Error('Mobile drilldown script missing');
if (!html.includes('/assets/v18-mobile-drilldown.css?v=1')) throw new Error('Mobile drilldown stylesheet missing');

await writeFile('prototype-v18-stable.html', html, 'utf8');
await writeFile('index.html', html, 'utf8');
console.log('V18.8 production homepage built deterministically from pinned payload');
