// Interactieve onderdelen die volgen uit wat er op de pagina staat.
//
// Uitgangspunt: niets wordt verstopt voor een zoekmachine. Elke module werkt op
// tekst die gewoon in de HTML blijft staan — cijfers blijven leesbaar, lijsten
// blijven lijsten, tabellen blijven tabellen. De interactie komt eroverheen.
//
// Wat er gebeurt, hangt af van wat de pagina bevat:
//   bedragen en percentages  → tellen op zodra ze in beeld komen
//   "Herken je dit?"-lijsten → aanvinkbaar, met een uitkomst en een vervolgstap
//   genummerde stappen       → tijdlijn die meeloopt met het scrollen
//   tabellen met bedragen    → sorteerbaar, met een balk achter elk bedrag
//   prijsbereiken (€ x – € y)→ schuif zelf door het bereik

export const MODULE_CSS = `<style id="v18-modules"> .bgx-telop{font-variant-numeric:tabular-nums}.bgx-herken{max-width:none!important;list-style:none;padding:0;margin:24px 0;display:grid;gap:10px}.bgx-herken li{margin:0}.bgx-herken button{width:100%;display:flex;align-items:flex-start;gap:14px;text-align:left;background:var(--white);border:1px solid var(--line);border-radius:16px;padding:16px 18px;font:inherit;font-size:16.5px;color:var(--ink2);cursor:pointer;transition:border-color .2s ease,transform .2s ease,box-shadow .2s ease}.bgx-herken button:hover{border-color:rgba(39,66,214,.4);transform:translateX(3px)}.bgx-herken button::before{content:"";flex:0 0 22px;height:22px;margin-top:2px;border:2px solid var(--line);border-radius:7px;transition:background .2s ease,border-color .2s ease}.bgx-herken button[aria-pressed=true]{border-color:var(--blue);color:var(--ink)}.bgx-herken button[aria-pressed=true]::before{background:var(--blue) no-repeat center/13px url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="2.5"><path d="M3 8.5l3.5 3.5L13 5"/></svg>');border-color:var(--blue)}.bgx-herkenuit{max-width:none!important;margin-top:14px;padding:20px 22px;border-radius:18px;background:var(--ink);color:#fff;display:flex;flex-wrap:wrap;align-items:center;gap:14px;justify-content:space-between}.bgx-herkenuit[hidden]{display:none}.bgx-herkenuit .bgx-score{font-size:15px;color:rgba(255,255,255,.82)}.bgx-herkenuit .bgx-score b{color:var(--lime);font-size:20px}.bgx-herkenuit a{background:var(--lime);color:var(--ink);border-radius:999px;padding:12px 22px;font-weight:750;text-decoration:none}.bgx-tijdlijn{max-width:none!important;position:relative;padding-left:40px;margin:28px 0}.bgx-tijdlijn::before{content:"";position:absolute;left:13px;top:6px;bottom:6px;width:2px;background:var(--line)}.bgx-tijdlijn .bgx-lijn{position:absolute;left:13px;top:6px;width:2px;background:var(--blue);height:0;transition:height .25s linear}.bgx-tijdstap{position:relative;margin:0 0 26px}.bgx-tijdstap::before{content:attr(data-nr);position:absolute;left:-40px;top:0;width:28px;height:28px;border-radius:50%;background:var(--white);border:2px solid var(--line);color:var(--muted);font-size:13px;font-weight:800;display:grid;place-items:center;transition:.3s ease}.bgx-tijdstap.bgx-bereikt::before{background:var(--blue);border-color:var(--blue);color:#fff}.inhoud-body th[data-sorteer]{cursor:pointer;user-select:none;white-space:nowrap}.inhoud-body th[data-sorteer]:hover{color:var(--blue)}.inhoud-body th[data-sorteer]::after{content:"↕";margin-left:6px;opacity:.45;font-size:11px}.inhoud-body th[aria-sort=ascending]::after{content:"↑";opacity:1}.inhoud-body th[aria-sort=descending]::after{content:"↓";opacity:1}td.bgx-bedrag{position:relative}td.bgx-bedrag::before{content:"";position:absolute;left:0;bottom:0;height:3px;width:var(--deel,0%);background:var(--blue);opacity:.35}.bgx-bereik{max-width:none!important;background:var(--white);border:1px solid var(--line);border-radius:22px;padding:24px 26px;margin:26px 0;box-shadow:0 1px 2px rgba(7,21,35,.04),0 16px 40px rgba(7,21,35,.06)}.bgx-bereik .bgx-kop{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:#C2410C}.bgx-bereik .bgx-uit{font-size:clamp(30px,6vw,44px);font-weight:850;letter-spacing:-.02em;margin:6px 0 4px;font-variant-numeric:tabular-nums}.bgx-bereik input[type=range]{width:100%;accent-color:var(--blue);margin-top:10px}.bgx-bereik .bgx-rand{display:flex;justify-content:space-between;font-size:13px;color:var(--muted)}.bgx-bereik p{font-size:15px!important;color:var(--muted);margin:10px 0 0}.bgx-bereik .bgx-regel{display:block;font-size:14px;color:var(--muted);margin-top:14px}.bgx-bereik .bgx-regel output{font-weight:800;color:var(--ink);font-variant-numeric:tabular-nums}.bgx-portaalbeeld{max-width:none!important;background:linear-gradient(180deg,#0d1a2b,#0a1117);border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:18px;margin:28px 0;overflow:hidden}.bgx-portaalbeeld .balk{display:flex;gap:6px;margin-bottom:14px}.bgx-portaalbeeld .balk i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.22)}.bgx-portaalbeeld .bgx-net{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(132px,1fr))}.bgx-portaalbeeld .bgx-vak{background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:14px;transition:background .25s ease,transform .25s ease,border-color .25s ease}.bgx-portaalbeeld .bgx-vak:hover{background:rgba(39,66,214,.24);border-color:rgba(122,150,255,.55);transform:translateY(-3px)}.bgx-portaalbeeld .bgx-lab{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.5)}.bgx-portaalbeeld .bgx-cijfer{font-size:26px;font-weight:850;color:#fff;line-height:1.1;margin-top:6px;font-variant-numeric:tabular-nums}.bgx-portaalbeeld .bgx-sub{font-size:12.5px;color:rgba(255,255,255,.62);margin-top:4px}.bgx-portaalbeeld .bgx-meter{height:4px;border-radius:2px;background:rgba(255,255,255,.13);margin-top:10px;overflow:hidden}.bgx-portaalbeeld .bgx-meter i{display:block;height:100%;background:linear-gradient(90deg,#2742D6,#7C90F0);width:0;transition:width 1.1s cubic-bezier(.22,.61,.36,1)}.bgx-portaalbeeld.bgx-aan .bgx-meter i{width:var(--tot,60%)}</style>`;

export const MODULE_JS = `<script id="v18-modules-js">
(function(){
  var rustig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function inBeeld(el, marge){
    var r = el.getBoundingClientRect();
    return r.top < (innerHeight || 800) * (marge || .92) && r.bottom > 0;
  }

  // cijfers laten oplopen — de leesbare waarde blijft in de HTML staan
  var tellers = [].slice.call(document.querySelectorAll('.bgx-telop'));
  function telOp(el){
    if (el.dataset.gedaan) return;
    el.dataset.gedaan = '1';
    var doel = parseFloat(el.dataset.waarde);
    if (isNaN(doel) || rustig) return;
    var voor = el.dataset.voor || '', na = el.dataset.na || '', decimalen = (el.dataset.dec | 0);
    var begin = performance.now(), duur = 900;
    (function stap(nu){
      var d = Math.min(1, (nu - begin) / duur);
      var w = doel * (1 - Math.pow(1 - d, 3));
      el.textContent = voor + w.toLocaleString('nl-NL', { minimumFractionDigits: decimalen, maximumFractionDigits: decimalen }) + na;
      if (d < 1) requestAnimationFrame(stap);
    })(begin);
  }

  // herkenningslijst: aanvinken wat speelt, met een uitkomst eronder
  document.querySelectorAll('.bgx-herken').forEach(function(lijst){
    var uit = lijst.nextElementSibling;
    lijst.querySelectorAll('button').forEach(function(knop){
      knop.addEventListener('click', function(){
        knop.setAttribute('aria-pressed', knop.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        var aan = lijst.querySelectorAll('[aria-pressed=true]').length;
        var totaal = lijst.querySelectorAll('button').length;
        if (!uit || !uit.classList.contains('bgx-herkenuit')) return;
        uit.hidden = aan === 0;
        var tekst = uit.querySelector('.bgx-score');
        if (tekst) {
          tekst.innerHTML = aan >= Math.ceil(totaal / 2)
            ? 'Je herkent <b>' + aan + ' van de ' + totaal + '</b>. Dat is meestal genoeg om er iets aan te verdienen.'
            : 'Je herkent <b>' + aan + ' van de ' + totaal + '</b>. Ook één ervan kost al tijd, elke week opnieuw.';
        }
      });
    });
  });

  // tijdlijn: de lijn groeit mee met het scrollen
  var tijdlijnen = [].slice.call(document.querySelectorAll('.bgx-tijdlijn'));
  function tekenTijdlijn(){
    tijdlijnen.forEach(function(t){
      var lijn = t.querySelector('.bgx-lijn');
      var stappen = [].slice.call(t.querySelectorAll('.bgx-tijdstap'));
      var laatste = 0;
      stappen.forEach(function(s){
        if (inBeeld(s, .68)) { s.classList.add('bgx-bereikt'); laatste = s.offsetTop + 20; }
      });
      if (lijn) lijn.style.height = laatste + 'px';
    });
  }

  // tabellen sorteren en de verhouding tussen bedragen tonen
  document.querySelectorAll('.inhoud-body table').forEach(function(tabel){
    var koppen = tabel.querySelectorAll('thead th, tr:first-child th');
    var lijf = tabel.querySelector('tbody') || tabel;
    var rijen = [].slice.call(lijf.querySelectorAll('tr')).filter(function(r){ return r.querySelector('td'); });
    if (rijen.length < 3) return;

    function getal(cel){
      var m = (cel.textContent || '').replace(/\\./g, '').match(/-?\\d+(,\\d+)?/);
      return m ? parseFloat(m[0].replace(',', '.')) : null;
    }

    koppen.forEach(function(kop, i){
      kop.setAttribute('data-sorteer', '');
      kop.setAttribute('tabindex', '0');
      function sorteer(){
        var op = kop.getAttribute('aria-sort') !== 'ascending';
        koppen.forEach(function(k){ k.removeAttribute('aria-sort'); });
        kop.setAttribute('aria-sort', op ? 'ascending' : 'descending');
        rijen.sort(function(a, b){
          var ca = a.cells[i], cb = b.cells[i];
          if (!ca || !cb) return 0;
          var ga = getal(ca), gb = getal(cb);
          if (ga !== null && gb !== null) return op ? ga - gb : gb - ga;
          return op ? ca.textContent.localeCompare(cb.textContent, 'nl') : cb.textContent.localeCompare(ca.textContent, 'nl');
        });
        rijen.forEach(function(r){ lijf.appendChild(r); });
      }
      kop.addEventListener('click', sorteer);
      kop.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sorteer(); } });
    });

    // balkje achter elk bedrag, zodat je de verhouding ziet in plaats van leest
    var kolommen = rijen[0].cells.length;
    for (var k = 0; k < kolommen; k++) {
      var waarden = rijen.map(function(r){ return r.cells[k] ? getal(r.cells[k]) : null; });
      if (waarden.filter(function(w){ return w !== null; }).length < rijen.length) continue;
      var max = Math.max.apply(null, waarden);
      if (!isFinite(max) || max <= 0) continue;
      rijen.forEach(function(r, n){
        var cel = r.cells[k];
        if (!cel) return;
        cel.classList.add('bgx-bedrag');
        cel.style.setProperty('--deel', Math.round(waarden[n] / max * 100) + '%');
      });
    }
  });

  // de rekenaar met eigen cijfers
  document.querySelectorAll('.bgx-rekenaar').forEach(function(blok){
    var schuiven = blok.querySelectorAll('input[data-reken]');
    var uit = blok.querySelector('.bgx-uit');
    function reken(){
      var w = {};
      schuiven.forEach(function(s){
        w[s.dataset.reken] = Number(s.value);
        var out = blok.querySelector('[data-uit=' + s.dataset.reken + ']');
        if (out) out.textContent = s.value;
      });
      var jaar = w.mw * (w.min / 60) * 250 * w.uur;
      if (uit) uit.textContent = '€ ' + Math.round(jaar).toLocaleString('nl-NL');
    }
    schuiven.forEach(function(s){ s.addEventListener('input', reken); });
    reken();
  });

  // bereik verkennen
  document.querySelectorAll('.bgx-bereik:not(.bgx-rekenaar)').forEach(function(blok){
    var schuif = blok.querySelector('input[type=range]');
    var uit = blok.querySelector('.bgx-uit');
    if (!schuif || !uit) return;
    function toon(){
      uit.textContent = '€ ' + Number(schuif.value).toLocaleString('nl-NL');
    }
    schuif.addEventListener('input', toon);
    toon();
  });

  function meet(){
    tellers.forEach(function(el){ if (inBeeld(el)) telOp(el); });
    tekenTijdlijn();
    document.querySelectorAll('.bgx-portaalbeeld').forEach(function(p){ if (inBeeld(p)) p.classList.add('bgx-aan'); });
  }
  document.addEventListener('scroll', meet, true);
  addEventListener('resize', meet);
  meet();
  setTimeout(meet, 1200);
})();
</script>`;

const kaal = t => String(t).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// ── de modules uit de inhoud afleiden ─────────────────────────────────────
export function bouwModules(body) {
  const gebruikt = [];

  // 1. bedragen en percentages laten oplopen zodra ze in beeld komen.
  //    Alleen in koppen en in de cijferelementen van kaarten: midden in een
  //    lopende zin leest een tellend getal onrustig.
  body = body.replace(/<(h2|h3|strong|b|span|div)([^>]*(?:class="[^"]*(?:getal|nr|cijfer|kpi)[^"]*")?[^>]*)>([\s\S]{0,120}?)<\/\1>/g,
    (heel, tag, attrs, inhoud) => {
      const magTellen = /^(h2|h3)$/.test(tag) || /class="[^"]*(getal|nr|cijfer|kpi)/.test(attrs);
      if (!magTellen || /<(span|div|a)\b/.test(inhoud)) return heel;
      let geraakt = false;
      const nieuw = inhoud.replace(/(€\s?)?(\d{1,3}(?:\.\d{3})+|\d{2,6})(\s?%)?/g, (m, euro, getal, procent) => {
        if (geraakt) return m;
        const w = parseFloat(getal.replace(/\./g, ''));
        if (!isFinite(w) || w < 10 || (!euro && !procent && w < 100)) return m;
        geraakt = true;
        gebruikt.push('teller');
        return `<span class="bgx-telop" data-waarde="${w}" data-voor="${euro ? '€ ' : ''}" data-na="${procent ? '%' : ''}">${m}</span>`;
      });
      return geraakt ? `<${tag}${attrs}>${nieuw}</${tag}>` : heel;
    });

  // 2. de eerste lijst met korte herkenningspunten wordt aanvinkbaar. Wat je
  //    aanvinkt bepaalt de uitkomst — herkenning verkoopt beter dan een claim.
  {
    const lijsten = [...body.matchAll(/<ul([^>]*)>([\s\S]*?)<\/ul>/g)];
    for (const m of lijsten) {
      const items = [...m[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(x => x[1]);
      const kort = items.filter(t => kaal(t).length > 12 && kaal(t).length < 160 && !/<(a|img|table)\b/.test(t));
      if (items.length < 4 || kort.length !== items.length) continue;
      gebruikt.push('herken');
      const lijst = items.map(t => `<li><button type="button" aria-pressed="false">${t}</button></li>`).join('');
      body = body.replace(m[0], `<ul class="bgx-herken"${m[1]}>${lijst}</ul>
<div class="bgx-herkenuit" hidden>
<span class="bgx-score"></span>
<a href="/zelfscan">Doe de gratis zelfscan →</a>
</div>`);
      break;
    }
  }

  // 3. genummerde stappen worden een tijdlijn die meeloopt
  const stapKoppen = [...body.matchAll(/<h3([^>]*)>\s*(\d)\.\s*([\s\S]*?)<\/h3>/g)];
  if (stapKoppen.length >= 3) {
    gebruikt.push('tijdlijn');
    const eerste = body.indexOf(stapKoppen[0][0]);
    const laatsteKop = stapKoppen[stapKoppen.length - 1][0];
    const naLaatste = body.indexOf(laatsteKop) + laatsteKop.length;
    const eindeBlok = (() => {
      const rest = body.slice(naLaatste);
      const volgende = rest.search(/<h2[\s>]/);
      return volgende === -1 ? body.length : naLaatste + volgende;
    })();

    let blok = body.slice(eerste, eindeBlok);
    blok = blok.replace(/<h3([^>]*)>\s*(\d)\.\s*([\s\S]*?)<\/h3>/g,
      (heel, attrs, nr, tekst) => `</div><div class="bgx-tijdstap" data-nr="${nr}"><h3${attrs}>${tekst}</h3>`);
    blok = `<div class="bgx-tijdlijn"><span class="bgx-lijn"></span>${blok.replace(/^<\/div>/, '')}</div>`;
    body = body.slice(0, eerste) + blok + body.slice(eindeBlok);
  }

  // 4. een prijsbereik wordt iets om zelf door te schuiven
  const bereik = body.match(/€\s?([\d.]{4,})\s*(?:–|-|tot)\s*€?\s?([\d.]{4,})/);
  if (bereik) {
    const van = parseInt(bereik[1].replace(/\./g, ''), 10);
    const tot = parseInt(bereik[2].replace(/\./g, ''), 10);
    if (isFinite(van) && isFinite(tot) && tot > van) {
      gebruikt.push('bereik');
      const midden = Math.round((van + tot) / 2);
      const stap = Math.max(100, Math.round((tot - van) / 20 / 100) * 100);
      body += `<div class="bgx-bereik" data-op>
<div class="bgx-kop">Wat past bij jouw situatie?</div>
<div class="bgx-uit">€ ${midden.toLocaleString('nl-NL')}</div>
<input type="range" min="${van}" max="${tot}" step="${stap}" value="${midden}" aria-label="Schuif door het prijsbereik">
<div class="bgx-rand"><span>€ ${van.toLocaleString('nl-NL')} · eenvoudig</span><span>€ ${tot.toLocaleString('nl-NL')} · complex</span></div>
<p>Het bedrag hangt af van het aantal velden, het aantal uitzonderingen en of er business rules mee moeten. Na één gesprek weet je in welke helft je zit.</p>
</div>`;
    }
  }

  // 5. heeft de pagina verder niets te rekenen, dan komt de rekenaar erbij die
  //    zijn eigen cijfers gebruikt: elke pagina heeft zo iets om mee te doen.
  if (!gebruikt.includes('bereik')) {
    gebruikt.push('rekenaar');
    body += `<div class="bgx-bereik bgx-rekenaar" data-op>
<div class="bgx-kop">Reken het even na</div>
<div class="bgx-uit" id="rekenUit">€ 203.125</div>
<div class="bgx-rand"><span>per jaar aan capaciteit die opgaat aan zoeken en overtypen</span></div>
<label class="bgx-regel">Medewerkers <output data-uit="mw">25</output>
<input type="range" min="3" max="250" step="1" value="25" data-reken="mw" aria-label="Aantal medewerkers"></label>
<label class="bgx-regel">Zoektijd per dag <output data-uit="min">30</output> min
<input type="range" min="5" max="90" step="5" value="30" data-reken="min" aria-label="Zoektijd per medewerker per dag in minuten"></label>
<label class="bgx-regel">Uurwaarde <output data-uit="uur">65</output> euro
<input type="range" min="35" max="150" step="5" value="65" data-reken="uur" aria-label="Kosten per uur"></label>
<p>250 werkdagen per jaar. Vrijgespeelde tijd is capaciteit, geen gegarandeerde besparing — maar het laat zien waar het over gaat.</p>
</div>`;
  }

  return { body, gebruikt };
}

// ── het portaalbeeld, gebouwd in plaats van gefotografeerd ────────────────
export const PORTAALBEELD = `<div class="bgx-portaalbeeld" data-op aria-label="Voorbeeld van het Bedrijfsgeheugen-portaal">
<div class="balk"><i></i><i></i><i></i></div>
<div class="bgx-net">
<div class="bgx-vak" style="--tot:82%"><div class="bgx-lab">Organisatiebeheersing</div><div class="bgx-cijfer"><span class="bgx-telop" data-waarde="82" data-na="">82</span></div><div class="bgx-sub">score en trend per dimensie</div><div class="bgx-meter"><i></i></div></div>
<div class="bgx-vak" style="--tot:68%"><div class="bgx-lab">Compleetheid</div><div class="bgx-cijfer"><span class="bgx-telop" data-waarde="68">68</span></div><div class="bgx-sub">wat is ingevuld, wat ontbreekt</div><div class="bgx-meter"><i></i></div></div>
<div class="bgx-vak" style="--tot:100%"><div class="bgx-lab">Bronnen</div><div class="bgx-cijfer"><span class="bgx-telop" data-waarde="33">33</span></div><div class="bgx-sub">actief, actueel, herleidbaar</div><div class="bgx-meter"><i></i></div></div>
<div class="bgx-vak" style="--tot:55%"><div class="bgx-lab">Open acties</div><div class="bgx-cijfer"><span class="bgx-telop" data-waarde="24">24</span></div><div class="bgx-sub">met eigenaar en deadline</div><div class="bgx-meter"><i></i></div></div>
<div class="bgx-vak" style="--tot:40%"><div class="bgx-lab">Signalen vandaag</div><div class="bgx-cijfer"><span class="bgx-telop" data-waarde="37">37</span></div><div class="bgx-sub">nieuwe of gewijzigde context</div><div class="bgx-meter"><i></i></div></div>
<div class="bgx-vak" style="--tot:74%"><div class="bgx-lab">Processen geraakt</div><div class="bgx-cijfer"><span class="bgx-telop" data-waarde="12">12</span></div><div class="bgx-sub">opnieuw berekend na wijziging</div><div class="bgx-meter"><i></i></div></div>
</div>
</div>`;

// ═══════════════════════════════════════════════════════════════════════════
// Speelse onderdelen. Elk vertelt iets wat de tekst ook zegt, maar dan zo dat
// je het even voelt. Ze veranderen niets aan wat een zoekmachine leest: alle
// tekst blijft in de HTML staan en alles is met één klik terug te draaien.
// ═══════════════════════════════════════════════════════════════════════════

export const SPEELS_CSS = `<style id="v18-speels"> .bgx-streep{position:relative;display:inline;background-image:linear-gradient(var(--lime),var(--lime));background-repeat:no-repeat;background-position:0 82%;background-size:0% 42%;transition:background-size .85s cubic-bezier(.22,.61,.36,1)}.bgx-streep.bgx-aan{background-size:100% 42%}@media(prefers-reduced-motion:reduce){.bgx-streep{background-size:100% 42%;transition:none}}.bgx-vertrek{max-width:none!important;display:flex;flex-wrap:wrap;align-items:center;gap:14px;justify-content:space-between;background:var(--white);border:1px dashed rgba(39,66,214,.45);border-radius:20px;padding:20px 24px;margin:40px 0}.bgx-vertrek b{display:block;font-size:17px}.bgx-vertrek span{color:var(--muted);font-size:15px}.bgx-vertrek button{background:var(--ink);color:#fff;border:0;border-radius:999px;padding:13px 24px;font:inherit;font-weight:750;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease}.bgx-vertrek button:hover{transform:translateY(-2px);box-shadow:0 14px 34px rgba(7,21,35,.2)}.bgx-weg{opacity:.06;filter:blur(2.5px);transition:opacity .5s ease,filter .5s ease}.bgx-lek{position:fixed;left:18px;bottom:18px;z-index:70;max-width:250px;background:var(--lime);color:var(--ink);border:2px solid var(--ink);border-radius:4px 4px 14px 4px;padding:13px 15px;font-size:13.5px;line-height:1.4;box-shadow:0 16px 40px rgba(7,21,35,.22);transform:translateY(140%) rotate(-2deg);transition:transform .6s cubic-bezier(.22,.61,.36,1)}.bgx-lek.bgx-aan{transform:translateY(0) rotate(-2deg)}.bgx-lek b{display:block;font-size:21px;font-variant-numeric:tabular-nums;letter-spacing:-.01em}.bgx-lek a{color:var(--ink);font-weight:750}.bgx-lek .bgx-dicht{position:absolute;top:4px;right:7px;background:none;border:0;font-size:16px;cursor:pointer;color:rgba(7,21,35,.5)}@media(max-width:700px){.bgx-lek{left:12px;right:12px;max-width:none;bottom:12px}}.inhoud-body .kaart,.inhoud-body .p-kaart,.inhoud-body .tegel,.inhoud-body .blok,.bgx-staptegel{position:relative;overflow:hidden}.inhoud-body .kaart::after,.inhoud-body .p-kaart::after,.inhoud-body .tegel::after,.inhoud-body .blok::after,.bgx-staptegel::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .3s ease;background:radial-gradient(240px circle at var(--mx,50%) var(--my,50%),rgba(39,66,214,.14),transparent 65%)}.inhoud-body .kaart:hover::after,.inhoud-body .p-kaart:hover::after,.inhoud-body .tegel:hover::after,.inhoud-body .blok:hover::after,.bgx-staptegel:hover::after{opacity:1}.bgx-geeltje{position:fixed;top:-60px;width:34px;height:34px;background:var(--lime);border:2px solid var(--ink);border-radius:3px 3px 10px 3px;z-index:200;pointer-events:none;animation:val linear forwards}@keyframes val{to{transform:translateY(112vh) rotate(var(--draai,220deg))}}</style>`;

export const SPEELS_JS = `<script id="v18-speels-js">
(function(){
  var rustig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. markeerstift onder de eerste zin van elke sectie
  var strepen = [].slice.call(document.querySelectorAll('.bgx-streep'));
  function streepBij(){
    strepen.forEach(function(el){
      var r = el.getBoundingClientRect();
      if (r.top < (innerHeight || 800) * .8 && r.bottom > 0) el.classList.add('bgx-aan');
    });
  }

  // 2. de vertrekknop: laat zien wat er wegvalt als kennis in één hoofd zit
  var vertrek = document.querySelector('.bgx-vertrek button');
  if (vertrek) {
    var weg = false;
    vertrek.addEventListener('click', function(){
      var doelen = [].slice.call(document.querySelectorAll('.inhoud-body p, .inhoud-body li, .inhoud-body td'));
      weg = !weg;
      doelen.forEach(function(el, i){
        // vaste verdeling, geen toeval: dezelfde tekst valt elke keer weg
        if ((i * 7 + 3) % 5 < 2) el.classList.toggle('bgx-weg', weg);
      });
      vertrek.textContent = weg ? 'Zet het terug' : 'Laat Peter vertrekken';
      var uitleg = vertrek.parentNode.querySelector('span');
      if (uitleg) uitleg.textContent = weg
        ? 'Dit is wat er onbereikbaar wordt zodra de kennis in één hoofd zat. De tekst staat er nog — je komt er alleen niet meer bij.'
        : 'Twee op de vijf regels van deze pagina verdwijnen. Zo voelt het als kennis niet van het bedrijf is.';
    });
  }

  // 3. het lek telt door zolang je leest
  var lek = document.querySelector('.bgx-lek');
  if (lek && !rustig) {
    var begin = Date.now();
    // 25 mensen, een half uur zoeken per dag, 65 euro per uur, verdeeld over een werkdag van 8 uur
    var perSeconde = 25 * (30/60) * 65 / (8*3600);
    setTimeout(function(){ lek.classList.add('bgx-aan'); }, 4200);
    setInterval(function(){
      var euro = (Date.now() - begin) / 1000 * perSeconde;
      var b = lek.querySelector('b');
      if (b) b.textContent = '€ ' + euro.toLocaleString('nl-NL', {minimumFractionDigits:2, maximumFractionDigits:2});
    }, 120);
    var dicht = lek.querySelector('.bgx-dicht');
    if (dicht) dicht.addEventListener('click', function(){ lek.classList.remove('bgx-aan'); });
  }

  // 4. kaarten volgen de muis
  document.addEventListener('pointermove', function(e){
    var kaart = e.target.closest && e.target.closest('.kaart,.p-kaart,.tegel,.blok,.bgx-staptegel');
    if (!kaart) return;
    var r = kaart.getBoundingClientRect();
    kaart.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    kaart.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, {passive:true});

  // 5. wie 'geheugen' intypt krijgt geeltjes
  var getikt = '';
  addEventListener('keydown', function(e){
    if (e.key.length !== 1) return;
    getikt = (getikt + e.key.toLowerCase()).slice(-9);
    if (getikt !== 'geheugen' && getikt.slice(-8) !== 'geheugen') return;
    getikt = '';
    for (var i = 0; i < 22; i++) {
      var g = document.createElement('span');
      g.className = 'geeltje';
      g.style.left = Math.random() * 96 + 'vw';
      g.style.animationDuration = (2.4 + Math.random() * 2.2) + 's';
      g.style.animationDelay = (Math.random() * .7) + 's';
      g.style.setProperty('--draai', (Math.random() * 720 - 360) + 'deg');
      document.body.appendChild(g);
      setTimeout(function(el){ return function(){ el.remove(); }; }(g), 5200);
    }
  });

  document.addEventListener('scroll', streepBij, true);
  addEventListener('resize', streepBij);
  streepBij();
})();
</script>`;

export const LEK = `<aside class="bgx-lek" aria-live="off">
<button class="bgx-dicht" type="button" aria-label="Sluiten">×</button>
Sinds je deze pagina opende, is er bij een bedrijf van 25 man dit aan zoektijd verdampt:
<b>€ 0,00</b>
<a href="/zelfscan">Reken het na →</a>
</aside>`;

export const VERTREK = `<div class="bgx-vertrek" data-op>
<div>
<b>Wat als Peter vertrekt?</b>
<span>Twee op de vijf regels van deze pagina verdwijnen. Zo voelt het als kennis niet van het bedrijf is.</span>
</div>
<button type="button">Laat Peter vertrekken</button>
</div>`;

// de eerste zin na elke h2 krijgt de markeerstift
export function zetStrepen(body) {
  let n = 0;
  return body.replace(/(<h2[^>]*>[\s\S]*?<\/h2>\s*)<p([^>]*)>([\s\S]*?)<\/p>/g, (heel, kop, attrs, tekst) => {
    if (n >= 4 || /<(a|span|strong)\b/.test(tekst.slice(0, 90))) return heel;
    const punt = tekst.indexOf('. ');
    if (punt < 25 || punt > 190) return heel;
    n++;
    return `${kop}<p${attrs}><span class="bgx-streep">${tekst.slice(0, punt + 1)}</span>${tekst.slice(punt + 1)}</p>`;
  });
}

// ── de merknaam krijgt overal een hoofdletter ─────────────────────────────
// "Bedrijfsgeheugen" is de naam van het bedrijf. "een bedrijfsgeheugen" is een
// gewoon woord en blijft dus klein: het lidwoord ervoor bepaalt welke het is.
const KLEIN_ERVOOR = /(?:een|het|je|jouw|dit|dat|ons|onze|uw|hun|zijn|haar|elk|ieder|geen|goed|werkend|levend|volledig|eigen|als)\s+$/i;

export function hoofdletterMerk(html) {
  // alleen in zichtbare tekst, nooit in adressen of attributen: een hoofdletter
  // in een url maakt de link stuk
  return html.replace(/>([^<]+)</g, (heel, tekst) => {
    const nieuw = tekst.replace(/(^|[\s(\[«"'—])bedrijfsgeheugen\b/g, (m, voor, i) => {
      const ervoor = tekst.slice(Math.max(0, i - 24), i + voor.length);
      return KLEIN_ERVOOR.test(ervoor) ? m : voor + 'Bedrijfsgeheugen';
    });
    return '>' + nieuw + '<';
  });
}


// ── vraag het aan de pagina ───────────────────────────────────────────────
// Een kleine versie van waar het portaal voor bedoeld is: stel een vraag en het
// antwoord licht op, met de plek erbij. Werkt op de tekst die er al staat.
export const VRAAG_CSS = `<style id="v18-vraag"> .bgx-vraagbalk{max-width:none!important;background:var(--white);border:1px solid var(--line);border-radius:20px;padding:18px 20px;margin:0 0 34px;box-shadow:0 1px 2px rgba(7,21,35,.04),0 16px 40px rgba(7,21,35,.06)}.bgx-vraagbalk .bgx-kop{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:#C2410C;margin-bottom:10px}.bgx-vraagbalk .bgx-veld{display:flex;gap:10px;align-items:center}.bgx-vraagbalk input{flex:1;font:inherit;font-size:16px;border:1px solid var(--line);border-radius:999px;padding:12px 18px;background:var(--paper)}.bgx-vraagbalk input:focus{outline:2px solid var(--blue);outline-offset:1px}.bgx-vraagbalk .bgx-uitslag{font-size:14.5px;color:var(--muted);margin-top:10px;min-height:20px}.bgx-vraagbalk .bgx-uitslag a{font-weight:700}.bgx-vraagbalk .bgx-tips{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.bgx-vraagbalk .bgx-tips button{background:var(--paper);border:1px solid var(--line);border-radius:999px;padding:7px 14px;font:inherit;font-size:13.5px;cursor:pointer;color:var(--ink2)}.bgx-vraagbalk .bgx-tips button:hover{border-color:var(--blue);color:var(--blue)}.bgx-gevonden{background:linear-gradient(var(--lime),var(--lime));background-repeat:no-repeat;background-position:0 82%;background-size:100% 42%}.bgx-overtyp{max-width:none!important;background:linear-gradient(135deg,#071a3c,#12316c);color:#fff;border-radius:22px;padding:26px;margin:34px 0}.bgx-overtyp .bgx-kop{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--lime)}.bgx-overtyp .bgx-bron{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:19px;letter-spacing:.09em;margin:12px 0;background:rgba(255,255,255,.09);border-radius:12px;padding:12px 16px;user-select:none}.bgx-overtyp input{width:100%;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:18px;letter-spacing:.09em;border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.06);color:#fff;border-radius:12px;padding:12px 16px}.bgx-overtyp input:focus{outline:2px solid var(--lime)}.bgx-overtyp .bgx-uit{margin-top:14px;font-size:15px;color:rgba(255,255,255,.86);min-height:24px}.bgx-overtyp .bgx-uit b{color:var(--lime)}.bgx-overtyp.bgx-fout input{border-color:#ff8f6b}</style>`;

export const VRAAGBALK = `<div class="bgx-vraagbalk" data-op>
<div class="bgx-kop">Vraag het deze pagina</div>
<div class="bgx-veld"><input type="search" placeholder="Bijvoorbeeld: wat kost het?" aria-label="Zoek een antwoord op deze pagina"></div>
<div class="bgx-uitslag"></div>
<div class="bgx-tips"></div>
</div>`;

export const OVERTYP = `<div class="bgx-overtyp" data-op>
<div class="bgx-kop">Even zelf doen</div>
<p style="color:#fff;font-size:17px;margin:8px 0 0">Typ dit ordernummer over. Eén keer is te doen. Veertig keer per dag, elke dag, is een baan.</p>
<div class="bgx-bron" id="overtypBron">NL-2026-8841-KX</div>
<input type="text" id="overtypVeld" autocomplete="off" spellcheck="false" aria-label="Typ het ordernummer over">
<div class="bgx-uit" id="overtypUit">De klok loopt zodra je begint.</div>
</div>`;

export const VRAAG_JS = `<script id="v18-vraag-js">
(function(){
  // vraag het deze pagina
  var balk = document.querySelector('.bgx-vraagbalk');
  if (balk) {
    var veld = balk.querySelector('input');
    var uitslag = balk.querySelector('.bgx-uitslag');
    var tips = balk.querySelector('.bgx-tips');
    var stukken = [].slice.call(document.querySelectorAll('.inhoud-body h2, .inhoud-body h3, .inhoud-body p, .inhoud-body li'));

    // de koppen van de pagina als kant-en-klare vragen
    [].slice.call(document.querySelectorAll('.inhoud-body h2')).slice(0, 3).forEach(function(h){
      var k = document.createElement('button');
      k.type = 'button';
      k.textContent = h.textContent.trim().slice(0, 34);
      k.addEventListener('click', function(){ veld.value = k.textContent; zoek(); });
      tips.appendChild(k);
    });

    function zoek(){
      var vraag = veld.value.toLowerCase().replace(/[?.,!]/g, ' ');
      document.querySelectorAll('.bgx-gevonden').forEach(function(e){ e.classList.remove('bgx-gevonden'); });
      if (vraag.trim().length < 3) { uitslag.textContent = ''; return; }
      var woorden = vraag.split(/\\s+/).filter(function(w){ return w.length > 3; });
      if (!woorden.length) { uitslag.textContent = ''; return; }

      var beste = null, besteScore = 0;
      stukken.forEach(function(el){
        var t = (el.textContent || '').toLowerCase();
        var score = woorden.reduce(function(s, w){ return s + (t.indexOf(w) > -1 ? 1 : 0); }, 0);
        if (score > besteScore) { besteScore = score; beste = el; }
      });

      if (!beste) {
        uitslag.innerHTML = 'Daar zegt deze pagina niets over. <a href="/contact">Stel je vraag rechtstreeks →</a>';
        return;
      }
      beste.classList.add('bgx-gevonden');
      beste.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var kop = beste.closest('section') ? (beste.previousElementSibling || {}) : {};
      uitslag.innerHTML = 'Gevonden — gemarkeerd hieronder. Precies zo werkt het portaal, alleen dan over je eigen bedrijf. <a href="/product">Bekijk het portaal →</a>';
    }
    veld.addEventListener('input', zoek);
    veld.addEventListener('keydown', function(e){ if (e.key === 'Enter') { e.preventDefault(); zoek(); } });
  }

  // overtypen
  var bron = document.getElementById('overtypBron');
  var invoer = document.getElementById('overtypVeld');
  var uit = document.getElementById('overtypUit');
  if (bron && invoer && uit) {
    var start = null;
    invoer.addEventListener('input', function(){
      if (start === null) start = Date.now();
      var doel = bron.textContent.trim();
      var nu = invoer.value;
      var goed = doel.indexOf(nu) === 0;
      invoer.parentNode.classList.toggle('bgx-fout', !goed);
      if (!goed) { uit.innerHTML = 'Er zit een tikfout in. <b>Precies dat</b> is wat later niemand terugvindt.'; return; }
      if (nu === doel) {
        var sec = (Date.now() - start) / 1000;
        var perDag = sec * 40 / 60;
        var perJaar = Math.round(perDag * 250 / 60);
        uit.innerHTML = 'Dat kostte je <b>' + sec.toFixed(1) + ' seconden</b>. Veertig orders per dag is <b>'
          + perDag.toFixed(1) + ' minuten</b> per dag en ongeveer <b>' + perJaar + ' uur</b> per jaar — voor één handeling. '
          + '<a href="/zelfscan" style="color:#fff">Reken je eigen situatie na →</a>';
      } else {
        uit.textContent = 'Goed bezig, doortypen.';
      }
    });
  }
})();
</script>`;
