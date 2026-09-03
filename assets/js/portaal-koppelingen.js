/* Koppelingen in het klantportaal. Additief: dit bestand voegt alleen toe.
   Zonder een container met id "koppelingen-blok" doet het niets, en het raakt
   geen bestaande knoppen, schermen of localStorage-sleutels aan.
   Bron: /api/koppelingen (Netlify Identity + de bestaande portaalprojectie). */
(function () {
  'use strict';
  var PAD = '/api/koppelingen';

  function vak() { return document.getElementById('koppelingen-blok'); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function datum(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleString('nl-NL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  }
  var RITME = { kwartier: 'elk kwartier', uur: 'elk uur', dag: 'dagelijks', week: 'wekelijks', maand: 'maandelijks', hand: 'handmatig' };

  function toon(html) { var v = vak(); if (v) v.innerHTML = html; }

  function tekenLeeg() {
    toon(
      '<h2>Je koppelingen</h2>' +
      '<p>Hier staat nog niets. Zodra er een koppeling draait, zie je per bron wanneer de laatste ronde was ' +
      'en hoeveel er is binnengehaald.</p>'
    );
  }

  function teken(lijst, bijgewerkt) {
    if (!lijst || !lijst.length) return tekenLeeg();
    var draait = lijst.filter(function (k) { return k && k.status === 'draait'; }).length;
    var rijen = lijst.map(function (k) {
      var naam = esc(k.naam || k.sleutel || 'Koppeling');
      var ritme = RITME[k.ritme] || esc(k.ritme || '');
      var laatst = datum(k.laatsteRonde);
      var regels = Number(k.verwerkt) || 0;
      var mis = Number(k.laatsteMislukt) || 0;
      return '<li data-sleutel="' + esc(k.sleutel || '') + '">' +
        '<strong>' + naam + '</strong>' +
        '<span> · ' + (k.status === 'draait' ? ritme : 'nog instellen') + '</span>' +
        (laatst ? '<span> · laatste ronde ' + esc(laatst) + '</span>' : '') +
        (regels ? '<span> · ' + regels.toLocaleString('nl-NL') + ' regels</span>' : '') +
        (mis ? '<span data-mislukt="1"> · ' + mis + ' mislukt, even nakijken</span>' : '') +
        '</li>';
    }).join('');
    toon(
      '<h2>Je koppelingen</h2>' +
      '<p>' + draait + ' van ' + lijst.length + ' koppelingen draaien' +
      (bijgewerkt ? ' · bijgewerkt ' + esc(datum(bijgewerkt)) : '') + '.</p>' +
      '<ul>' + rijen + '</ul>'
    );
  }

  function haal() {
    return fetch(PAD, { credentials: 'same-origin', headers: { accept: 'application/json' } })
      .then(function (r) {
        if (r.status === 401 || r.status === 403 || r.status === 404) return null;
        if (!r.ok) throw new Error('koppelingen ' + r.status);
        return r.json();
      });
  }

  function start() {
    if (!vak()) return;
    haal().then(function (data) {
      if (!data) { tekenLeeg(); return; }
      teken(data.koppelingen || [], data.updatedAt);
    }).catch(function () {
      toon('<h2>Je koppelingen</h2><p>Je koppelingen zijn nu even niet op te halen. Probeer het later opnieuw.</p>');
    });
  }

  /* Publiek, zodat andere schermen een ronde of wijziging kunnen melden zonder
     dit bestand te hoeven kennen. Faalt stil als er niets is ingericht. */
  window.bgKoppelingen = {
    lijst: haal,
    meld: function (payload) {
      return fetch(PAD, {
        method: 'POST', credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload || {})
      }).then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { if (d && d.koppelingen) teken(d.koppelingen, ''); return d; })
        .catch(function () { return null; });
    },
    verversen: start
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
