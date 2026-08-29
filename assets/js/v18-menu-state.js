(function () {
  function initMenuState() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.navitem[data-mega]'));

    function syncItem(item, index) {
      var button = item.querySelector(':scope > .navbtn');
      var mega = item.querySelector(':scope > .mega');
      if (!button || !mega) return;
      if (!mega.id) mega.id = 'bgV18Mega' + index;
      button.setAttribute('aria-haspopup', 'true');
      button.setAttribute('aria-controls', mega.id);
      button.setAttribute('aria-expanded', item.getAttribute('data-mega-pinned') === '1' ? 'true' : 'false');
    }

    function syncDesktop() {
      items.forEach(syncItem);
    }

    syncDesktop();
    items.forEach(function (item) {
      new MutationObserver(syncDesktop).observe(item, {
        attributes: true,
        attributeFilter: ['data-mega-pinned']
      });
    });

    var toggle = document.getElementById('mobileToggle');
    var drawer = document.getElementById('v18MobileDrawer');
    var close = document.getElementById('v18MobileClose');

    function syncMobile() {
      if (!toggle || !drawer) return;
      toggle.setAttribute('aria-controls', 'v18MobileDrawer');
      var open = drawer.getAttribute('aria-hidden') === 'false' && drawer.classList.contains('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Sluit menu' : 'Open menu');
    }

    syncMobile();
    if (drawer) {
      new MutationObserver(syncMobile).observe(drawer, {
        attributes: true,
        attributeFilter: ['class', 'aria-hidden']
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      var openItem = items.find(function (item) {
        return item.getAttribute('data-mega-pinned') === '1';
      });
      if (openItem) {
        var button = openItem.querySelector(':scope > .navbtn');
        openItem.setAttribute('data-mega-pinned', '0');
        syncDesktop();
        if (button) button.focus();
        return;
      }
      if (drawer && drawer.getAttribute('aria-hidden') === 'false' && close) {
        close.click();
        if (toggle) toggle.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMenuState, { once: true });
  } else {
    initMenuState();
  }
})();
