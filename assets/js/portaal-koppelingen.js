/* Koppelingen in het klantportaal. Additief: dit bestand voegt alleen toe.
   Zonder een container met id "koppelingen-blok" doet het niets, en het raakt
   geen bestaande knoppen, schermen of localStorage-sleutels aan.
   Bron: /api/koppelingen (Netlify Identity + de bestaande portaalprojectie). */
(function () {
  'use strict';
  var PAD = '/api/koppelingen';
  var wizardMountBezig = false;
  var COMPLIANCE_URL = 'https://www.bedrijfsgeheugen.nl/portal-next/compliance.html';

  function klantSlug() {
    try { return new URLSearchParams(window.location.search).get('klant') || ''; }
    catch (_) { return ''; }
  }

  function zorgComplianceEntry() {
    var beleidTrigger = document.querySelector('[data-p="beleid"], [data-p=beleid]');
    if (!beleidTrigger) return;
    var bestaand = document.querySelector('[data-bg-compliance-command-center]');
    if (bestaand) return;
    var link = document.createElement('a');
    var klant = klantSlug();
    link.setAttribute('data-bg-compliance-command-center', '1');
    link.className = beleidTrigger.className || '';
    link.href = COMPLIANCE_URL + (klant ? '?klant=' + encodeURIComponent(klant) : '');
    link.textContent = 'Compliance Command Center';
    link.setAttribute('aria-label', 'Open Compliance Command Center');
    beleidTrigger.insertAdjacentElement('afterend', link);
  }

  /* Het paneel #p-koppelingen wordt door het portaal zelf gevuld en blijft dat
     controleren. We hangen ons blok er daarom pas onderaan bij zodra die vulling
     klaar is, en zetten het terug als het wordt weggehaald. Nooit vervangen. */
  function vak() {
    var v = document.getElementById('koppelingen-blok');
    if (v && v.isConnected) return v;
    var paneel = document.getElementById('p-koppelingen');
    if (!paneel) return null;
    if (paneel.getAttribute('data-bg') !== 'klaar' && paneel.innerHTML.length < 300) return null;
    v = document.createElement('section');
    v.id = 'koppelingen-blok';
    v.className = 'kaart';
    v.style.marginTop = '1rem';
    paneel.appendChild(v);
    return v;
  }
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

  function zorgWizardVak(v) {
    if (!v) return null;
    var w = v.querySelector('[data-bg-wizard-host]');
    if (!w) {
      w = document.createElement('div');
      w.setAttribute('data-bg-wizard-host', '1');
      v.appendChild(w);
    }
    return w;
  }

  function mountWizard() {
    var v = vak();
    var host = zorgWizardVak(v);
    if (!host || host.querySelector('[data-bg-wizard]') || wizardMountBezig) return;
    wizardMountBezig = true;
    import('/assets/js/koppelingen/view.js')
      .then(function (m) { if (host.isConnected && !host.querySelector('[data-bg-wizard]')) m.mountConnectorWizard(host); })
      .catch(function () {
        if (host.isConnected) host.innerHTML = '<p class="sub">De koppelbouwer kon niet worden geladen. Je bestaande koppelingen blijven beschikbaar.</p>';
      })
      .finally(function () { wizardMountBezig = false; });
  }

  function toonOverzicht(html) {
    var v = vak();
    if (!v) return;
    var overzicht = v.querySelector('[data-bg-koppelingen-overzicht]');
    if (!overzicht) {
      overzicht = document.createElement('div');
      overzicht.setAttribute('data-bg-koppelingen-overzicht', '1');
      v.insertBefore(overzicht, v.firstChild);
    }
    overzicht.innerHTML = html;
    mountWizard();
  }

  function tekenLeeg() {
    toonOverzicht(
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
    toonOverzicht(
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
    zorgComplianceEntry();
    if (!vak()) return;
    mountWizard();
    haal().then(function (data) {
      if (!data) { tekenLeeg(); return; }
      teken(data.koppelingen || [], data.updatedAt);
    }).catch(function () {
      toonOverzicht('<h2>Je koppelingen</h2><p>Je koppelingen zijn nu even niet op te halen. Probeer het later opnieuw.</p>');
    });
  }

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

  var pogingen = 0;
  var klok = setInterval(function () {
    pogingen++;
    zorgComplianceEntry();
    if (vak()) { start(); }
    if (pogingen > 60) clearInterval(klok);
  }, 700);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
