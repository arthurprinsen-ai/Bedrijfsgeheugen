(function () {
  var kop = document.getElementById('bgkop');
  var knop = document.getElementById('bgkopKnop');
  var paneel = document.getElementById('bgkopMob');
  if (!kop || !knop || !paneel) return;

  var desktopTrigs = kop.querySelectorAll('.bgkop-trig');

  function sluitDesktop() {
    Array.prototype.forEach.call(desktopTrigs, function (t) {
      t.setAttribute('aria-expanded', 'false');
    });
  }

  Array.prototype.forEach.call(desktopTrigs, function (t) {
    t.addEventListener('click', function () {
      var wasOpen = t.getAttribute('aria-expanded') === 'true';
      sluitDesktop();
      if (!wasOpen) t.setAttribute('aria-expanded', 'true');
    });
  });

  document.addEventListener('click', function (e) {
    if (!kop.contains(e.target)) sluitDesktop();
  });

  function zetHoogte() {
    document.documentElement.style.setProperty('--bgkop-h', kop.offsetHeight + 'px');
  }

  function sluit() {
    paneel.setAttribute('hidden', '');
    knop.setAttribute('aria-expanded', 'false');
    knop.setAttribute('aria-label', 'Menu openen');
    document.body.style.overflow = '';
  }

  function open() {
    sluitDesktop();
    zetHoogte();
    paneel.removeAttribute('hidden');
    knop.setAttribute('aria-expanded', 'true');
    knop.setAttribute('aria-label', 'Menu sluiten');
    document.body.style.overflow = 'hidden';
    paneel.scrollTop = 0;
  }

  knop.addEventListener('click', function () {
    if (paneel.hasAttribute('hidden')) open(); else sluit();
  });

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

  Array.prototype.forEach.call(paneel.querySelectorAll('a'), function (l) {
    l.addEventListener('click', sluit);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var openDesktop = kop.querySelector('.bgkop-trig[aria-expanded="true"]');
      if (openDesktop) {
        sluitDesktop();
        openDesktop.focus();
        return;
      }

      if (!paneel.hasAttribute('hidden')) {
        sluit();
        knop.focus();
      }
    }
  });

  addEventListener('resize', function () {
    zetHoogte();
    if (innerWidth > 1100 && !paneel.hasAttribute('hidden')) sluit();
    if (innerWidth <= 1100) sluitDesktop();
  });

  zetHoogte();
})();
