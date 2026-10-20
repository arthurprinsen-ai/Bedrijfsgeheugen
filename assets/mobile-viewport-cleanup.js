/* Bedrijfsgeheugen: keep the first screen clear of the ticking-loss banner. */
(function () {
  'use strict';
  var phrase = 'Sinds je deze pagina opende';

  function cleanBrand() {
    var brand = document.querySelector('header.v17-header .brand');
    if (!brand || !brand.firstElementChild || brand.firstElementChild === brand.lastElementChild) return;
    var ornament = brand.firstElementChild;
    if ((ornament.textContent || '').trim().length <= 2) {
      ornament.classList.add('bg-mobile-ornament-hidden');
    }
  }

  function dismissLossBanner() {
    if (!document.body) return false;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var found;
    while ((found = walker.nextNode())) {
      if (!found.nodeValue || found.nodeValue.indexOf(phrase) === -1) continue;
      var node = found.parentElement;
      for (var depth = 0; node && depth < 9 && node !== document.body; depth++, node = node.parentElement) {
        var content = (node.textContent || '').replace(/\s+/g, ' ').trim();
        if (content.length > 650 || !content.includes('Reken het na')) continue;
        var pos = window.getComputedStyle(node).position;
        if (pos === 'fixed' || pos === 'sticky') {
          node.style.setProperty('display', 'none', 'important');
          node.setAttribute('aria-hidden', 'true');
          return true;
        }
      }
    }
    return false;
  }

  function start() {
    cleanBrand();
    if (dismissLossBanner()) return;
    var observer = new MutationObserver(function () {
      cleanBrand();
      if (dismissLossBanner()) observer.disconnect();
    });
    observer.observe(document.body, {childList: true, subtree: true});
    window.addEventListener('load', function () {
      if (dismissLossBanner()) observer.disconnect();
    }, {once: true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
})();
