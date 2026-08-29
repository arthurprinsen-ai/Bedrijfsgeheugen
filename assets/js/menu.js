/* Bedrijfsgeheugen — gedeelde mobiele navigatie.
   De bestaande server-side links blijven in #bgkopMob staan voor SEO en
   no-JS navigatie. De interactieve laag exposeert eerst de geaccepteerde
   zeven hoofdviews en houdt de bestaande drilldowns als verdieping. */
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
    bedrijfsgeheugen: 'Platform',
    koppelingen: 'Koppelingen',
    kennis: 'Kennis',
    meer: 'Meer'
  };
  var volgorde = ['oplossingen', 'bedrijfsgeheugen', 'kennis', 'koppelingen', 'meer'];

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

  function voegOverzichtToe(key, href, label, beschrijving) {
    if (!groepen[key]) groepen[key] = [];
    if (groepen[key].some(function (item) { return item.href === href; })) return;
    groepen[key].unshift({ href: href, label: label, beschrijving: beschrijving });
  }
  voegOverzichtToe('oplossingen', '/oplossingen', 'Alle oplossingen', 'Organisatie, automatisering, data en AI in samenhang');
  voegOverzichtToe('bedrijfsgeheugen', '/bedrijfsgeheugen', 'Platform', 'Wat het bedrijfsgeheugen is en hoe je het meet');
  voegOverzichtToe('kennis', '/kennis', 'Kennisoverzicht', 'Vraag, lees en vertaal kennis naar je eigen bedrijf');

  var direct = {};
  /* De geaccepteerde V18-site heeft onder Meer een expliciete bedrijfsgroep.
     Deze links zijn daarom onderdeel van het contract en niet meer afhankelijk
     van toevallige overgebleven top-level links in de legacy bron. */
  groepen.meer = [
    { href: '/meer', label: 'Alles onder Meer', beschrijving: 'Organisatie, kennis, vertrouwen, support en praktische hulpmiddelen' },
    { href: '/over-ons', label: 'Over ons', beschrijving: 'Wie we zijn en waar we in geloven' },
    { href: '/hoe-het-werkt', label: 'Werkwijze', beschrijving: 'Hoe we kijken, fixen en borgen' },
    { href: '/partners', label: 'Partners', beschrijving: 'Samenwerken rond kennis, data, systemen en AI' }
  ];
  Array.prototype.forEach.call(bron.querySelectorAll(':scope > a[href]'), function (a) {
    var href = a.getAttribute('href');
    if (a.classList.contains('bgkop-mcta')) {
      direct.cta = href;
      return;
    }
    if (href === '/over-ons') {
      direct.overOns = href;
      return;
    }
    if (groepen.meer.some(function (item) { return item.href === href; })) return;
    groepen.meer.push({
      href: href,
      label: a.textContent.trim(),
      beschrijving: beschrijvingen[href] || ''
    });
  });

  var nav = document.createElement('div');
  nav.id = 'bgSharedMobileNav';
  nav.setAttribute('aria-hidden', 'true');
  nav.setAttribute('aria-label', 'Mobiele hoofdnavigatie');
  nav.innerHTML = '<div class="bg-shared-mobile-shell"><div class="bg-shared-mobile-brandline"><span class="bg-shared-mobile-kicker">Bedrijfsgeheugen</span></div></div>';
  var shell = nav.firstElementChild;

  function maakDirect(href, label, secondary) {
    var a = document.createElement('a');
    a.className = 'bg-shared-mobile-row' + (secondary ? ' bg-shared-mobile-secondary' : '');
    a.href = href;
    a.innerHTML = '<span>' + label + '</span><span class="bg-shared-mobile-arrow" aria-hidden="true">→</span>';
    return a;
  }

  function maakGroepKnop(key, label) {
    if (!groepen[key]) return null;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'bg-shared-mobile-row';
    b.setAttribute('data-bg-shared-mobile-target', key);
    b.innerHTML = '<span>' + label + '</span><span class="bg-shared-mobile-arrow" aria-hidden="true">→</span>';
    return b;
  }

  function maakRoot() {
    var root = document.createElement('div');
    root.className = 'bg-shared-mobile-view';
    root.setAttribute('data-bg-shared-mobile-view', 'root');
    root.setAttribute('data-bg-primary-catalog', 'v2');

    [
      maakDirect('/problemen', 'Problemen'),
      maakGroepKnop('oplossingen', 'Oplossingen'),
      maakGroepKnop('bedrijfsgeheugen', 'Platform'),
      maakDirect('/prijzen', 'Prijzen'),
      maakDirect('/cases', 'Cases'),
      maakGroepKnop('kennis', 'Kennis'),
      maakDirect(direct.overOns || '/over-ons', 'Over ons'),
      maakGroepKnop('koppelingen', 'Koppelingen'),
      maakGroepKnop('meer', 'Meer'),
      maakDirect('/inloggen', 'Inloggen', true),
      maakDirect('/aanmelden', 'Aanmelden', true)
    ].forEach(function (item) { if (item) root.appendChild(item); });

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
