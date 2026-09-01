/* bronsync.js — haalt bijgewerkte kerncijfers uit Supabase en maakt zichtbaar
   wat er is gewijzigd, waar het doorwerkt en waarom.

   Het origineel blijft staan. ONDERZOEK in klantportaal.html is en blijft de
   basis. Deze module legt er alleen een laag overheen voor blokken die
   daadwerkelijk zijn bijgewerkt. Valt Supabase weg, dan ziet de bezoeker
   precies het portaal zoals het nu is.
*/
(function () {
  'use strict';

  var URL_BASIS = 'https://adhjwmvyoixzjtmiroln.supabase.co';
  var SLEUTEL = 'sb_publishable_W5aGMsfbZE4H7GraIR4oMQ_gV-x0xWL';

  window.BRONSYNC = { blokken: {}, wijzigingen: [], geladen: false };

  function haal(pad) {
    return fetch(URL_BASIS + '/rest/v1/' + pad, {
      headers: { apikey: SLEUTEL, Authorization: 'Bearer ' + SLEUTEL },
      cache: 'no-cache'
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); });
  }

  function sleutel(t) {
    return (t || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
  }

  function datumNL(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function veilig(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* Alleen http(s) toestaan; javascript: en data: worden geweigerd */
  function veiligeUrl(u) {
    if (!u) return null;
    return /^https?:\/\//i.test(String(u).trim()) ? String(u).trim() : null;
  }

  /* Bronlink: naam van de uitgever, eerlijk gelabeld als hij via Google News loopt */
  function bronLink(b) {
    var naam = veilig(b.bronvermelding || 'de publicatie');
    var href = veiligeUrl(b.laatste_publicatie_url);
    if (!href) return naam;
    var suffix = b.bron_via_google ? ' <span class="viagoogle">(via Google News)</span>' : '';
    return '<a href="' + veilig(href) + '" target="_blank" rel="noopener">' + naam + '</a>' + suffix;
  }

  function markering(b) {
    if (!b || !b.recent_gewijzigd) return '';
    var plekken = (b.werkt_door_in || []).map(veilig).join(' · ');
    return '<div class="bijgewerkt">'
      + '<div class="bijgewerkt-kop"><span class="stip"></span>Bijgewerkt op ' + datumNL(b.gewijzigd_op) + '</div>'
      + '<div class="bijgewerkt-regel"><span class="was">Origineel: ' + veilig(b.vorig_cijfer || '—') + '</span>'
      + '<span class="pijl">&rarr;</span><span class="nu">Nu: ' + veilig(b.huidig_cijfer || '—') + '</span></div>'
      + '<div class="bijgewerkt-waarom"><b>Waarom:</b> nieuwe publicatie — ' + bronLink(b) + '</div>'
      + (plekken ? '<div class="bijgewerkt-waar"><b>Werkt door in:</b> ' + plekken + '</div>' : '')
      + '</div>';
  }

  function kaartenBijwerken() {
    var tegels = document.querySelectorAll('.ondtegel');
    Array.prototype.forEach.call(tegels, function (tegel) {
      if (tegel.dataset.bronsync) return;
      var titelEl = tegel.querySelector('.titel');
      if (!titelEl) return;
      var b = window.BRONSYNC.blokken[sleutel(titelEl.textContent)];
      if (!b || !b.recent_gewijzigd) return;

      tegel.dataset.bronsync = '1';
      tegel.classList.add('is-bijgewerkt');

      var cijferEl = tegel.querySelector('.cijfer');
      if (cijferEl && b.huidig_cijfer && b.vorig_cijfer) {
        cijferEl.innerHTML = '<span class="cijfer-origineel" title="oorspronkelijke waarde">'
          + veilig(b.vorig_cijfer) + '</span> ' + veilig(b.huidig_cijfer);
      }
      var advies = tegel.querySelector('.doen');
      if (advies) advies.insertAdjacentHTML('beforebegin', markering(b));
      else tegel.insertAdjacentHTML('beforeend', markering(b));
    });
  }

  /* Rood bolletje op de filterknop van elk onderdeel met een bijgewerkte bron */
  function bolletjesOpFilter() {
    var fb = document.getElementById('ondFilter');
    if (!fb) return;
    var dims = {};
    Object.keys(window.BRONSYNC.blokken).forEach(function (k) {
      var b = window.BRONSYNC.blokken[k];
      if (b && b.recent_gewijzigd && b.dimensie) dims[b.dimensie] = 1;
    });
    fb.querySelectorAll('[data-f]').forEach(function (knop) {
      var f = knop.dataset.f;
      var hoort = dims[f] || (f === 'alles' && Object.keys(dims).length);
      var bestaand = knop.querySelector('.bolletje');
      if (hoort && !bestaand) knop.insertAdjacentHTML('beforeend', '<span class="bolletje" title="bron bijgewerkt"></span>');
      else if (!hoort && bestaand) bestaand.remove();
    });
  }

  function baken() {
    var w = window.BRONSYNC.wijzigingen.filter(function (x) {
      return x && x.blok && x.nu;
    });
    if (!w.length) return;
    var doel = document.getElementById('ondBlok');
    if (!doel || document.getElementById('bronsyncBaken')) return;

    var plekken = {};
    w.forEach(function (x) { (x.werkt_door_in || []).forEach(function (p) { plekken[p] = 1; }); });

    var html = '<div id="bronsyncBaken" class="baken">'
      + '<b>' + w.length + ' ' + (w.length === 1 ? 'cijfer is' : 'cijfers zijn')
      + ' bijgewerkt op basis van nieuwe publicaties.</b> '
      + 'Dat werkt door in: ' + Object.keys(plekken).map(veilig).join(' · ') + '. '
      + 'De oorspronkelijke waarden blijven bij elk cijfer zichtbaar.'
      + '<ul>' + w.map(function (x) {
        return '<li>' + veilig(x.blok) + ' — <span class="was">' + veilig(x.origineel || '—')
          + '</span> &rarr; <b>' + veilig(x.nu) + '</b>'
          + (veiligeUrl(x.bron_url) ? ' · <a href="' + veilig(veiligeUrl(x.bron_url)) + '" target="_blank" rel="noopener">bron</a>' : '')
          + '</li>';
      }).join('') + '</ul></div>';

    doel.insertAdjacentHTML('beforebegin', html);
  }

  var stijl = '<style>'
    + '.ondtegel.is-bijgewerkt{border-color:var(--rood)}'
    + '.cijfer-origineel{text-decoration:line-through;opacity:.4;font-weight:800;font-size:1.2rem;margin-right:.4rem}'
    + '.bijgewerkt{padding:.6rem .7rem;border-left:3px solid var(--rood);background:#FDF0EF;font-size:.82rem;line-height:1.5}'
    + '.bijgewerkt-kop{font-weight:700;display:flex;align-items:center;gap:.4rem}'
    + '.bijgewerkt .stip{width:.45rem;height:.45rem;border-radius:50%;background:var(--rood);display:inline-block}'
    + '.bijgewerkt-regel{margin:.3rem 0}'
    + '.bijgewerkt .was{text-decoration:line-through;color:#8A94A3}'
    + '.bijgewerkt .pijl{margin:0 .4rem;color:#8A94A3}'
    + '.bijgewerkt .nu{font-weight:700}'
    + '.bijgewerkt-waarom,.bijgewerkt-waar{color:#5A6473;font-size:.78rem;margin-top:.15rem}'
    + '.bijgewerkt a{color:inherit}'
    + '.baken{margin:0 0 1.1rem;padding:.9rem 1.05rem;border:1px solid var(--lijn);border-left:3px solid var(--rood);border-radius:8px;background:var(--papier);font-size:.88rem;line-height:1.55}'
    + '.baken ul{margin:.5rem 0 0;padding-left:1.1rem}'
    + '.baken li{margin:.2rem 0}'
    + '.baken .was{text-decoration:line-through;color:#8A94A3}'
    + '#ondFilter button .bolletje{width:.45rem;height:.45rem;border-radius:50%;background:var(--rood);display:inline-block;margin-left:.35rem;vertical-align:middle}'
    + '</style>';

  function start() {
    document.head.insertAdjacentHTML('beforeend', stijl);

    Promise.all([
      haal('kerncijfers_publiek?select=*'),
      haal('wijzigingen_publiek?select=*&order=gewijzigd_op.desc')
    ]).then(function (res) {
      res[0].forEach(function (b) { window.BRONSYNC.blokken[sleutel(b.titel)] = b; });
      window.BRONSYNC.wijzigingen = res[1] || [];
      window.BRONSYNC.geladen = true;

      baken();
      kaartenBijwerken();
      bolletjesOpFilter();

      var doel = document.getElementById('ondBlok');
      if (doel && window.MutationObserver) {
        new MutationObserver(function(){ kaartenBijwerken(); bolletjesOpFilter(); }).observe(doel, { childList: true });
      }
    }).catch(function () {
      /* Stil falen: het portaal toont het origineel, precies zoals nu. */
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
