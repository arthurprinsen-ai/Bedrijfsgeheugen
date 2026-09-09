// Beweging die reageert op wat de bezoeker doet: muis, vinger en scrollen.
// Vijf onderdelen, allemaal zonder externe bibliotheek en allemaal met een
// uitweg als het apparaat of de voorkeur van de bezoeker het niet wil.

export const BEWEGING_CSS = `<style id="v18-beweging">
/* Chrome desktop fail-safe. Publieke inhoud is altijd zichtbaar. De oude
   gedeelde reveal-laag gebruikte [data-op] + opacity:0 en kon op Chrome/macOS
   blijven hangen totdat DevTools of een resize een reflow forceerde. */
html.bgx-beweegt [data-op]{opacity:1!important;visibility:visible!important;transform:none!important}

/* 1. magnetische knoppen: de knop komt naar de cursor toe */
.bgx-magneet{transition:transform .18s cubic-bezier(.22,.61,.36,1)}
@media(hover:none){.bgx-magneet{transition:transform .12s ease}.bgx-magneet:active{transform:scale(.96)!important}}

/* 2. kaarten krijgen alleen een lichte 2D lift. Publieke content wordt bewust
   niet meer naar 3D compositor-lagen gepromoveerd: op Chrome/macOS kon dat
   complete standalone pagina's wit laten painten totdat een resize/DevTools
   de compositor opnieuw opbouwde. */
.bgx-kantel{transition:transform .25s cubic-bezier(.22,.61,.36,1),box-shadow .25s ease}
.bgx-kantel:hover{transform:translateY(-3px);box-shadow:0 30px 80px rgba(7,21,35,.18)}

/* 3. de hero beweegt trager dan de rest bij het scrollen, uitsluitend 2D */
.inhoud-kop video{transform:translateY(var(--bgx-diepte,0)) scale(1.08);transition:transform .1s linear}
.inhoud-kop .wrap{transform:translateY(calc(var(--bgx-diepte,0px) * -.35))}

/* 4. koppen zijn zichtbaar zonder JS; animatie mag zichtbaarheid nooit bepalen. */
.bgx-woord{display:inline-block;opacity:1;transform:none;
  transition:opacity .5s ease,transform .5s cubic-bezier(.22,.61,.36,1)}
.bgx-woord.bgx-aan{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){.bgx-woord{opacity:1!important;transform:none!important}}

/* 5. zonder / met: sleep de scheidslijn */
.bgx-vergelijk{max-width:none!important;position:relative;border-radius:22px;overflow:hidden;margin:34px 0;
  border:1px solid var(--line);background:var(--white);user-select:none;touch-action:pan-y}
.bgx-vergelijk .zijde{padding:30px 28px;min-height:230px}
.bgx-vergelijk .nu{background:#0a1117;color:rgba(255,255,255,.9)}
.bgx-vergelijk .nu li{color:rgba(255,255,255,.9)!important}
.bgx-vergelijk .straks{position:absolute;inset:0;background:var(--white);color:var(--ink);
  padding-left:calc(var(--bgx-grens,50%) + 28px);clip-path:inset(0 0 0 var(--bgx-grens,50%))}
.bgx-vergelijk h4{margin:0 0 12px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;
  font-family:'IBM Plex Mono',ui-monospace,monospace}
.bgx-vergelijk .nu h4{color:#ff9b7a}
.bgx-vergelijk .straks h4{color:#0f7a4a}
.bgx-vergelijk ul{margin:0;padding-left:1.1rem}
.bgx-vergelijk li{margin:.45rem 0;font-size:16px;line-height:1.55}
.bgx-vergelijk .greep{position:absolute;top:0;bottom:0;left:var(--bgx-grens,50%);width:3px;background:var(--lime);
  cursor:ew-resize;z-index:3}
.bgx-vergelijk .greep:focus-visible{outline:3px solid var(--ink);outline-offset:5px}
.bgx-vergelijk .greep::after{content:"⇤⇥";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  width:46px;height:46px;border-radius:50%;background:var(--lime);color:var(--ink);border:2px solid var(--ink);
  display:grid;place-items:center;font-size:14px;font-weight:800;letter-spacing:-.05em}
.bgx-vergelijk .hint{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);z-index:4;
  font-size:12px;color:rgba(255,255,255,.55);pointer-events:none}
</style>`;

export const BEWEGING_JS = `<script id="v18-beweging-js">
(function(){
  var rustig = matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raakt = matchMedia && matchMedia('(hover: none)').matches;

  // 1. magnetische knoppen
  if (!rustig && !raakt) {
    document.querySelectorAll('.bgx-magneet').forEach(function(k){
      k.addEventListener('pointermove', function(e){
        var r = k.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width/2)) / r.width;
        var dy = (e.clientY - (r.top + r.height/2)) / r.height;
        k.style.transform = 'translate(' + (dx*14).toFixed(1) + 'px,' + (dy*10).toFixed(1) + 'px)';
      });
      k.addEventListener('pointerleave', function(){ k.style.transform = ''; });
    });
  }

  // 2. kaarten blijven bewust 2D. De hover-lift staat in CSS; geen pointer-
  // gestuurde 3D-laag meer, zodat Chrome/macOS de pagina niet kan blank-painten.

  // 3. de hero beweegt trager dan de pagina
  var hero = document.querySelector('.inhoud-kop');
  if (hero && !rustig) {
    var diepte = function(){
      var t = Math.max(0, Math.min(1, (scrollY || 0) / 500));
      hero.style.setProperty('--bgx-diepte', (t * 60).toFixed(1) + 'px');
    };
    document.addEventListener('scroll', diepte, true);
    diepte();
  }

  // 4. koppen woord voor woord. Dit is uitsluitend decoratief: de woorden zijn
  // in CSS al zichtbaar, dus een gemiste observer/reflow kan nooit tekst wissen.
  var koppen = [].slice.call(document.querySelectorAll('.inhoud-body h2'));
  koppen.forEach(function(k){
    if (k.querySelector('.bgx-woord') || k.children.length) return;
    var woorden = (k.textContent || '').trim().split(/\\s+/);
    if (woorden.length < 2 || woorden.length > 14) return;
    k.innerHTML = woorden.map(function(w, i){
      return '<span class="bgx-woord bgx-aan" style="transition-delay:' + (i*45) + 'ms">' + w + '</span>';
    }).join(' ');
  });

  // 5. zonder / met: sleep de scheidslijn, met vinger, muis of toetsenbord.
  // Fail-safe: de scheidslijn mag nooit zo ver naar een rand dat één tekstpaneel onleesbaar wordt.
  document.querySelectorAll('.bgx-vergelijk').forEach(function(blok){
    var bezig = false;
    var greep = blok.querySelector('.greep');
    function grenzen(){
      var r = blok.getBoundingClientRect();
      var minPanePx = Math.min(180, Math.max(132, r.width * .28));
      var minPct = Math.min(45, minPanePx / Math.max(1, r.width) * 100);
      return { r:r, min:minPct, max:100-minPct };
    }
    function pasToe(deel){
      var g = grenzen();
      deel = Math.max(g.min, Math.min(g.max, deel));
      blok.style.setProperty('--bgx-grens', deel.toFixed(1) + '%');
      if (greep) {
        greep.setAttribute('aria-valuemin', g.min.toFixed(0));
        greep.setAttribute('aria-valuemax', g.max.toFixed(0));
        greep.setAttribute('aria-valuenow', deel.toFixed(0));
      }
    }
    function zet(x){
      var g = grenzen();
      pasToe((x - g.r.left) / Math.max(1, g.r.width) * 100);
    }
    pasToe(50);
    blok.addEventListener('pointerdown', function(e){ bezig = true; zet(e.clientX); blok.setPointerCapture(e.pointerId); });
    blok.addEventListener('pointermove', function(e){ if (bezig) zet(e.clientX); });
    ['pointerup','pointercancel'].forEach(function(n){ blok.addEventListener(n, function(){ bezig = false; }); });
    if (greep) {
      greep.addEventListener('keydown', function(e){
        if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
        e.preventDefault();
        var g = grenzen();
        var huidig = parseFloat(greep.getAttribute('aria-valuenow') || '50');
        if (e.key === 'ArrowLeft') pasToe(huidig - 4);
        if (e.key === 'ArrowRight') pasToe(huidig + 4);
        if (e.key === 'Home') pasToe(g.min);
        if (e.key === 'End') pasToe(g.max);
      });
    }
    addEventListener('resize', function(){
      var huidig = parseFloat((greep && greep.getAttribute('aria-valuenow')) || '50');
      pasToe(huidig);
    });
    var getoond = false;
    function duwtje(){
      if (getoond) return;
      var r = blok.getBoundingClientRect();
      if (r.top > (innerHeight||800) * .85 || r.bottom < 0) return;
      getoond = true;
      var stap = 0;
      var loop = setInterval(function(){
        stap++;
        pasToe(50 + Math.sin(stap/3) * 14);
        if (stap > 18) { clearInterval(loop); pasToe(50); }
      }, 55);
    }
    document.addEventListener('scroll', duwtje, true);
    duwtje();
  });
})();
</script>`;

export function vergelijker(onderwerp) {
  const nu = [
    'De afspraak staat in de mailbox van één collega',
    'Gegevens worden overgetypt van het ene systeem naar het andere',
    'Wie het weet is met vakantie',
    'Niemand kan achteraf zien waarom het zo besloten is'
  ];
  const straks = [
    'De afspraak staat bij de klant, vindbaar voor iedereen',
    'Wat één keer is ingevoerd stroomt door naar de rest',
    'Het werk loopt door, ook als iemand er niet is',
    'Elk besluit heeft een bron, een eigenaar en een datum'
  ];
  return `<div class="bgx-vergelijk" aria-label="Vergelijking tussen de huidige situatie en de situatie met ${onderwerp}">
<div class="zijde nu"><h4>Zoals het nu gaat</h4><ul>${nu.map(t => `<li>${t}</li>`).join('')}</ul></div>
<div class="zijde straks"><h4>Zoals het wordt</h4><ul>${straks.map(t => `<li>${t}</li>`).join('')}</ul></div>
<div class="greep" role="separator" tabindex="0" aria-orientation="vertical" aria-label="Sleep om te vergelijken" aria-valuemin="35" aria-valuemax="65" aria-valuenow="50"></div>
<div class="hint">sleep met je vinger</div>
</div>`;
}

export function maakBeweeglijk(html) {
  // Reveal-markers worden uit de uiteindelijke publieke markup verwijderd.
  // Beweging is enhancement; tekstweergave mag nooit van JS of viewport-events afhangen.
  html = html.replace(/\sdata-op(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/g, '');

  // Bouw ook oude gegenereerde markup defensief schoon. Een structurele .blok
  // mag geen achtergebleven bgx-kantel houden; echte kaartcomponenten wel.
  html = html.replace(/class="([^"]*)"/g, (heel, klassen) => {
    let tokens = klassen.split(/\s+/).filter(Boolean);
    const heeftKaart = tokens.some(token => /^(kaart|p-kaart|tegel)$/.test(token));
    if (tokens.includes('blok') && !heeftKaart) {
      tokens = tokens.filter(token => token !== 'bgx-kantel');
    }

    const heeftMagneet = tokens.includes('bgx-magneet');
    const heeftKantel = tokens.includes('bgx-kantel');
    const samengevoegd = tokens.join(' ');
    if (!heeftMagneet && /\b(btn|knop|staptegel|cta)\b/.test(samengevoegd)) tokens.push('bgx-magneet');
    else if (!heeftKantel && /\b(kaart|p-kaart|tegel)\b/.test(samengevoegd)) tokens.push('bgx-kantel');
    return `class="${tokens.join(' ')}"`;
  });
  return html;
}
