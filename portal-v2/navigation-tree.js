/* Portal V2 — gedrag van de boomnavigatie in de zijbalk.
 *
 * Contract op de markup:
 *   <nav class="nav">
 *     <button class="dvnav-q" data-vraag="wat-komt-er-op-ons-af"
 *             aria-expanded="false" aria-controls="sub-wat-komt-er-op-ons-af">
 *       Wat komt er op ons af? <span class="chev">›</span>
 *     </button>
 *     <div class="dvnav-sub" id="sub-wat-komt-er-op-ons-af" hidden>
 *       <button data-page="csrd-impact">CSRD &amp; Impact</button>
 *     </div>
 *   </nav>
 *
 * Regels:
 *   - één vraag tegelijk open (accordeon); zes open takken passen niet in 720px
 *   - de tak van de actieve pagina staat open bij laden en na elke paginawissel
 *   - de actieve paginaknop draagt aria-current="page"
 *   - de actieve pagina wordt in beeld gescrold binnen de nav, niet de pagina
 *
 * Koppeling met de shell: de portal zet zelf data-page-id op #portalView.
 * Dit bestand luistert daarnaar en volgt. Geen wederzijdse afhankelijkheid.
 */
(function () {
  'use strict';

  var NAV = '.nav';

  function nav() { return document.querySelector(NAV); }

  function subOf(question) {
    var id = question.getAttribute('aria-controls');
    if (id) {
      var byId = document.getElementById(id);
      if (byId) return byId;
    }
    var next = question.nextElementSibling;
    return next && next.classList.contains('dvnav-sub') ? next : null;
  }

  function questionOf(sub) {
    if (!sub) return null;
    if (sub.id) {
      var byControls = document.querySelector('[aria-controls="' + sub.id + '"]');
      if (byControls) return byControls;
    }
    var prev = sub.previousElementSibling;
    return prev && prev.classList.contains('dvnav-q') ? prev : null;
  }

  function setOpen(question, open) {
    var sub = subOf(question);
    question.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (sub) sub.hidden = !open;
  }

  function openOnly(question) {
    var root = nav();
    if (!root) return;
    Array.prototype.forEach.call(root.querySelectorAll('.dvnav-q'), function (other) {
      setOpen(other, other === question);
    });
  }

  function markActivePage(pageId) {
    var root = nav();
    if (!root || !pageId) return;

    Array.prototype.forEach.call(root.querySelectorAll('[data-page]'), function (button) {
      button.removeAttribute('aria-current');
    });

    var target = root.querySelector('[data-page="' + pageId + '"]');
    if (!target) return;

    target.setAttribute('aria-current', 'page');

    var sub = target.closest('.dvnav-sub');
    var question = questionOf(sub);
    if (question) openOnly(question);

    // Binnen de nav in beeld brengen, zonder de pagina eronder te verspringen.
    if (typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  function onNavClick(event) {
    var question = event.target.closest ? event.target.closest('.dvnav-q') : null;
    if (!question || !nav().contains(question)) return;
    var isOpen = question.getAttribute('aria-expanded') === 'true';
    if (isOpen) setOpen(question, false);
    else openOnly(question);
  }

  function watchShell() {
    var view = document.getElementById('portalView');
    if (!view || typeof MutationObserver !== 'function') return;
    markActivePage(view.getAttribute('data-page-id'));
    new MutationObserver(function () {
      markActivePage(view.getAttribute('data-page-id'));
    }).observe(view, { attributes: true, attributeFilter: ['data-page-id'] });
  }

  function start() {
    var root = nav();
    if (!root) return;

    // Beginstand: alles dicht, aria in lijn met het hidden-attribuut.
    Array.prototype.forEach.call(root.querySelectorAll('.dvnav-q'), function (question) {
      var sub = subOf(question);
      setOpen(question, Boolean(sub) && sub.hidden === false);
    });

    root.addEventListener('click', onNavClick);
    watchShell();

    window.portalNav = {
      openPage: markActivePage,
      openQuestion: function (slug) {
        var question = root.querySelector('[data-vraag="' + slug + '"]');
        if (question) openOnly(question);
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
