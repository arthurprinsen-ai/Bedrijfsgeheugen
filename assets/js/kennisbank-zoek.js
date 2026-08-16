/* Kennisbank-zoekbalk voor bedrijfsgeheugen.nl
 *
 * Plaatsing: zet waar je de balk wilt hebben een leeg element neer
 *
 *   <div data-kennisbank-zoek></div>
 *   <script src="/assets/js/kennisbank-zoek.js" defer></script>
 *
 * Geen dependencies. Werkt zonder build.
 */
(function () {
  'use strict';

  var VOORBEELDEN = [
    'Geldt de AI Act voor mijn bedrijf?',
    'Wat kost een AFAS-koppeling?',
    'Mag ik klantgegevens in ChatGPT zetten?',
    'Hoe lang duurt een bedrijfsscan?',
  ];

  var STIJL = [
    '.kbz{--kbz-lijn:#e3e6ea;--kbz-blauw:#1a4fd6;--kbz-grijs:#5b6470;max-width:680px;margin:0 auto;font:inherit}',
    '.kbz__rij{display:flex;gap:8px;align-items:stretch}',
    '.kbz__veld{flex:1;padding:14px 16px;border:1px solid var(--kbz-lijn);border-radius:10px;font:inherit;font-size:16px;background:#fff;color:inherit}',
    '.kbz__veld:focus{outline:2px solid var(--kbz-blauw);outline-offset:1px;border-color:transparent}',
    '.kbz__knop{padding:14px 22px;border:0;border-radius:10px;background:var(--kbz-blauw);color:#fff;font:inherit;font-weight:600;font-size:15px;cursor:pointer}',
    '.kbz__knop:hover{filter:brightness(1.08)}',
    '.kbz__knop:disabled{opacity:.55;cursor:default}',
    '.kbz__tips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}',
    '.kbz__tip{padding:6px 12px;border:1px solid var(--kbz-lijn);border-radius:999px;background:#fff;font:inherit;font-size:13px;color:var(--kbz-grijs);cursor:pointer}',
    '.kbz__tip:hover{border-color:var(--kbz-blauw);color:var(--kbz-blauw)}',
    '.kbz__uit{margin-top:18px;padding:20px;border:1px solid var(--kbz-lijn);border-radius:12px;background:#fbfcfd;line-height:1.6}',
    '.kbz__uit[hidden]{display:none}',
    '.kbz__bronnen{margin-top:14px;padding-top:12px;border-top:1px solid var(--kbz-lijn);font-size:14px}',
    '.kbz__bronnen b{display:block;margin-bottom:6px;color:var(--kbz-grijs);font-weight:600;font-size:13px}',
    '.kbz__bronnen a{display:block;margin-bottom:3px;color:var(--kbz-blauw)}',
    '.kbz__klein{margin-top:10px;font-size:12px;color:var(--kbz-grijs)}',
    '@media(max-width:560px){.kbz__rij{flex-direction:column}}',
  ].join('');

  function stijlPlaatsen() {
    if (document.getElementById('kbz-stijl')) return;
    var s = document.createElement('style');
    s.id = 'kbz-stijl';
    s.textContent = STIJL;
    document.head.appendChild(s);
  }

  function bouw(houder) {
    houder.className = (houder.className ? houder.className + ' ' : '') + 'kbz';
    houder.innerHTML =
      '<div class="kbz__rij">' +
      '<input class="kbz__veld" type="search" placeholder="Stel een vraag over digitalisering, AI of koppelingen" aria-label="Stel een vraag over deze site">' +
      '<button class="kbz__knop" type="button">Vraag het</button>' +
      '</div>' +
      '<div class="kbz__tips"></div>' +
      '<div class="kbz__uit" hidden aria-live="polite"></div>' +
      '<p class="kbz__klein">Antwoorden komen uit de pagina\u2019s van deze site. Geen juridisch advies.</p>';

    var veld = houder.querySelector('.kbz__veld');
    var knop = houder.querySelector('.kbz__knop');
    var tips = houder.querySelector('.kbz__tips');
    var uit = houder.querySelector('.kbz__uit');

    VOORBEELDEN.forEach(function (v) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'kbz__tip';
      b.textContent = v;
      b.addEventListener('click', function () {
        veld.value = v;
        vragen();
      });
      tips.appendChild(b);
    });

    function toon(html) {
      uit.hidden = false;
      uit.innerHTML = html;
    }

    function ontsmet(t) {
      var d = document.createElement('div');
      d.textContent = t;
      return d.innerHTML;
    }

    var bezig = false;

    function vragen() {
      var vraag = veld.value.trim();
      if (vraag.length < 3 || bezig) return;

      bezig = true;
      knop.disabled = true;
      knop.textContent = 'Even zoeken\u2026';
      toon('<p style="color:#5b6470">Ik kijk het na op de site\u2026</p>');

      fetch('/api/vraag', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ vraag: vraag }),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (d) {
          if (d.fout) {
            toon('<p>' + ontsmet(d.fout) + '</p>');
            return;
          }
          var html = ontsmet(d.antwoord).replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>');
          html = '<p>' + html + '</p>';

          if (d.bronnen && d.bronnen.length) {
            html += '<div class="kbz__bronnen"><b>Lees verder</b>';
            d.bronnen.forEach(function (b) {
              html += '<a href="' + ontsmet(b.url) + '">' + ontsmet(b.titel) + '</a>';
            });
            html += '</div>';
          }
          toon(html);
        })
        .catch(function () {
          toon('<p>Er ging iets mis. Probeer het zo nog eens, of gebruik de contactpagina.</p>');
        })
        .finally(function () {
          bezig = false;
          knop.disabled = false;
          knop.textContent = 'Vraag het';
        });
    }

    knop.addEventListener('click', vragen);
    veld.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        vragen();
      }
    });
  }

  function start() {
    var houders = document.querySelectorAll('[data-kennisbank-zoek]');
    if (!houders.length) return;
    stijlPlaatsen();
    Array.prototype.forEach.call(houders, bouw);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
