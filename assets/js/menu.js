/* Bedrijfsgeheugen — gedeelde mobiele navigatie.
   De bestaande server-side links blijven in #bgkopMob staan voor SEO en
   no-JS navigatie; op mobiel bouwen we daar een duidelijke drill-down laag
   bovenop met grote touch-targets en een herkenbare Menu-pill. */
(function () {
  var knop = document.getElementById('bgkopKnop');
  var bron = document.getElementById('bgkopMob');
  if (!knop || !bron) return;

  if (!document.querySelector('link[data-bg-shared-mobile-nav]')) {
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/assets/shared-mobile-drilldown.css?v=1';
    css.setAttribute('data-bg-shared-mobile-nav', '');
    document.head.appendChild(css);
  }

  var labels = {
    oplossingen: 'Oplossingen',
    bedrijfsgeheugen: 'Bedrijfsgeheugen',
    koppelingen: 'Koppelingen',
    kennis: 'Kennis',
    meer: 'Meer'
  };
  var volgorde = ['oplossingen', 'bedrijfsgeheugen', 'koppelingen', 'kennis', 'meer'];

  function sleutel(tekst) {
    var t = String(tekst || '').trim().toLowerCase();
    if (t.indexOf('oplossingen') !== -1) return 'oplossingen';
    if (t.indexOf('bedrijfsgeheugen') !== -1) return 'bedrijfsgeheugen';
    if (t.indexOf('koppelingen') !== -1) return 'koppelingen';
    if (t.indexOf('kennis') !== -1) return 'kennis';
    return '';
  }

  var beschrijvingen = {};
  Array.prototype.forEach.call(document.querySelectorAll('.bgkop-paneel a[href]'), function (link) {
    var span = link.querySelector('span');
    if (span) beschrijvingen[link.getAttribute('href')] = span.textContent.trim();
  });

  var groepen = {};
  Array.prototype.forEach.call(bron.querySelectorAll('.bgkop-macc'), function (trigger) {
    var key = sleutel(trigger.textContent);
    var paneel = trigger.nextElementSibling;
    if (!key || !paneel) return;
    groepen[key] = Array.prototype.map.call(paneel.querySelectorAll('a[href]'), function (a) {
      return {
        href: a.getAttribute('href'),
        label: a.textContent.trim(),
        beschrijving: beschrijvingen[a.getAttribute('href')] || ''
      };
    });
  });

  /* Alles wat in het oude mobiele menu als losse toplink stond, hoort onder
     Meer. Zo blijft #bgkopMob de enige bron van waarheid en kan een nieuwe
     losse pagina nooit stil verdwijnen uit de moderne drill-down. */
  var direct = {};
  groepen.meer = [];
  Array.prototype.forEach.call(bron.querySelectorAll(':scope > a[href]'), function (a) {
    if (a.classList.contains('bgkop-mcta')) {
      direct.cta = a.getAttribute('href');
      return;
    }
    groepen.meer.push({
      href: a.getAttribute('href'),
      label: a.textContent.trim(),
      beschrijving: beschrijvingen[a.getAttribute('href')] || ''
    });
  });
  if (!groepen.meer.length) delete groepen.meer;

  var nav = document.createElement('div');
  nav.id = 'bgSharedMobileNav';
  nav.setAttribute('aria-hidden', 'true');
  nav.setAttribute('aria-label', 'Mobiele hoofdnavigatie');
  nav.innerHTML = '<div class="bg-shared-mobile-shell"><div class="bg-shared-mobile-brandline"><span class="bg-shared-mobile-kicker">Bedrijfsgeheugen</span></div></div>';
  var shell = nav.firstElementChild;

  function maakRoot() {
    var root = document.createElement('div');
    root.className = 'bg-shared-mobile-view';
    root.setAttribute('data-bg-shared-mobile-view', 'root');
    volgorde.forEach(function (key) {
      if (!groepen[key]) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'bg-shared-mobile-row';
      b.setAttribute('data-bg-shared-mobile-target', key);
      b.innerHTML = '<span>' + labels[key] + '</span><span class="bg-shared-mobile-arrow" aria-hidden="true">→</span>';
      root.appendChild(b);
    });

    var cta = document.createElement('a');
    cta.className = 'bg-shared-mobile-cta';
    cta.href = direct.cta || '/frisse-blik';
    cta.textContent = 'Plan een Frisse blik →';
    root.appendChild(cta);

    var meta = document.createElement('div');
    meta.className = 'bg-shared-mobile-meta';
    meta.textContent = 'Vaste prijs · In twee weken draaiend · Voor het Nederlandse mkb';
    root.appendChild(meta);
    return root;
  }

  function maakGroep(key) {
    var view = document.createElement('div');
    view.className = 'bg-shared-mobile-view';
    view.setAttribute('data-bg-shared-mobile-view', key);
    view.setAttribute('hidden', '');

    var titel = document.createElement('div');
    titel.className = 'bg-shared-mobile-subtitle';
    titel.innerHTML = '<button class="bg-shared-mobile-back" type="button" data-bg-shared-mobile-back aria-label="Terug">← Terug</button><h2>' + labels[key] + '</h2>';
    view.appendChild(titel);

    (groepen[key] || []).forEach(function (item) {
      var a = document.createElement('a');
      a.className = 'bg-shared-mobile-link';
      a.href = item.href;
      var tekst = '<span>' + item.label;
      if (item.beschrijving) tekst += '<small>' + item.beschrijving + '</small>';
      tekst += '</span><span aria-hidden="true">→</span>';
      a.innerHTML = tekst;
      view.appendChild(a);
    });
    return view;
  }

  shell.appendChild(maakRoot());
  volgorde.forEach(function (key) { if (groepen[key]) shell.appendChild(maakGroep(key)); });
  document.body.appendChild(nav);

  bron.setAttribute('hidden', '');
  bron.setAttribute('aria-hidden', 'true');
  knop.innerHTML = '<span class="bg-mobile-menu-label">Menu</span><span class="bg-mobile-menu-icon" aria-hidden="true"></span>';
  knop.setAttribute('aria-controls', 'bgSharedMobileNav');
  knop.setAttribute('aria-expanded', 'false');
  knop.setAttribute('aria-label', 'Open menu');

  var menuLabel = knop.querySelector('.bg-mobile-menu-label');
  var views = Array.prototype.slice.call(nav.querySelectorAll('[data-bg-shared-mobile-view]'));

  function toon(name) {
    views.forEach(function (view) {
      if (view.getAttribute('data-bg-shared-mobile-view') === name) view.removeAttribute('hidden');
      else view.setAttribute('hidden', '');
    });
    var active = nav.querySelector('[data-bg-shared-mobile-view="' + name + '"]');
    if (active) active.scrollTop = 0;
  }

  function sluit() {
    nav.setAttribute('aria-hidden', 'true');
    knop.setAttribute('aria-expanded', 'false');
    knop.setAttribute('aria-label', 'Open menu');
    if (menuLabel) menuLabel.textContent = 'Menu';
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    toon('root');
  }

  function open() {
    nav.setAttribute('aria-hidden', 'false');
    knop.setAttribute('aria-expanded', 'true');
    knop.setAttribute('aria-label', 'Sluit menu');
    if (menuLabel) menuLabel.textContent = 'Sluit';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    toon('root');
  }

  knop.addEventListener('click', function () {
    if (nav.getAttribute('aria-hidden') === 'false') sluit(); else open();
  });

  nav.addEventListener('click', function (event) {
    var target = event.target.closest && event.target.closest('[data-bg-shared-mobile-target]');
    if (target) {
      event.preventDefault();
      toon(target.getAttribute('data-bg-shared-mobile-target'));
      return;
    }
    var back = event.target.closest && event.target.closest('[data-bg-shared-mobile-back]');
    if (back) {
      event.preventDefault();
      toon('root');
      return;
    }
    var link = event.target.closest && event.target.closest('a[href]');
    if (link) sluit();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && nav.getAttribute('aria-hidden') === 'false') {
      sluit();
      knop.focus();
    }
  });

  addEventListener('resize', function () {
    if (innerWidth > 1100 && nav.getAttribute('aria-hidden') === 'false') sluit();
  });

  toon('root');
})();
