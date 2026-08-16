/* Mobiele menubalk: accordeon met een paneel dat zelf scrolt.
   Waarom accordeon: met 28 links past een platte lijst niet op een telefoon.
   Waarom dvh en niet vh: op iOS valt de onderkant anders weg achter de
   browserbalk, en dan kun je de laatste items niet bereiken. */
(function () {
  var knop = document.getElementById('bgkopKnop');
  var paneel = document.getElementById('bgkopMob');
  if (!knop || !paneel) return;

  function zetHoogte() {
    var kop = document.getElementById('bgkop');
    if (kop) document.documentElement.style.setProperty('--bgkop-h', kop.offsetHeight + 'px');
  }

  function sluit() {
    paneel.setAttribute('hidden', '');
    knop.setAttribute('aria-expanded', 'false');
    knop.setAttribute('aria-label', 'Menu openen');
    document.body.style.overflow = '';
  }

  function open() {
    zetHoogte();
    paneel.removeAttribute('hidden');
    knop.setAttribute('aria-expanded', 'true');
    knop.setAttribute('aria-label', 'Menu sluiten');
    // de pagina erachter mag niet meescrollen, anders raak je je plek kwijt
    document.body.style.overflow = 'hidden';
    paneel.scrollTop = 0;
  }

  knop.addEventListener('click', function () {
    if (paneel.hasAttribute('hidden')) open(); else sluit();
  });

  // uitklappers binnen het menu: er staat er hoogstens een open, zodat je
  // nooit door drie lijsten tegelijk hoeft te scrollen
  var accs = paneel.querySelectorAll('.bgkop-macc');
  Array.prototype.forEach.call(accs, function (a) {
    a.addEventListener('click', function () {
      var sub = a.nextElementSibling;
      var dicht = sub.hasAttribute('hidden');
      Array.prototype.forEach.call(accs, function (b) {
        b.setAttribute('aria-expanded', 'false');
        if (b.nextElementSibling) b.nextElementSibling.setAttribute('hidden', '');
      });
      if (dicht) {
        sub.removeAttribute('hidden');
        a.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // een link volgen sluit het menu, anders blijft het open op de nieuwe pagina
  Array.prototype.forEach.call(paneel.querySelectorAll('a'), function (l) {
    l.addEventListener('click', sluit);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !paneel.hasAttribute('hidden')) { sluit(); knop.focus(); }
  });

  addEventListener('resize', function () {
    zetHoogte();
    if (innerWidth > 1100 && !paneel.hasAttribute('hidden')) sluit();
  });

  zetHoogte();
})();
