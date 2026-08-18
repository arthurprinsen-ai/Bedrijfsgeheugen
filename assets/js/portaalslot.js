/* portaalslot.js — de offerte komt pas na inloggen, en pas uit Supabase.

   Waarom: __KLANTEN__ stond met prijzen en al in de broncode van elke
   bezoeker. De controle gebeurde in de browser, en dat is geen controle.
   Nu bepaalt de server (RLS) wie welke offerte krijgt.

   Werking: na inloggen wordt de offerte van de eigen organisatie opgehaald
   en in sessionStorage van dit tabblad gezet. De pagina laadt daarna opnieuw;
   de kleine bootstrap in klantportaal.html zet hem synchroon terug in
   window.__KLANTEN__, zodat alle bestaande code ongewijzigd blijft werken.
   Tabblad dicht = offerte weg.
*/
(function () {
  'use strict';

  var URL_BASIS = 'https://adhjwmvyoixzjtmiroln.supabase.co';
  var SLEUTEL = 'sb_publishable_W5aGMsfbZE4H7GraIR4oMQ_gV-x0xWL';
  var BEWAAR = 'bg_klant_';
  var TOKEN = 'bg_token';

  function slug() {
    return new URLSearchParams(location.search).get('klant') || '';
  }

  function veilig(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function api(pad, opties) {
    opties = opties || {};
    opties.headers = Object.assign({
      apikey: SLEUTEL,
      'Content-Type': 'application/json'
    }, opties.headers || {});
    return fetch(URL_BASIS + pad, opties).then(function (r) {
      return r.json().then(function (j) {
        return r.ok ? j : Promise.reject(j);
      });
    });
  }

  function inloggen(email, wachtwoord) {
    return api('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email: email, password: wachtwoord })
    });
  }

  /* Haalt de offerte van de organisatie achter deze slug. RLS geeft niets
     terug als de ingelogde gebruiker daar niet bij hoort. */
  function haalOfferte(token, s) {
    var kop = { Authorization: 'Bearer ' + token };
    return api('/rest/v1/organisaties?slug=eq.' + encodeURIComponent(s) + '&select=id,naam', { headers: kop })
      .then(function (orgs) {
        if (!orgs.length) return Promise.reject({ message: 'onbekend portaal' });
        return api('/rest/v1/offertes?organisatie_id=eq.' + orgs[0].id + '&select=inhoud,nummer,status&order=aangemaakt_op.desc&limit=1', { headers: kop })
          .then(function (off) {
            if (!off.length) return Promise.reject({ message: 'geen toegang' });
            var k = off[0].inhoud || {};
            k.naam = k.naam || orgs[0].naam;
            return k;
          });
      });
  }

  function bewaar(s, klant, token) {
    try {
      sessionStorage.setItem(BEWAAR + s, JSON.stringify(klant));
      sessionStorage.setItem(TOKEN, token);
    } catch (e) {}
  }

  function wissen() {
    try {
      Object.keys(sessionStorage).forEach(function (k) {
        if (k.indexOf(BEWAAR) === 0 || k === TOKEN) sessionStorage.removeItem(k);
      });
    } catch (e) {}
  }

  var stijl = '<style>'
    + '#bgSlot{margin:1.1rem auto 0;max-width:20rem;text-align:left}'
    + '#bgSlot label{display:block;font-size:.82rem;font-weight:600;margin:.6rem 0 .2rem}'
    + '#bgSlot input{width:100%;padding:.6rem .7rem;border:1px solid var(--lijn);border-radius:8px;font:inherit}'
    + '#bgSlot .knop{width:100%;margin-top:.9rem}'
    + '#bgSlotFout{color:var(--rood);font-size:.84rem;margin-top:.6rem;min-height:1.2em}'
    + '</style>';

  function toonInlog(s) {
    var poort = document.getElementById('poort');
    if (!poort || document.getElementById('bgSlot')) return;

    var login = document.getElementById('btnLogin');
    var zonder = document.getElementById('btnZonder');
    if (login) login.hidden = true;
    if (zonder && zonder.parentNode) zonder.parentNode.hidden = true;

    document.head.insertAdjacentHTML('beforeend', stijl);
    var uitleg = document.getElementById('poortUitleg');
    var doel = uitleg || poort;
    doel.insertAdjacentHTML('beforebegin',
      '<div id="bgSlot">'
      + '<label for="bgMail">E-mailadres</label>'
      + '<input id="bgMail" type="email" autocomplete="username" inputmode="email">'
      + '<label for="bgWw">Wachtwoord</label>'
      + '<input id="bgWw" type="password" autocomplete="current-password">'
      + '<button class="knop" id="bgIn">Inloggen</button>'
      + '<div id="bgSlotFout" role="alert"></div>'
      + '</div>');

    var fout = document.getElementById('bgSlotFout');
    var knop = document.getElementById('bgIn');

    function probeer() {
      var mail = (document.getElementById('bgMail').value || '').trim();
      var ww = document.getElementById('bgWw').value || '';
      if (!mail || !ww) { fout.textContent = 'Vul je e-mailadres en wachtwoord in.'; return; }

      knop.disabled = true;
      fout.textContent = 'Bezig met inloggen…';

      inloggen(mail, ww)
        .then(function (sessie) { return haalOfferte(sessie.access_token, s).then(function (k) { bewaar(s, k, sessie.access_token); }); })
        .then(function () { location.reload(); })
        .catch(function (e) {
          knop.disabled = false;
          var m = (e && (e.error_description || e.msg || e.message)) || '';
          if (/credential|invalid/i.test(m)) fout.textContent = 'Dit e-mailadres en wachtwoord horen niet bij elkaar.';
          else if (m === 'geen toegang') fout.textContent = 'Je account hoort niet bij dit portaal.';
          else if (m === 'onbekend portaal') fout.textContent = 'Dit portaal bestaat niet.';
          else fout.textContent = 'Inloggen lukt nu niet. Probeer het zo nog eens.';
        });
    }

    knop.addEventListener('click', probeer);
    document.getElementById('bgWw').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') probeer();
    });
  }

  /* Elke keer dat de pagina opent de offerte opnieuw ophalen. Zonder dit blijft
     een tabblad hangen op de versie van het moment van inloggen, en ziet de klant
     een nieuw onderdeel pas na het sluiten van zijn browser. Alleen herladen als
     er echt iets veranderd is, anders zou de pagina zichzelf blijven verversen. */
  function verversen(s) {
    var token = '';
    try { token = sessionStorage.getItem(TOKEN) || ''; } catch (e) {}
    if (!token) return;

    haalOfferte(token, s).then(function (k) {
      var nieuw = JSON.stringify(k), oud = '';
      try { oud = sessionStorage.getItem(BEWAAR + s) || ''; } catch (e) {}
      if (nieuw === oud) return;
      bewaar(s, k, token);
      location.reload();
    }).catch(function (e) {
      /* Verlopen sessie: opruimen en opnieuw laten inloggen. */
      var m = (e && (e.message || e.msg || e.code)) || '';
      if (/JWT|token|expired|401/i.test(String(m))) { wissen(); location.reload(); }
    });
  }

  function start() {
    var s = slug();
    if (!s || s === 'demo') return;

    var heeft = false;
    try { heeft = !!sessionStorage.getItem(BEWAAR + s); } catch (e) {}

    if (heeft) {
      /* Ingelogd: uitloggen moet ook de offerte uit dit tabblad halen. */
      document.querySelectorAll('[aria-label="Uitloggen"]').forEach(function (b) {
        b.addEventListener('click', wissen, true);
      });
      verversen(s);
      return;
    }

    wissen();
    toonInlog(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
