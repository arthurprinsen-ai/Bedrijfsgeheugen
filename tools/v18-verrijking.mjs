// Interactie, mensen en vindbaarheid — voor elke pagina gelijk.
//
// Drie dingen:
// 1. beweging: onderdelen komen op bij het scrollen, kaarten en knoppen reageren op de muis
// 2. mensen: een gezicht bij het verhaal, want daar kijken bezoekers naar
// 3. vindbaarheid: kruimelpad, vragen, artikel en organisatie als schema, zodat
//    Google en AI-antwoordmachines weten wat er op de pagina staat

export const INTERACTIE_CSS = `<style id="v18-interactie"> html.bgx-beweegt [data-op]{opacity:0;transform:translateY(20px);transition:opacity .7s cubic-bezier(.22,.61,.36,1),transform .7s cubic-bezier(.22,.61,.36,1)}html.bgx-beweegt [data-op].bgx-zichtbaar{opacity:1;transform:none}html.bgx-beweegt [data-op]:nth-child(2){transition-delay:.05s}html.bgx-beweegt [data-op]:nth-child(3){transition-delay:.1s}html.bgx-beweegt [data-op]:nth-child(4){transition-delay:.15s}@media(prefers-reduced-motion:reduce){html.bgx-beweegt [data-op]{opacity:1;transform:none;transition:none}}@media(hover:none){.inhoud-body .kaart:active,.inhoud-body .p-kaart:active,.inhoud-body .tegel:active,.inhoud-body .blok:active,.inhoud-body .stap:active,.bgx-staptegel:active{transform:scale(.985)}}.inhoud-body .kaart,.inhoud-body .p-kaart,.inhoud-body .tegel,.inhoud-body .blok,.inhoud-body .stap{transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease}.inhoud-body .kaart:hover,.inhoud-body .p-kaart:hover,.inhoud-body .tegel:hover,.inhoud-body .blok:hover,.inhoud-body .stap:hover{transform:translateY(-4px);box-shadow:0 30px 80px rgba(7,21,35,.16);border-color:rgba(39,66,214,.35)}.inhoud-body .btn,.inhoud-body .knop,.inhoud-body a.cta{transition:transform .18s ease,box-shadow .18s ease,background .18s ease}.inhoud-body .btn:hover,.inhoud-body .knop:hover,.inhoud-body a.cta:hover{transform:translateY(-2px);box-shadow:0 14px 34px rgba(7,21,35,.18)}.inhoud-body p a{background-image:linear-gradient(var(--blue),var(--blue));background-size:0% 2px;background-position:0 100%;background-repeat:no-repeat;transition:background-size .3s ease;text-decoration:none;padding-bottom:2px}.inhoud-body p a:hover{background-size:100% 2px}.inhoud-body tbody tr{transition:background .2s ease}.inhoud-body tbody tr:hover{background:rgba(39,66,214,.05)}.bgx-vraag{width:100%;text-align:left;background:none;border:0;padding:0;font:inherit;font-weight:750;color:var(--ink);display:flex;justify-content:space-between;gap:16px;align-items:center;cursor:pointer}.bgx-vraag::after{content:"+";font-size:22px;color:var(--blue);transition:transform .25s ease}.bgx-vraag[aria-expanded=true]::after{transform:rotate(45deg)}.bgx-antwoord{overflow:hidden;max-height:0;transition:max-height .3s ease}.bgx-antwoord[data-open=ja]{max-height:900px}.bgx-opdezepagina{position:sticky;top:88px;float:right;width:230px;margin:0 0 24px 32px;padding:16px 18px;background:var(--white);border:1px solid var(--line);border-radius:18px;font-size:14px;box-shadow:var(--shadow)}.bgx-opdezepagina b{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px}.bgx-opdezepagina a{display:block;padding:5px 0;color:var(--ink2);text-decoration:none;border-left:2px solid transparent;padding-left:10px}.bgx-opdezepagina a:hover{color:var(--blue)}.bgx-opdezepagina a.bgx-hier{color:var(--blue);border-left-color:var(--blue);font-weight:700}@media(max-width:1100px){.bgx-opdezepagina{display:none}}.bgx-mensen{max-width:none!important;display:flex;gap:22px;align-items:center;margin:56px 0 0;padding:26px;background:var(--white);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow)}.bgx-mensen img{width:96px;height:96px;border-radius:50%;object-fit:cover;flex-shrink:0;margin:0}.bgx-mensen .bgx-wie{font-weight:800;font-size:18px}.bgx-mensen .bgx-wat{color:var(--muted);font-size:15px;margin:2px 0 8px}.bgx-mensen p{margin:0;font-size:16px}@media(max-width:600px){.bgx-mensen{flex-direction:column;text-align:center}}.bgx-omhoog{position:fixed;right:18px;bottom:18px;z-index:70;width:46px;height:46px;border-radius:50%;border:1px solid var(--line);background:var(--white);color:var(--ink);font-size:20px;cursor:pointer;opacity:0;pointer-events:none;transition:opacity .3s ease,transform .2s ease;box-shadow:var(--shadow)}.bgx-omhoog.bgx-zichtbaar{opacity:1;pointer-events:auto}.bgx-omhoog:hover{transform:translateY(-3px)}.bgx-leesbalk{position:fixed;top:0;left:0;height:3px;width:0;background:var(--blue);z-index:100;transition:width .1s linear}</style>`;

export const INTERACTIE_JS = `<script id="v18-interactie-js">
(function(){
  var wortel = document.documentElement;
  var rustig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stukken = [].slice.call(document.querySelectorAll('[data-op]'));

  function toon(el){ el.classList.add('bgx-zichtbaar'); }
  function toonAlles(){ stukken.forEach(toon); }

  if (!stukken.length || rustig || !('IntersectionObserver' in window)) {
    toonAlles();
  } else {
    // pas nu verbergen: zonder script blijft alles gewoon zichtbaar
    wortel.classList.add('bgx-beweegt');

    var kijker = new IntersectionObserver(function(waarnemingen){
      waarnemingen.forEach(function(w){ if (w.isIntersecting) { toon(w.target); kijker.unobserve(w.target); } });
    }, { threshold: .08, rootMargin: '0px 0px -4% 0px' });
    stukken.forEach(function(el){ kijker.observe(el); });

    // Vangnet 1 — in een ingebedde weergave scrollt niet het document maar een
    // omhullende laag; de waarnemer merkt dat niet. Daarom ook zelf meten.
    function meet(){
      var hoogte = window.innerHeight || 800;
      stukken.forEach(function(el){
        if (el.classList.contains('bgx-zichtbaar')) return;
        var r = el.getBoundingClientRect();
        if (r.top < hoogte * 0.94 && r.bottom > 0) toon(el);
      });
    }
    document.addEventListener('scroll', meet, true);
    addEventListener('resize', meet);
    meet();

    // Vangnet 2 — is er na anderhalve seconde nog niets onthuld, dan klopt er
    // iets niet en gaat alles alsnog aan. Inhoud die niemand ziet is erger dan
    // inhoud zonder beweging.
    setTimeout(function(){
      var zichtbaar = stukken.filter(function(el){ return el.classList.contains('bgx-zichtbaar'); }).length;
      if (!zichtbaar) toonAlles();
    }, 1500);
  }

  document.querySelectorAll('.bgx-vraag').forEach(function(knop){
    knop.addEventListener('click', function(){
      var open = knop.getAttribute('aria-expanded') === 'true';
      knop.setAttribute('aria-expanded', open ? 'false' : 'true');
      var antwoord = knop.nextElementSibling;
      if (antwoord) antwoord.setAttribute('data-open', open ? 'nee' : 'ja');
    });
  });

  var balk = document.querySelector('.bgx-leesbalk');
  var omhoog = document.querySelector('.bgx-omhoog');
  function bijScroll(){
    var top = scrollY || document.documentElement.scrollTop || 0;
    if (balk) {
      var hoogte = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
      balk.style.width = Math.min(100, Math.max(0, top / hoogte * 100)) + '%';
    }
    if (omhoog) omhoog.classList.toggle('bgx-zichtbaar', top > 700);
    var koppen = document.querySelectorAll('.inhoud-body h2[id]');
    var actief = null;
    koppen.forEach(function(k){ if (k.getBoundingClientRect().top < 160) actief = k.id; });
    document.querySelectorAll('.bgx-opdezepagina a').forEach(function(a){
      a.classList.toggle('bgx-hier', a.getAttribute('href') === '#' + actief);
    });
  }
  document.addEventListener('scroll', bijScroll, true);
  bijScroll();
  if (omhoog) omhoog.addEventListener('click', function(){ scrollTo({ top: 0, behavior: rustig ? 'auto' : 'smooth' }); });
})();
</script>`;

const ontsnap = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const kaal = t => String(t).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function slug(tekst) {
  return kaal(tekst).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

// ── de inhoud laten bewegen en de vragen laten uitklappen ─────────────────
export function verrijkInhoud(body) {
  const koppen = [];

  // h2's krijgen een anker, zodat "op deze pagina" ernaartoe kan wijzen
  body = body.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (heel, attrs, inhoud) => {
    const id = /id="/.test(attrs) ? (attrs.match(/id="([^"]+)"/) || [, ''])[1] : slug(inhoud);
    koppen.push({ id, naam: kaal(inhoud) });
    const metId = /id="/.test(attrs) ? attrs : `${attrs} id="${id}"`;
    return `<h2${metId} data-op>${inhoud}</h2>`;
  });

  // kaarten, tabellen, afbeeldingen en lijsten komen op bij het scrollen
  body = body.replace(/<(div|section|article|table|figure|ul|ol|img)\b([^>]*class="[^"]*(?:kaart|p-kaart|tegel|blok|stap|rooster|rij|faq-item)[^"]*")/g,
    (heel, tag, rest) => `<${tag}${rest} data-op`);
  body = body.replace(/<table(?![^>]*data-op)/g, '<table data-op');

  // brede tabellen passen niet op een telefoon: in een schuifbare houder
  body = body.replace(/<table([\s\S]*?)<\/table>/g, '<div class="bgx-tabelhouder"><table$1</table></div>');

  // vraag en antwoord klikbaar maken
  body = body.replace(/<h3([^>]*)>([\s\S]*?)<\/h3>\s*<p/g, (heel, attrs, vraag, ...rest) => {
    if (!/\?\s*$/.test(kaal(vraag))) return heel;
    return `<h3${attrs}><button class="bgx-vraag" type="button" aria-expanded="false">${vraag}</button></h3><div class="bgx-antwoord" data-open="nee"><p`;
  });
  body = body.replace(/(<div class="bgx-antwoord" data-open="nee"><p[\s\S]*?<\/p>)/g, '$1</div>');

  return { body, koppen };
}

export function opDezePagina(koppen) {
  if (koppen.length < 3) return '';
  const regels = koppen.slice(0, 8).map(k => `<a href="#${k.id}">${ontsnap(k.naam)}</a>`).join('');
  return `<nav class="bgx-opdezepagina" aria-label="Op deze pagina"><b>Op deze pagina</b>${regels}</nav>`;
}

// ── een gezicht bij het werk ──────────────────────────────────────────────
export function mensenblok(isBlog) {
  const tekst = isBlog
    ? 'Ik schrijf deze stukken uit wat ik bij mkb-bedrijven tegenkom: waar het werk vastloopt, wat een oplossing kost en wat er daarna verandert. Vragen over jouw situatie? Bel of app gerust.'
    : 'Ik bouw dit zelf, samen met de mensen die er straks mee werken. Eerst kijken waar het werk vastloopt, dan pas techniek — met een vaste prijs vooraf.';
  return `<aside class="bgx-mensen" data-op>
<img src="/arthur.jpg" decoding="async" alt="Arthur Prinsen, oprichter van Bedrijfsgeheugen" width="96" height="96" loading="lazy">
<div>
<div class="bgx-wie">Arthur Prinsen</div>
<div class="bgx-wat">Oprichter Bedrijfsgeheugen · Enschede</div>
<p>${tekst}</p>
<p><a href="/contact">Stel je vraag →</a></p>
</div>
</aside>`;
}

// ── wat Google en AI-antwoordmachines lezen ───────────────────────────────
export function schemas({ isBlog, titel, omschrijving, canoniek, h1, body }) {
  const uit = [];

  const vragen = [...body.matchAll(/<h3[^>]*>(?:<button[^>]*>)?([\s\S]*?)(?:<\/button>)?<\/h3>\s*(?:<div class="bgx-antwoord"[^>]*>)?\s*<p[^>]*>([\s\S]*?)<\/p>/g)]
    .map(m => ({ v: kaal(m[1]), a: kaal(m[2]) }))
    .filter(x => x.v.endsWith('?') && x.a.length > 30);

  if (vragen.length >= 2) {
    uit.push({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: vragen.slice(0, 12).map(x => ({
        '@type': 'Question', name: x.v,
        acceptedAnswer: { '@type': 'Answer', text: x.a }
      }))
    });
  }

  const auteur = {
    '@type': 'Person', name: 'Arthur Prinsen', url: 'https://www.bedrijfsgeheugen.nl/over-ons',
    jobTitle: 'Oprichter Bedrijfsgeheugen', image: 'https://www.bedrijfsgeheugen.nl/arthur.jpg'
  };

  uit.push({
    '@context': 'https://schema.org',
    '@type': isBlog ? 'BlogPosting' : 'WebPage',
    headline: kaal(h1 || titel), description: kaal(omschrijving),
    mainEntityOfPage: canoniek, url: canoniek, inLanguage: 'nl-NL',
    author: auteur,
    publisher: {
      '@type': 'Organization', name: 'Bedrijfsgeheugen',
      url: 'https://www.bedrijfsgeheugen.nl/',
      logo: { '@type': 'ImageObject', url: 'https://www.bedrijfsgeheugen.nl/assets/merk/logo-merk.png' }
    }
  });

  return uit.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n');
}

export const ORGANISATIE_SCHEMA = `<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org', '@type': 'Organization',
  name: 'Bedrijfsgeheugen', url: 'https://www.bedrijfsgeheugen.nl/',
  logo: 'https://www.bedrijfsgeheugen.nl/assets/merk/logo-merk.png',
  email: 'arthur@bedrijfsgeheugen.nl', telephone: '+31627483345',
  founder: { '@type': 'Person', name: 'Arthur Prinsen' },
  areaServed: { '@type': 'Country', name: 'Nederland' },
  description: 'Bedrijfsgeheugen helpt mkb-bedrijven van 3 tot 250 medewerkers kennis borgen, bedrijfsprocessen automatiseren en systemen koppelen bovenop AFAS, Exact Online en Microsoft 365.'
})}</script>`;

// Onderaan elke pagina: waar de bezoeker naartoe kan. Dat is ook de reden dat
// prijzen, cases en de scans niet langer alleen vanuit het menu bereikbaar zijn —
// een pagina waar alleen het menu naartoe wijst, telt bij Google nauwelijks mee.
export function volgendeStap(isBlog) {
  return `<section class="bgx-volgende" data-op>
<h2 id="volgende-stap">Wat is je volgende stap?</h2>
<div class="rooster">
<a class="bgx-staptegel" href="/zelfscan"><b>Gratis zelfscan</b><span>Twaalf klikvragen, drie minuten, direct een score en je grootste risico.</span></a>
<a class="bgx-staptegel" href="/frisse-blik"><b>Frisse blik</b><span>Businesscase, benchmark en volgorde. Verrekend als we daarna bouwen.</span></a>
<a class="bgx-staptegel" href="/prijzen"><b>Wat het kost</b><span>Vaste prijs per pakket, geen prijs per gebruiker, geen uurtje-factuurtje.</span></a>
<a class="bgx-staptegel" href="/cases"><b>Uit de praktijk</b><span>Wat er veranderde bij bedrijven die hiermee begonnen.</span></a>
</div>
<p class="bgx-ooknuttig">Ook goed om te weten:
<a href="/help">veelgestelde vragen</a> ·
<a href="/security">beveiliging en data</a> ·
<a href="/juridisch">voorwaarden</a> ·
<a href="/partners">partners</a> ·
<a href="/onderzoeken">onderzoek en cijfers</a> ·
<a href="/templates">sjablonen</a> ·
<a href="/changelog">wat er verandert</a> ·
<a href="/start">waar je begint</a></p>
</section>`;
}

export const VOLGENDE_CSS = `<style id="v18-volgende"> .bgx-volgende{max-width:none!important;margin:64px 0 0}.bgx-volgende h2{margin-top:0}.bgx-volgende .rooster{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}.bgx-staptegel{display:block;background:var(--white);border:1px solid var(--line);border-radius:var(--radius);padding:22px 24px;text-decoration:none;color:var(--ink);transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease}.bgx-staptegel:hover{transform:translateY(-4px);box-shadow:0 30px 80px rgba(7,21,35,.16);border-color:rgba(39,66,214,.35)}.bgx-staptegel b{display:block;font-size:17px;margin-bottom:6px}.bgx-staptegel span{color:var(--muted);font-size:15px;line-height:1.55}</style>`;

export const EXTRA_HTML = '<div class="bgx-leesbalk" aria-hidden="true"></div>\n<button class="bgx-omhoog" type="button" aria-label="Terug naar boven">↑</button>';

// brede tabellen passen niet op een telefoon: ze krijgen een schuifbare houder,
// met een schaduwrandje dat laat zien dat er meer naast staat
export const TABEL_CSS = `<style id="v18-tabelhouder"> .bgx-tabelhouder{max-width:none!important;overflow-x:auto;margin:24px 0;-webkit-overflow-scrolling:touch;border-radius:20px}.bgx-tabelhouder table{margin:0;min-width:100%}.bgx-tabelhouder td,.bgx-tabelhouder th{white-space:normal;min-width:118px}</style>`;
