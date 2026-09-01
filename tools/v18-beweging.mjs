// Beweging die reageert op wat de bezoeker doet: muis, vinger en scrollen.
// Vijf onderdelen, allemaal zonder externe bibliotheek en allemaal met een
// uitweg als het apparaat of de voorkeur van de bezoeker het niet wil.

export const BEWEGING_CSS = `<style id="v18-beweging">
/* 1. magnetische knoppen: de knop komt naar de cursor toe */
.bgx-magneet{transition:transform .18s cubic-bezier(.22,.61,.36,1)}
@media(hover:none){.bgx-magneet{transition:transform .12s ease}.bgx-magneet:active{transform:scale(.96)!important}}

/* 2. kaarten kantelen mee met de cursor; op een telefoon met de stand van het toestel */
.bgx-kantel{transform-style:preserve-3d;transition:transform .25s cubic-bezier(.22,.61,.36,1),box-shadow .25s ease;will-change:transform}
.bgx-kantel:hover{box-shadow:0 30px 80px rgba(7,21,35,.18)}

/* 3. de hero beweegt trager dan de rest bij het scrollen */
.inhoud-kop video{transform:translate3d(0,var(--bgx-diepte,0),0) scale(1.08);transition:transform .1s linear}
.inhoud-kop .wrap{transform:translate3d(0,calc(var(--bgx-diepte,0px) * -.35),0)}

/* 4. koppen komen woord voor woord binnen */
.bgx-woord{display:inline-block;opacity:0;transform:translateY(.4em) rotate(2deg);
  transition:opacity .5s ease,transform .5s cubic-bezier(.22,.61,.36,1)}
.bgx-woord.bgx-aan{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){.bgx-woord{opacity:1!important;transform:none!important}}

/* 5. zonder / met: sleep de scheidslijn */
.bgx-vergelijk{max-width:none!important;position:relative;border-radius:22px;overflow:hidden;margin:34px 0;
  border:1px solid var(--line);background:var(--white);user-select:none;touch-action:pan-y}
.bgx-vergelijk .zijde{padding:30px 28px;min-height:230px}
.bgx-vergelijk .nu{background:#0a1117;color:rgba(255,255,255,.9)}
.bgx-vergelijk .straks{position:absolute;inset:0;background:var(--white);color:var(--ink);
  clip-path:inset(0 0 0 var(--bgx-grens,50%))}
.bgx-vergelijk h4{margin:0 0 12px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;
  font-family:'IBM Plex Mono',ui-monospace,monospace}
.bgx-vergelijk .nu h4{color:#ff9b7a}
.bgx-vergelijk .straks h4{color:#0f7a4a}
.bgx-vergelijk ul{margin:0;padding-left:1.1rem}
.bgx-vergelijk li{margin:.45rem 0;font-size:16px;line-height:1.55}
.bgx-vergelijk .greep{position:absolute;top:0;bottom:0;left:var(--bgx-grens,50%);width:3px;background:var(--lime);
  cursor:ew-resize;z-index:3}
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

  // 2. kaarten kantelen
  if (!rustig && !raakt) {
    document.querySelectorAll('.bgx-kantel').forEach(function(kaart){
      kaart.addEventListener('pointermove', function(e){
        var r = kaart.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5;
        var y = (e.clientY - r.top) / r.height - .5;
        kaart.style.transform = 'perspective(900px) rotateX(' + (-y*5).toFixed(2) + 'deg) rotateY(' + (x*6).toFixed(2) + 'deg) translateY(-3px)';
      });
      kaart.addEventListener('pointerleave', function(){ kaart.style.transform = ''; });
    });
  }

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

  // 4. koppen woord voor woord
  var koppen = [].slice.call(document.querySelectorAll('.inhoud-body h2'));
  koppen.forEach(function(k){
    if (k.querySelector('.bgx-woord') || k.children.length) return;
    var woorden = (k.textContent || '').trim().split(/\\s+/);
    if (woorden.length < 2 || woorden.length > 14) return;
    k.innerHTML = woorden.map(function(w, i){
      return '<span class="bgx-woord" style="transition-delay:' + (i*45) + 'ms">' + w + '</span>';
    }).join(' ');
  });
  function toonKoppen(){
    koppen.forEach(function(k){
      var r = k.getBoundingClientRect();
      if (r.top < (innerHeight || 800) * .88 && r.bottom > 0) {
        k.querySelectorAll('.bgx-woord').forEach(function(w){ w.classList.add('bgx-aan'); });
      }
    });
  }
  document.addEventListener('scroll', toonKoppen, true);
  addEventListener('resize', toonKoppen);
  toonKoppen();
  setTimeout(function(){
    document.querySelectorAll('.bgx-woord:not(.bgx-aan)').forEach(function(w){
      if (w.getBoundingClientRect().top < (innerHeight||800)) w.classList.add('bgx-aan');
    });
  }, 1600);

  // 5. zonder / met: sleep de scheidslijn, met vinger of muis
  document.querySelectorAll('.bgx-vergelijk').forEach(function(blok){
    var bezig = false;
    function zet(x){
      var r = blok.getBoundingClientRect();
      var deel = Math.max(6, Math.min(94, (x - r.left) / r.width * 100));
      blok.style.setProperty('--bgx-grens', deel.toFixed(1) + '%');
    }
    blok.addEventListener('pointerdown', function(e){ bezig = true; zet(e.clientX); blok.setPointerCapture(e.pointerId); });
    blok.addEventListener('pointermove', function(e){ if (bezig) zet(e.clientX); });
    ['pointerup','pointercancel'].forEach(function(n){ blok.addEventListener(n, function(){ bezig = false; }); });
    // een duwtje bij het eerste zicht, zodat zichtbaar is dat je kunt slepen
    var getoond = false;
    function duwtje(){
      if (getoond) return;
      var r = blok.getBoundingClientRect();
      if (r.top > (innerHeight||800) * .85 || r.bottom < 0) return;
      getoond = true;
      var stap = 0;
      var loop = setInterval(function(){
        stap++;
        blok.style.setProperty('--bgx-grens', (50 + Math.sin(stap/3) * 14).toFixed(1) + '%');
        if (stap > 18) { clearInterval(loop); blok.style.setProperty('--bgx-grens', '50%'); }
      }, 55);
    }
    document.addEventListener('scroll', duwtje, true);
    duwtje();
  });
})();
</script>`;

// Het blok zelf. De teksten volgen het onderwerp van de pagina: links hoe het
// nu gaat, rechts hoe het wordt.
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
  return `<div class="bgx-vergelijk" data-op aria-label="Vergelijking tussen de huidige situatie en de situatie met ${onderwerp}">
<div class="zijde nu"><h4>Zoals het nu gaat</h4><ul>${nu.map(t => `<li>${t}</li>`).join('')}</ul></div>
<div class="zijde straks"><h4>Zoals het wordt</h4><ul>${straks.map(t => `<li>${t}</li>`).join('')}</ul></div>
<div class="greep" role="separator" aria-label="Sleep om te vergelijken"></div>
<div class="hint">sleep met je vinger</div>
</div>`;
}

// klassen toekennen aan wat er al staat
export function maakBeweeglijk(html) {
  // let op: alleen toevoegen als het er nog niet staat, anders krijgt een
  // element de klasse twee keer en groeit hij bij elke bouwronde verder
  html = html.replace(/class="([^"]*)"/g, (heel, klassen) => {
    if (/bgx-magneet|bgx-kantel/.test(klassen)) return heel;
    let uit = klassen;
    if (/\b(btn|knop|staptegel|cta)\b/.test(klassen)) uit += ' bgx-magneet';
    else if (/\b(kaart|p-kaart|tegel|blok)\b/.test(klassen)) uit += ' bgx-kantel';
    return `class="${uit}"`;
  });
  return html;
}
