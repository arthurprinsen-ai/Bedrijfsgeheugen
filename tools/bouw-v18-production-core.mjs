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
// Eigen video uit OpenArt, in de repo en op iPhone getest (assets/openart-hero-production.json).
// Stond eerder op een pexels-bestand; die werd bij elke build teruggezet.
const HERO_URL = '/assets/openart-hero-iphone-safe-v1.mp4';
const HERO_ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const LEGAL_FOOTER_LINKS = `<span class="bg-footer-legal-links"><a href="https://www.bedrijfsgeheugen.nl/gebruiksvoorwaarden">Algemene gebruiksvoorwaarden</a><a href="https://www.bedrijfsgeheugen.nl/privacy">Privacybeleid</a><a href="https://www.bedrijfsgeheugen.nl/cookiebeleid">Cookiebeleid</a><a href="https://www.bedrijfsgeheugen.nl/systeemstatus">Systeemstatus</a></span>`;
const LEGAL_FOOTER_STYLE = `<style id="bg-footer-legal-links-contract">
footer[data-bg-component="footer"] .legal{gap:.65rem 1.25rem;align-items:center;flex-wrap:wrap}
footer[data-bg-component="footer"] .bg-footer-legal-links{display:flex;flex-wrap:wrap;gap:.35rem 1rem}
footer[data-bg-component="footer"] .bg-footer-legal-links a{color:inherit;text-decoration:none}
footer[data-bg-component="footer"] .bg-footer-legal-links a:hover{color:#fff;text-decoration:underline}
@media(max-width:760px){footer[data-bg-component="footer"] .bg-footer-legal-links{width:100%}}
</style>`;
const sha256 = value => createHash('sha256').update(value).digest('hex');

const parts = await Promise.all(FILES.map(path => readFile(path, 'utf8')));
const base64 = parts.join('').replace(/\s+/g, '');
if (base64.length !== EXPECTED_BASE64_LENGTH) throw new Error(`V18 payload length ${base64.length}, expected ${EXPECTED_BASE64_LENGTH}`);
if (sha256(base64) !== EXPECTED_BASE64_SHA256) throw new Error(`V18 payload integrity mismatch: ${sha256(base64)}`);
let html = gunzipSync(Buffer.from(base64, 'base64')).toString('utf8');
if (sha256(html) !== EXPECTED_HTML_SHA256) throw new Error(`V18 HTML integrity mismatch: ${sha256(html)}`);

// Canonical navigation contract: "Platform" is the product proposition.
// Repair the historical pinned mobile route before generated HTML is written.
let platformRouteRepairs = 0;
html = html.replace(
  /<a\b[^>]*\bhref=(["'])(?:https:\/\/www\.bedrijfsgeheugen\.nl)?\/bedrijfsgeheugen\1[^>]*>[\s\S]*?<\/a>/gi,
  anchor => {
    const visibleLabel = anchor.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (visibleLabel.toLowerCase() !== 'platform') return anchor;
    platformRouteRepairs += 1;
    return anchor.replace(
      /href=(["'])(?:https:\/\/www\.bedrijfsgeheugen\.nl)?\/bedrijfsgeheugen\1/i,
      'href=$1/product$1'
    );
  }
);
if (platformRouteRepairs < 1) throw new Error('Canonical mobile Platform route repair point not found');

const resourceHints = `<link rel="dns-prefetch" href="//videos.pexels.com">\n<link rel="preconnect" href="${HERO_ORIGIN}">`;
if (!html.includes(`rel="preconnect" href="${HERO_ORIGIN}"`)) {
  html = html.replace('</head>', `${resourceHints}\n</head>`);
}

const video = `<video id="heroBackgroundVideo" class="hero-bg-video" autoplay muted playsinline loop preload="auto" aria-hidden="true">
  <source src="${HERO_URL}" type="video/mp4">
</video>`;

html = html.replace(/<video[^>]*id="heroBackgroundVideo"[^>]*>[\s\S]*?<\/video>/, video);
html = html.replace(/<img[^>]*id="heroBackgroundMotion"[^>]*>/, video);
html = html.replace(/<button[^>]*id="heroVideoFallback"[^>]*>[\s\S]*?<\/button>\s*/, '');
html = html.replace(/<script id="v18-4-video-controller">[\s\S]*?<\/script>\s*/, '');
html = html.replace(/<style id="v18-10-video-fix">[\s\S]*?<\/style>\s*<script id="v18-10-video-controller">[\s\S]*?<\/script>\s*/, '');
html = html.replace(/<script id="v18-stable-video-controller">[\s\S]*?<\/script>\s*/, '');

// De pinned V18-payload is de echte productiebron voor de homepage en dus ook
// voor de sitebrede footer. Repository-HTML wordt vóór publicatie hiermee
// overschreven; juridische links moeten daarom hier in de canonical payload-
// projectie worden geborgd in plaats van alleen in index.html/over-ons.html.
if (!html.includes('class="bg-footer-legal-links"')) {
  const before = html;
  html = html.replace(
    /(<div class="legal">[\s\S]*?<span>Voor het Nederlandse mkb · kennis · processen · systemen · AI<\/span>)(<\/div>)/,
    `$1${LEGAL_FOOTER_LINKS}$2`
  );
  if (html === before) throw new Error('V18 canonical footer legal-link insertion point not found');
}
if (!html.includes('id="bg-footer-legal-links-contract"')) html = html.replace('</head>', `${LEGAL_FOOTER_STYLE}\n</head>`);

html = html.replace('url("https://images.pexels.com/videos/35402271/pexels-photo-35402271.jpeg?auto=compress&cs=tinysrgb&w=1920") center/cover no-repeat', 'linear-gradient(rgba(10,17,23,1),rgba(10,17,23,1)) center/cover no-repeat');
html = html.replace('url("https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1600") center/cover no-repeat', 'linear-gradient(rgba(10,17,23,1),rgba(10,17,23,1)) center/cover no-repeat');

const style = `<style id="v18-stable-video-fix">
.hero-video{background:#dbe7ee;overflow:hidden;position:relative}
.hero-bg-video{display:block!important;opacity:1!important;visibility:visible!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center center!important;background:#dbe7ee;filter:brightness(1.06) saturate(.96);pointer-events:none}
@media(max-width:768px){.hero-bg-video{object-position:center center!important}}
</style>`;

// Visual contract for the actual V18 "Meer" mega menu, not the legacy .bgkop dropdown.
// The whole ordinary menu link (title + description) must stay black and bold on the white panel.
// The dark promotional card on the right is deliberately excluded so its white-on-dark styling stays intact.
const megaMenuContrastContract = `<style id="v18-megamenu-contrast-contract">
[data-bg-megamenu-heading]{color:#000!important;font-weight:800!important}
[data-bg-megamenu-link],[data-bg-megamenu-link] *{color:#000!important;font-weight:700!important}
.v17-solutions-mega .v17-mega-route,.v17-solutions-mega .v17-mega-route b{color:#14171a}
/* Het Meer-paneel is één sitebreed component. Pagina-CSS of de positie van
   de Meer-trigger mag de breedte/centrering niet veranderen. Op desktop
   centreert het paneel daarom op de viewport en gebruikt het exact dezelfde
   leesbreedte op iedere route. */
@media(min-width:1101px){
  [data-bg-megamenu-root="true"]{
    position:fixed!important;
    left:50vw!important;
    right:auto!important;
    top:var(--bg-megamenu-top,160px)!important;
    transform:translateX(-50%)!important;
    width:min(1190px,calc(100vw - 32px))!important;
    max-width:calc(100vw - 32px)!important;
    box-sizing:border-box!important;
  }
}
</style>
<script id="v18-megamenu-contrast-marker">
(function(){
  var LABELS=['BEDRIJF','KENNIS','VERTROUWEN','SUPPORT'];
  function norm(value){return String(value||'').replace(/\\s+/g,' ').trim().toUpperCase();}
  function hasMenuContract(node){
    var text=norm(node&&node.textContent);
    if(text.indexOf('MENSEN EERST. DAN TECHNIEK.')===-1||text.indexOf('VOLLEDIGE WEBSITEKAART')===-1)return false;
    for(var i=0;i<LABELS.length;i+=1)if(text.indexOf(LABELS[i])===-1)return false;
    return true;
  }
  function findMenuRoot(){
    var headings=document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]');
    for(var i=0;i<headings.length;i+=1){
      if(norm(headings[i].textContent)!=='BEDRIJF')continue;
      var node=headings[i].parentElement;
      while(node&&node!==document.body&&node!==document.documentElement){
        if(hasMenuContract(node))return node;
        node=node.parentElement;
      }
    }
    return null;
  }
  function isPromoLink(link){var text=norm(link.textContent);return text.indexOf('MENSEN EERST. DAN TECHNIEK.')!==-1||text.indexOf('BEDRIJFSGEHEUGEN')!==-1;}
  function apply(){
    var root=findMenuRoot();
    if(!root)return;
    root.setAttribute('data-bg-megamenu-root','true');
    function syncGeometry(){
      var header=root.closest('header')||document.querySelector('header.v17-header');
      if(!header)return;
      root.style.setProperty('--bg-megamenu-top',Math.round(header.getBoundingClientRect().bottom)+'px');
    }
    syncGeometry();
    if(root.getAttribute('data-bg-megamenu-geometry-bound')!=='true'){
      root.setAttribute('data-bg-megamenu-geometry-bound','true');
      addEventListener('resize',syncGeometry,{passive:true});
      addEventListener('scroll',syncGeometry,{passive:true});
    }
    var headings=root.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]');
    for(var i=0;i<headings.length;i+=1){var heading=headings[i];if(LABELS.indexOf(norm(heading.textContent))!==-1)heading.setAttribute('data-bg-megamenu-heading','true');}
    var links=root.querySelectorAll('a');
    for(var j=0;j<links.length;j+=1){var link=links[j];if(!isPromoLink(link))link.setAttribute('data-bg-megamenu-link','true');}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
})();
</script>`;

// Canonieke CMS-shellgeometrie: iedere publieke route gebruikt exact dezelfde
// desktop-/tabletbreedte en vaste navigatiehoogte. Pagina-CSS mag deze chrome
// niet per route laten driften. Mobiel houdt dezelfde gutter-logica.
const canonicalChromeGeometryContract = `<style id="v18-canonical-chrome-geometry">
:root{--bg-shell-max:1220px;--bg-shell-gutter:20px;--bg-nav-height:72px}
header.v17-header .v17-nav,
footer[data-bg-component="footer"]>.wrap,
.bg-uniform-trust>.bg-uniform-trust-in{
  width:min(var(--bg-shell-max),calc(100% - (2 * var(--bg-shell-gutter))))!important;
  max-width:var(--bg-shell-max)!important;
  margin-left:auto!important;
  margin-right:auto!important;
  box-sizing:border-box!important;
}
header.v17-header .v17-nav{
  height:var(--bg-nav-height)!important;
  min-height:var(--bg-nav-height)!important;
  max-height:var(--bg-nav-height)!important;
}
header.v17-header .v17-navlinks{align-items:center!important}
header.v17-header .v17-nav>.brand,
header.v17-header .v17-nav>.login,
header.v17-header .v17-nav>.cta,
header.v17-header .v17-nav>.mobile-toggle{flex-shrink:0}
header.v17-header .mega{
  box-sizing:border-box!important;
}
@media(min-width:1101px){
  header.v17-header .v17-solutions-mega{
    width:850px!important;
    max-width:min(850px,calc(100vw - 32px))!important;
  }
  header.v17-header [data-bg-megamenu-root="true"]{
    width:min(1190px,calc(100vw - 32px))!important;
    max-width:min(1190px,calc(100vw - 32px))!important;
  }
}
@media(max-width:680px){
  :root{--bg-shell-gutter:12px}
}
</style>`;

// De cyaan productkaart kreeg via --cyan de merkkleur #2742D6, met donkere
// tekst erop (contrast ±2,9:1). Tekst en knop op die kaart worden wit.
const productkaartContrast = `<style id="bg-productkaart-contrast">.service-product-card.cyan{color:#fff}.service-product-card.cyan p{color:rgba(255,255,255,.86)}</style>`;

html = html.replace('</head>', `${canonicalChromeGeometryContract}\n</head>`);
html = html.replace('</body>', `${style}\n${megaMenuContrastContract}\n${productkaartContrast}\n</body>`);

await writeFile('prototype-v18-stable.html', html, 'utf8');
await writeFile('index.html', html, 'utf8');
console.log(`Accepted historical V18 production homepage restored from pinned payload: ${EXPECTED_HTML_SHA256}`);