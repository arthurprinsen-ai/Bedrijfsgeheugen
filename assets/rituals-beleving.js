/* Rituals-beleving: rust en exclusieve begeerte (besluit Arthur, 17 nov 2026).
   Alleen presentatie en interactie, geen inhoud of logica. Werkt op website en portaal.
   - Langzame onthulling bij het scrollen (site)
   - Haarlijn-voortgang, zachte overgang tussen pagina's (site)
   - Ademmoment: een rustig scherm met een ademcirkel (site + portaal)
   - Begroeting naar tijdstip en zachte weergavewissel (portaal)
   Respecteert prefers-reduced-motion en werkt zonder JS gewoon door. */
(function () {
  'use strict';
  if (window.__rbBeleving) return;
  window.__rbBeleving = true;

  var doc = document, root = doc.documentElement;
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
    '.rb-adem{position:fixed;inset:0;z-index:2147483200;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;background:rgba(251,250,247,.97);color:#14171A;font-family:"Instrument Sans R","Instrument Sans",system-ui,sans-serif;opacity:0;visibility:hidden;transition:opacity .9s ease,visibility 0s linear .9s}',
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
    '@media (prefers-reduced-motion:reduce){.rb-js .rb-reveal{opacity:1;transform:none;transition:none}.rb-js body{animation:none}.rb-adem,.rb-adem.rb-open{transition:none}.rb-adem-cirkel{transition:none;transform:scale(.8)}.rb-wissel,.rb-ademt{animation:none}html.rb-uit body{opacity:1;transition:none}.rb-voortgang{display:none}}'
  ].join('\n');
  var st = doc.createElement('style');
  st.setAttribute('data-rb', '1');
  st.textContent = css;
  doc.head.appendChild(st);

  /* ---------- ademmoment ---------- */
  var overlay = null, timers = [], vorigeFocus = null;
  function wis() { timers.forEach(clearTimeout); timers = []; }
  function na(ms, fn) { timers.push(setTimeout(fn, ms)); }

  function bouwOverlay() {
    overlay = doc.createElement('div');
    overlay.className = 'rb-adem';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Ademmoment');
    overlay.innerHTML =
      '<div class="rb-adem-cirkel" aria-hidden="true"></div>' +
      '<p class="rb-adem-tekst" aria-live="polite"></p>' +
      '<p class="rb-adem-sub"></p>' +
      '<button type="button" class="rb-adem-sluit">Verder</button>';
    doc.body.appendChild(overlay);
    overlay.querySelector('.rb-adem-sluit').addEventListener('click', sluit);
    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') sluit();
      if (e.key === 'Tab') { e.preventDefault(); overlay.querySelector('.rb-adem-sluit').focus(); }
    });
  }

  function ronde(n) {
    var c = overlay.querySelector('.rb-adem-cirkel');
    var t = overlay.querySelector('.rb-adem-tekst');
    var s = overlay.querySelector('.rb-adem-sub');
    if (n >= 3) {
      t.textContent = 'Fijn. Ga rustig verder.';
      s.textContent = '';
      c.style.transitionDuration = '2.5s';
      c.style.transform = 'scale(.8)';
      return;
    }
    t.textContent = 'Adem in';
    s.textContent = 'Vier tellen · ronde ' + (n + 1) + ' van 3';
    c.style.transitionDuration = rustig ? '0s' : '4s';
    c.style.transform = rustig ? 'scale(1)' : 'scale(1)';
    na(4000, function () {
      t.textContent = 'Adem uit';
      s.textContent = 'Zes tellen · ronde ' + (n + 1) + ' van 3';
      c.style.transitionDuration = rustig ? '0s' : '6s';
      c.style.transform = 'scale(.62)';
      na(6000, function () { ronde(n + 1); });
    });
  }

  function open() {
    if (!overlay) bouwOverlay();
    vorigeFocus = doc.activeElement;
    root.style.overflow = 'hidden';
    overlay.classList.add('rb-open');
    overlay.querySelector('.rb-adem-sluit').focus();
    wis();
    var c = overlay.querySelector('.rb-adem-cirkel');
    c.style.transitionDuration = '0s';
    c.style.transform = 'scale(.62)';
    na(60, function () { ronde(0); });
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

  /* ---------- website ---------- */
  function site() {
    root.classList.add('rb-js');

    // Ademlink in de hero van de homepage, onder de eerste knop.
    var kop = doc.querySelector('section.hero-video .hero-copy');
    if (kop && !kop.querySelector('.rb-adem-knop')) {
      var acties = kop.querySelector('.hero-video-actions');
      var knop = ademKnop('Neem een ademmoment');
      knop.style.margin = '6px 0 0';
      var eerstePara = acties && acties.querySelector('p');
      if (eerstePara) acties.insertBefore(knop, eerstePara);
      else if (acties) acties.appendChild(knop);
      else kop.appendChild(knop);
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
    // Begroeting naar tijdstip, boven de welkomsttekst.
    var welkom = doc.querySelector('.welcome');
    if (welkom && !welkom.querySelector('.rb-groet')) {
      var u = new Date().getHours();
      var tekst = u < 6 ? 'Rustige nacht.' : u < 12 ? 'Goedemorgen.' : u < 18 ? 'Goedemiddag.' : 'Goedenavond.';
      var g = doc.createElement('span');
      g.className = 'rb-groet';
      g.textContent = tekst + ' Neem de tijd.';
      welkom.insertBefore(g, welkom.firstChild);
    }

    // Ademknop onderin de zijbalk.
    var zij = doc.querySelector('aside.sidebar');
    if (zij && !zij.querySelector('.rb-adem-knop')) {
      var b = ademKnop('Adem even');
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
