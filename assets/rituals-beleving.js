/* Rituals-beleving: rust en exclusieve begeerte (besluit Arthur, 17 nov 2026).
   Alleen presentatie en interactie, geen inhoud of logica. Werkt op website en portaal.
   - Langzame onthulling bij het scrollen (site)
   - Haarlijn-voortgang, zachte overgang tussen pagina's (site)
   - Geheugenritueel: kies wat je hoofd bezet houdt, adem drie rondes, krijg een rustige slotzin en vervolgstap (site + portaal, zelfde op elke pagina)
   - Begroeting naar tijdstip en zachte weergavewissel (portaal)
   Respecteert prefers-reduced-motion en werkt zonder JS gewoon door. */
(function () {
  'use strict';
  if (window.__rbBeleving) return;
  window.__rbBeleving = true;

  var doc = document, root = doc.documentElement;

  var IS_EN = (doc.documentElement.getAttribute('lang') || '').slice(0, 2) === 'en';
  var EN = {
  "Je adviseur": "Your advisor",
  "Eerst luisteren. Dan pas bouwen.": "Listen first. Then build.",
  "Bedrijfsgeheugen is geen leverancier die een demo geeft en verdwijnt. Arthur Prinsen kijkt eerst met je mee naar hoe jouw bedrijf werkt.": "Bedrijfsgeheugen is not a vendor that gives a demo and disappears. Arthur Prinsen first looks along with you at how your business works.",
  "Duidelijke afspraken vooraf": "Clear agreements up front",
  "Je weet vooraf wat we doen en wat het kost.": "You know up front what we do and what it costs.",
  "Klein beginnen": "Start small",
  "We starten met één vraag en toetsen het resultaat voordat we verder gaan.": "We start with one question and test the result before we go further.",
  "Jij beslist. Wij leggen vast.": "You decide. We record it.",
  "Elk advies krijgt een bron, een eigenaar en een datum.": "Every piece of advice gets a source, an owner and a date.",
  "Plan een gesprek met Arthur": "Book a conversation with Arthur",
  "Besluit · voorbeeld": "Decision · example",
  "Offerte Van Dijk Techniek verlengen?": "Renew the Van Dijk Techniek quote?",
  "Waarom nu": "Why now",
  "Het contract loopt af en de marge staat onder druk.": "The contract is ending and the margin is under pressure.",
  "Bron": "Source",
  "AFAS-contract en de mail van 12 november": "AFAS contract and the email of 12 November",
  "Eigenaar": "Owner",
  "Sanne, sales": "Sanne, sales",
  "Vastgelegd": "Recorded",
  "Vandaag, met bron": "Today, with source",
  "Elk besluit heeft een bron, een eigenaar en een datum.": "Every decision has a source, an owner and a date.",
  "Kennis die alleen in hoofden zit": "Knowledge that only lives in people’s heads",
  "Wat alleen in hoofden zit, leggen wij voor je vast.": "What lives only in people’s heads, we capture for you.",
  "Zie hoe wij dat bewaren": "See how we keep it",
  "Losse mails, bestanden en systemen": "Loose emails, files and systems",
  "Wat verspreid ligt, brengen wij rustig samen.": "What is scattered, we bring together calmly.",
  "Zie hoe systemen samenkomen": "See how systems come together",
  "Werk dat zich steeds herhaalt": "Work that keeps repeating",
  "Wat zich herhaalt, hoeft jou niet langer te kosten.": "What repeats no longer has to cost you.",
  "Zie hoe het werkt": "See how it works",
  "Beslissingen die nergens staan": "Decisions that are written down nowhere",
  "Wat besloten is, blijft voortaan vindbaar.": "What has been decided stays findable.",
  "Doe de Frisse blik": "Take the Fresh Perspective Scan",
  "Ik wil alleen even rust": "I just want a moment of calm",
  "Dan is dit precies genoeg. Neem de tijd.": "Then this is exactly enough. Take your time.",
  "Geheugenritueel": "Memory ritual",
  "Wat houdt je hoofd bezet?": "What is on your mind?",
  "Kies wat nu het zwaarst weegt. Wij onthouden het.": "Choose what weighs most right now. We will remember it.",
  "Liever niet nu": "Not now",
  "Verder": "Continue",
  "Er hoeft nu niets.": "Nothing is needed right now.",
  " — wij onthouden het.": " — we will remember it.",
  "Het ligt veilig. Jij kunt verder.": "It is safe. You can carry on.",
  "Adem in": "Breathe in",
  "Adem uit": "Breathe out",
  "Vier tellen · ronde ": "Four counts · round ",
  "Zes tellen · ronde ": "Six counts · round ",
  " van 3": " of 3",
  "Neem je moment": "Take a moment",
  "Neem je moment: het geheugenritueel": "Take a moment: the memory ritual",
  "Een moment voor jezelf": "A moment for yourself",
  "Het geheugenritueel": "The memory ritual",
  "Wij onthouden. Jij ademt.": "We remember. You breathe."
};
  function tr(s) { return IS_EN && EN[s] ? EN[s] : s; }
  var rustig = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isPortaal = !!doc.querySelector('aside.sidebar');

  /* ---------- stijl ---------- */
  var css = [
    '.rb-js .rb-reveal{opacity:0;transform:translateY(20px);transition:opacity .9s cubic-bezier(.22,.61,.36,1),transform .9s cubic-bezier(.22,.61,.36,1);will-change:opacity,transform}',
    '.rb-js .rb-reveal.rb-in{opacity:1;transform:none}',
    '.rb-voortgang{position:fixed;left:0;top:0;height:1px;width:100%;background:#FFE86B;transform:scaleX(var(--rb-v,0));transform-origin:0 50%;z-index:2147483000;pointer-events:none;opacity:.9}',
    'html.rb-uit body{opacity:0;transition:opacity .32s ease}',
    '.rb-js body{animation:rb-binnen .8s ease both}',
    '@keyframes rb-binnen{from{opacity:0}to{opacity:1}}',
    '.rb-adem-knop{background:none;border:0;padding:6px 0;margin:14px 0 0;font:inherit;font-size:.92rem;letter-spacing:.02em;color:inherit;opacity:.72;cursor:pointer;border-bottom:1px solid currentColor;transition:opacity .5s ease}',
    '.rb-adem-knop:hover,.rb-adem-knop:focus-visible{opacity:1}',
    '.rb-adem{position:fixed;inset:0;z-index:2147483200;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;background:rgba(251,250,247,.99);color:#14171A;font-family:"Instrument Sans R","Instrument Sans",system-ui,sans-serif;opacity:0;visibility:hidden;transition:opacity .9s ease,visibility 0s linear .9s}',
    '.rb-adem.rb-open{opacity:1;visibility:visible;transition:opacity .9s ease}',
    '.rb-adem-cirkel{width:min(46vmin,260px);height:min(46vmin,260px);border-radius:50%;border:1px solid rgba(20,23,26,.22);background:radial-gradient(circle at 50% 42%,rgba(255,232,107,.55),rgba(255,232,107,.12) 62%,rgba(255,232,107,0) 74%);transform:scale(.62);transition:transform 4s cubic-bezier(.45,.05,.35,1)}',
    '.rb-adem-tekst{font-family:"Fraunces R",Georgia,serif;font-weight:400;font-size:clamp(1.5rem,4vw,2.1rem);letter-spacing:.01em;min-height:1.4em;text-align:center;margin:0}',
    '.rb-adem-sub{margin:-18px 0 0;font-size:.95rem;color:rgba(20,23,26,.6);min-height:1.4em;text-align:center}',
    '.rb-adem-sluit{background:none;border:1px solid rgba(20,23,26,.28);border-radius:999px;padding:11px 26px;font:inherit;color:inherit;cursor:pointer;transition:background .5s ease,color .5s ease}',
    '.rb-adem-sluit:hover,.rb-adem-sluit:focus-visible{background:#14171A;color:#FBFAF7}',
    '.rb-groet{display:block;font-family:"Fraunces R",Georgia,serif;font-style:italic;font-weight:400;font-size:1.05rem;color:rgba(20,23,26,.62);margin:0 0 6px;letter-spacing:.01em}',
    '@keyframes rb-wissel{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}',
    '.rb-wissel{animation:rb-wissel .65s cubic-bezier(.22,.61,.36,1) both}',
    '@keyframes rb-ademhaal{0%,100%{opacity:.35}50%{opacity:1}}',
    '.rb-ademt{animation:rb-ademhaal 6s ease-in-out infinite}',
    '.rb-adem[data-fase="kies"] .rb-adem-cirkel,.rb-adem[data-fase="kies"] .rb-adem-bewaard{display:none}',
    '.rb-adem-keuzes{display:flex;flex-direction:column;gap:10px;width:min(440px,86vw);margin-top:-6px}',
    '.rb-adem-keuzes[hidden],.rb-adem-link[hidden]{display:none}',
    '.rb-adem-keuze{background:none;border:1px solid rgba(20,23,26,.2);border-radius:999px;padding:13px 22px;font:inherit;font-size:.98rem;color:inherit;cursor:pointer;text-align:center;transition:background .6s ease,border-color .6s ease}',
    '.rb-adem-keuze:hover,.rb-adem-keuze:focus-visible{background:rgba(255,232,107,.3);border-color:rgba(20,23,26,.5)}',
    '.rb-adem-bewaard{margin:-14px 0 0;font-family:"Fraunces R",Georgia,serif;font-style:italic;font-size:1rem;color:rgba(20,23,26,.55);text-align:center;max-width:min(440px,86vw);min-height:1.4em;opacity:0;transition:opacity 1.6s ease}',
    '.rb-adem-bewaard.rb-zichtbaar{opacity:1}',
    '.rb-adem-link{color:#14171A;text-decoration:none;border-bottom:1px solid #14171A;padding-bottom:2px;font-size:.98rem}',
    '.rb-adem-link:hover,.rb-adem-link:focus-visible{border-bottom-color:#FFE86B;box-shadow:0 1px 0 #FFE86B}',
    '.rb-moment{position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:2147482000;display:inline-flex;align-items:center;gap:9px;background:rgba(251,250,247,.94);color:#14171A;border:1px solid rgba(20,23,26,.16);border-radius:999px;padding:9px 16px 9px 13px;font:inherit;font-family:"Instrument Sans R","Instrument Sans",system-ui,sans-serif;font-size:.84rem;letter-spacing:.03em;cursor:pointer;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);transition:border-color .5s ease,box-shadow .5s ease}',
    '.rb-moment:hover,.rb-moment:focus-visible{border-color:rgba(20,23,26,.5);box-shadow:0 0 0 3px rgba(255,232,107,.45)}',
    '.rb-moment i{display:block;width:9px;height:9px;border-radius:50%;background:#FFE86B;box-shadow:0 0 0 1px rgba(20,23,26,.25);animation:rb-ademhaal 6s ease-in-out infinite}',
    '@media (max-width:760px){.rb-moment{bottom:92px}}',
    '@media print{.rb-moment,.rb-band{display:none}}',
    '.rb-band{background:#FBFAF7;color:#14171A;border-top:1px solid rgba(20,23,26,.1);text-align:center;padding:64px 24px 60px;font-family:"Instrument Sans R","Instrument Sans",system-ui,sans-serif}',
    '.rb-band small{display:block;font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;color:rgba(20,23,26,.55);margin-bottom:14px}',
    '.rb-band p{font-family:"Fraunces R",Georgia,serif;font-weight:400;font-size:clamp(1.5rem,3.4vw,2.2rem);line-height:1.25;margin:0 auto 22px;max-width:22ch;letter-spacing:.005em}',
    '.rb-band button{background:none;border:0;padding:6px 0;font:inherit;font-size:.95rem;color:#14171A;cursor:pointer;border-bottom:1px solid #14171A;transition:box-shadow .5s ease,border-color .5s ease}',
    '.rb-band button:hover,.rb-band button:focus-visible{box-shadow:0 1px 0 #FFE86B;border-bottom-color:#FFE86B}',
    '@media (prefers-reduced-motion:reduce){.rb-js .rb-reveal{opacity:1;transform:none;transition:none}.rb-js body{animation:none}.rb-adem,.rb-adem.rb-open{transition:none}.rb-adem-cirkel{transition:none;transform:scale(.8)}.rb-wissel,.rb-ademt,.rb-moment i{animation:none}.rb-adem-bewaard{transition:none}html.rb-uit body{opacity:1;transition:none}.rb-voortgang{display:none}}'
  ].join('\n');
  var st = doc.createElement('style');
  st.setAttribute('data-rb', '1');
  st.textContent = css;
  doc.head.appendChild(st);

  /* ---------- geheugenritueel ---------- */
  var KEUZES = [
    { t: tr('Kennis die alleen in hoofden zit'), z: tr('Wat alleen in hoofden zit, leggen wij voor je vast.'), h: (IS_EN ? '/en' : '') + '/bedrijfsgeheugen', l: tr('Zie hoe wij dat bewaren') },
    { t: tr('Losse mails, bestanden en systemen'), z: tr('Wat verspreid ligt, brengen wij rustig samen.'), h: (IS_EN ? '/en' : '') + '/systemen-koppelen', l: tr('Zie hoe systemen samenkomen') },
    { t: tr('Werk dat zich steeds herhaalt'), z: tr('Wat zich herhaalt, hoeft jou niet langer te kosten.'), h: (IS_EN ? '/en' : '') + '/hoe-het-werkt', l: tr('Zie hoe het werkt') },
    { t: tr('Beslissingen die nergens staan'), z: tr('Wat besloten is, blijft voortaan vindbaar.'), h: (IS_EN ? '/en' : '') + '/frisse-blik', l: tr('Doe de Frisse blik') },
    { t: tr('Ik wil alleen even rust'), z: tr('Dan is dit precies genoeg. Neem de tijd.'), h: '', l: '' }
  ];
  var overlay = null, timers = [], vorigeFocus = null, gekozen = null;
  function wis() { timers.forEach(clearTimeout); timers = []; }
  function na(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function q(sel) { return overlay.querySelector(sel); }

  function bouwOverlay() {
    overlay = doc.createElement('div');
    overlay.className = 'rb-adem';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', tr('Geheugenritueel'));
    overlay.innerHTML =
      '<div class="rb-adem-cirkel" aria-hidden="true"></div>' +
      '<p class="rb-adem-tekst" aria-live="polite"></p>' +
      '<p class="rb-adem-sub"></p>' +
      '<div class="rb-adem-keuzes" role="group" aria-label="' + tr('Wat houdt je hoofd bezet?') + '"></div>' +
      '<p class="rb-adem-bewaard" aria-hidden="true"></p>' +
      '<a class="rb-adem-link" hidden></a>' +
      '<button type="button" class="rb-adem-sluit">' + tr('Verder') + '</button>';
    doc.body.appendChild(overlay);
    var lijst = q('.rb-adem-keuzes');
    KEUZES.forEach(function (k, i) {
      var b = doc.createElement('button');
      b.type = 'button';
      b.className = 'rb-adem-keuze';
      b.textContent = k.t;
      b.addEventListener('click', function () { kies(i); });
      lijst.appendChild(b);
    });
    q('.rb-adem-sluit').addEventListener('click', sluit);
    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { sluit(); return; }
      if (e.key !== 'Tab') return;
      var f = Array.prototype.filter.call(overlay.querySelectorAll('button,a[href]'), function (el) { return !el.hidden && el.offsetParent !== null; });
      if (!f.length) return;
      var eerste = f[0], laatste = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === eerste) { e.preventDefault(); laatste.focus(); }
      else if (!e.shiftKey && doc.activeElement === laatste) { e.preventDefault(); eerste.focus(); }
    });
  }

  function fase(naam) { overlay.setAttribute('data-fase', naam); }

  function toonKeuze() {
    fase('kies');
    gekozen = null;
    q('.rb-adem-tekst').textContent = tr('Wat houdt je hoofd bezet?');
    q('.rb-adem-sub').textContent = tr('Kies wat nu het zwaarst weegt. Wij onthouden het.');
    q('.rb-adem-keuzes').hidden = false;
    q('.rb-adem-link').hidden = true;
    q('.rb-adem-bewaard').classList.remove('rb-zichtbaar');
    q('.rb-adem-sluit').textContent = tr('Liever niet nu');
    var eerste = q('.rb-adem-keuze');
    if (eerste) eerste.focus();
  }

  function kies(i) {
    gekozen = KEUZES[i];
    fase('adem');
    q('.rb-adem-keuzes').hidden = true;
    q('.rb-adem-sluit').textContent = tr('Verder');
    var b = q('.rb-adem-bewaard');
    b.textContent = i === KEUZES.length - 1 ? tr('Er hoeft nu niets.') : gekozen.t + tr(' — wij onthouden het.');
    var c = q('.rb-adem-cirkel');
    c.style.transitionDuration = '0s';
    c.style.transform = 'scale(.62)';
    q('.rb-adem-sluit').focus();
    wis();
    na(60, function () { ronde(0); });
    na(2500, function () { b.classList.add('rb-zichtbaar'); });
  }

  function ronde(n) {
    var c = q('.rb-adem-cirkel'), t = q('.rb-adem-tekst'), s = q('.rb-adem-sub');
    if (n >= 3) {
      fase('klaar');
      t.textContent = tr('Het ligt veilig. Jij kunt verder.');
      s.textContent = gekozen ? gekozen.z : '';
      c.style.transitionDuration = '2.5s';
      c.style.transform = 'scale(.8)';
      var a = q('.rb-adem-link');
      if (gekozen && gekozen.h && !isPortaal) {
        a.href = gekozen.h;
        a.textContent = gekozen.l;
        a.hidden = false;
      }
      return;
    }
    t.textContent = tr('Adem in');
    s.textContent = tr('Vier tellen · ronde ') + (n + 1) + tr(' van 3');
    c.style.transitionDuration = rustig ? '0s' : '4s';
    c.style.transform = 'scale(1)';
    na(4000, function () {
      t.textContent = tr('Adem uit');
      s.textContent = tr('Zes tellen · ronde ') + (n + 1) + tr(' van 3');
      c.style.transitionDuration = rustig ? '0s' : '6s';
      c.style.transform = 'scale(.62)';
      na(6000, function () { ronde(n + 1); });
    });
  }

  function open() {
    if (!overlay) bouwOverlay();
    vorigeFocus = doc.activeElement;
    root.style.overflow = 'hidden';
    wis();
    overlay.classList.add('rb-open');
    toonKeuze();
  }
  function sluit() {
    if (!overlay) return;
    wis();
    overlay.classList.remove('rb-open');
    root.style.overflow = '';
    if (vorigeFocus && vorigeFocus.focus) vorigeFocus.focus();
  }
  window.rbAdem = open;

  function ademKnop(tekst) {
    var b = doc.createElement('button');
    b.type = 'button';
    b.className = 'rb-adem-knop';
    b.textContent = tekst;
    b.addEventListener('click', open);
    return b;
  }

  function momentPil() {
    if (doc.querySelector('.rb-moment')) return;
    var pil = doc.createElement('button');
    pil.type = 'button';
    pil.className = 'rb-moment';
    pil.setAttribute('aria-label', tr('Neem je moment: het geheugenritueel'));
    pil.innerHTML = '<i aria-hidden="true"></i>' + tr('Neem je moment');
    pil.addEventListener('click', open);
    doc.body.appendChild(pil);
    var hero = doc.querySelector('.hero-copy .rb-adem-knop');
    if (hero) {
      // Op de homepage staat het ritueel al in de hero en boven de voettekst; geen zwevende knop over de inhoud.
      pil.style.display = 'none';
    }
  }

  /* ---------- website ---------- */
  function site() {
    root.classList.add('rb-js');

    // Ademlink in de hero van de homepage, onder de eerste knop.
    var kop = doc.querySelector('section.hero-video .hero-copy');
    if (kop && !kop.querySelector('.rb-adem-knop')) {
      var acties = kop.querySelector('.hero-video-actions');
      var knop = ademKnop(tr('Neem je moment'));
      knop.style.margin = '6px 0 0';
      var eerstePara = acties && acties.querySelector('p');
      if (eerstePara) acties.insertBefore(knop, eerstePara);
      else if (acties) acties.appendChild(knop);
      else kop.appendChild(knop);
    }

    // Hero-beeld: het oorspronkelijke drone-filmpje blijft staan (rustige vlucht door architectuur).
    var hv0 = doc.querySelector('section.hero-video .hero-bg-video');
    if (hv0) { hv0.removeAttribute('data-rb-vervangen'); var sp0 = hv0.play && hv0.play(); if (sp0 && sp0.catch) sp0.catch(function () {}); }

    // Mobiel: de hero kort houden. De geruststelling blijft, de lange uitleg staat verderop op de pagina.
    if (window.matchMedia && window.matchMedia('(max-width:860px)').matches) {
      var gerust = doc.querySelector('section.hero-video .hero-video-actions p > strong');
      if (gerust && gerust.parentNode && !gerust.parentNode.hasAttribute('data-rb-kort')) {
        var ouder = gerust.parentNode;
        ouder.setAttribute('data-rb-kort', '1');
        while (gerust.nextSibling) ouder.removeChild(gerust.nextSibling);
      }
    }

    // Adviseur-blok direct na de hero: persoonlijk, rustig, zonder claims.
    var heroSec = doc.querySelector('section.hero-video');
    if (heroSec && !doc.querySelector('.rb-adviseur')) {
      var adv = doc.createElement('section');
      adv.className = 'rb-adviseur';
      adv.setAttribute('aria-label', tr('Je adviseur'));
      adv.innerHTML =
        '<div class="rb-adv-wrap">' +
        '<small>' + tr('Je adviseur') + '</small>' +
        '<h2>' + tr('Eerst luisteren. Dan pas bouwen.') + '</h2>' +
        '<p class="rb-adv-lead">' + tr('Bedrijfsgeheugen is geen leverancier die een demo geeft en verdwijnt. Arthur Prinsen kijkt eerst met je mee naar hoe jouw bedrijf werkt.') + '</p>' +
        '<ol>' +
        '<li><b>' + tr('Duidelijke afspraken vooraf') + '</b><span>' + tr('Je weet vooraf wat we doen en wat het kost.') + '</span></li>' +
        '<li><b>' + tr('Klein beginnen') + '</b><span>' + tr('We starten met één vraag en toetsen het resultaat voordat we verder gaan.') + '</span></li>' +
        '<li><b>' + tr('Jij beslist. Wij leggen vast.') + '</b><span>' + tr('Elk advies krijgt een bron, een eigenaar en een datum.') + '</span></li>' +
        '</ol>' +
        '<a class="rb-adv-knop" href="https://calendly.com/arthur-prinsen/adviesgesprek-slimmer-geregeld" target="_blank" rel="noopener">' + tr('Plan een gesprek met Arthur') + '</a>' +
        '</div>';
      heroSec.parentNode.insertBefore(adv, heroSec.nextSibling);
    }

    // De WhatsApp-knop pas na een schermhoogte scrollen, zodat hij de hoofdactie niet afdekt.
    var wa = doc.querySelector('.bg-whatsapp-contact');
    if (wa && kop) {
      var waToon = function () { if ((window.pageYOffset || 0) > (window.innerHeight || 700) * 0.9) wa.style.removeProperty('display'); else wa.style.setProperty('display', 'none', 'important'); };
      window.addEventListener('scroll', waToon, { passive: true });
      waToon();
    }

    // Zelfde ritueel op elke pagina: een stille pil en een rustband boven de voettekst.
    momentPil();
    var voet = doc.querySelector('body > footer, footer');
    if (voet && !doc.querySelector('.rb-band')) {
      var band = doc.createElement('section');
      band.className = 'rb-band';
      band.setAttribute('aria-label', tr('Een moment voor jezelf'));
      band.innerHTML = '<small>' + tr('Het geheugenritueel') + '</small><p>' + tr('Wij onthouden. Jij ademt.') + '</p><button type="button">' + tr('Neem je moment') + '</button>';
      band.querySelector('button').addEventListener('click', open);
      voet.parentNode.insertBefore(band, voet);
    }

    // Onthulling: alleen elementen onder de eerste schermhoogte, en niet in kop, hero of voettekst.
    var kandidaten = doc.querySelectorAll('main h2, main h3, main p, main li, main figure, main [class*="card"], main [class*="tile"], main img, main blockquote');
    var lijst = [];
    kandidaten.forEach(function (el) {
      if (el.closest('header, nav, .hero-video, .hero-inspiration, .inhoud-kop, footer, dialog, [hidden], #bgCookie')) return;
      if (el.parentElement && el.parentElement.closest('.rb-reveal')) return; // geen geneste onthulling
      lijst.push(el);
    });
    if (lijst.length && 'IntersectionObserver' in window && !rustig) {
      var io = new IntersectionObserver(function (items) {
        items.forEach(function (it) {
          if (!it.isIntersecting) return;
          var el = it.target, idx = Number(el.getAttribute('data-rb-i') || 0);
          el.style.transitionDelay = Math.min(idx, 5) * 90 + 'ms';
          el.classList.add('rb-in');
          io.unobserve(el);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      var teller = new WeakMap();
      lijst.forEach(function (el) {
        var ouder = el.parentElement, n = teller.get(ouder) || 0;
        teller.set(ouder, n + 1);
        el.setAttribute('data-rb-i', n);
        el.classList.add('rb-reveal');
        io.observe(el);
      });
      // Vangnet: nooit iets verborgen laten.
      setTimeout(function () {
        lijst.forEach(function (el) { el.classList.add('rb-in'); });
      }, 6000);
    }

    // Haarlijn-voortgang.
    if (!rustig) {
      var lijn = doc.createElement('div');
      lijn.className = 'rb-voortgang';
      lijn.setAttribute('aria-hidden', 'true');
      doc.body.appendChild(lijn);
      var bezig = false;
      var meet = function () {
        bezig = false;
        var max = root.scrollHeight - innerHeight;
        lijn.style.setProperty('--rb-v', max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0);
        var boog = doc.querySelector('section.hero-video video, section.hero-video .hero-media');
        if (boog && scrollY < innerHeight) boog.style.translate = '0 ' + Math.round(scrollY * 0.06) + 'px';
      };
      addEventListener('scroll', function () {
        if (!bezig) { bezig = true; requestAnimationFrame(meet); }
      }, { passive: true });
      meet();
    }

    // Zachte overgang tussen pagina's (alleen gewone interne links).
    doc.addEventListener('click', function (e) {
      if (rustig || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target || a.hasAttribute('download')) return;
      var u;
      try { u = new URL(a.href, location.href); } catch (x) { return; }
      if (u.origin !== location.origin || u.pathname === location.pathname) return;
      e.preventDefault();
      root.classList.add('rb-uit');
      setTimeout(function () { location.href = u.href; }, 300);
    });
    addEventListener('pageshow', function () { root.classList.remove('rb-uit'); });
  }

  /* ---------- portaal ---------- */
  function portaal() {
    momentPil();
    // Begroeting naar tijdstip, boven de welkomsttekst.
    var welkom = doc.querySelector('.welcome');
    if (welkom && !welkom.querySelector('.rb-groet')) {
      var u = new Date().getHours();
      var tekst = u < 6 ? 'Rustige nacht.' : u < 12 ? 'Goedemorgen.' : u < 18 ? 'Goedemiddag.' : 'Goedenavond.';
      var g = doc.createElement('span');
      g.className = 'rb-groet';
      g.textContent = tekst + ' Hier houd jij de leiding.';
      welkom.insertBefore(g, welkom.firstChild);
    }

    // Ademknop onderin de zijbalk.
    var zij = doc.querySelector('aside.sidebar');
    if (zij && !zij.querySelector('.rb-adem-knop')) {
      var b = ademKnop(tr('Neem je moment'));
      b.style.color = '#fff';
      b.style.margin = '16px 18px';
      b.style.alignSelf = 'flex-start';
      zij.appendChild(b);
    }

    // Zachte wissel bij het kiezen van een weergave.
    var hoofd = doc.querySelector('.main');
    var nav = doc.querySelector('nav.nav');
    if (hoofd && nav && !rustig) {
      nav.addEventListener('click', function (e) {
        if (!e.target.closest('button')) return;
        hoofd.classList.remove('rb-wissel');
        void hoofd.offsetWidth;
        hoofd.classList.add('rb-wissel');
      });
    }

    // De statusstip ademt rustig.
    var stip = doc.querySelector('.owner-status');
    if (stip && !rustig) stip.classList.add('rb-ademt');
  }

  function start() { isPortaal ? portaal() : site(); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})();
