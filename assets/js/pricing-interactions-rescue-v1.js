(() => {
  'use strict';
  if (window.__BG_PRICING_RESCUE_V2__) return;
  window.__BG_PRICING_RESCUE_V2__ = true;

  const all = (selector) => Array.from(document.querySelectorAll(selector));
  const asElement = (target) => target?.nodeType === 1 ? target : target?.parentElement || null;

  function ensureRescueStyles() {
    if (document.getElementById('bg-pricing-rescue-state-style')) return;
    const style = document.createElement('style');
    style.id = 'bg-pricing-rescue-state-style';
    style.textContent = '.bg-lifecycle-panel.is-active{display:block!important;visibility:visible!important;opacity:1!important}.bg-lifecycle-panel[hidden]{display:none!important}';
    document.head.appendChild(style);
  }

  function selectStage(key) {
    ensureRescueStyles();
    all('[data-bg-stage]').forEach((button) => {
      const active = button.getAttribute('data-bg-stage') === key;
      button.setAttribute('aria-selected', String(active));
      button.classList.toggle('is-active', active);
      button.tabIndex = active ? 0 : -1;
    });
    all('[data-bg-stage-panel]').forEach((panel) => {
      const active = panel.getAttribute('data-bg-stage-panel') === key;
      if (active) {
        panel.removeAttribute('hidden');
        panel.hidden = false;
        panel.style.setProperty('display','block','important');
      } else {
        panel.setAttribute('hidden','');
        panel.hidden = true;
        panel.style.setProperty('display','none','important');
      }
      panel.classList.toggle('is-active', active);
      panel.setAttribute('aria-hidden', String(!active));
    });
    document.documentElement.dataset.bgPricingSelectedStage = key;
    const situation = document.getElementById('bgSituation');
    const motion = document.getElementById('bgMotion');
    const phases = ['start','validate','grow','scale','professionalize','mature','stagnate','loss','crisis'];
    if (situation && phases.includes(key)) situation.value = key;
    if (motion && !phases.includes(key)) motion.value = key;
  }

  function selectGroup(key) {
    all('[data-bg-price-tab]').forEach((button) => {
      const active = button.getAttribute('data-bg-price-tab') === key;
      button.setAttribute('aria-selected', String(active));
      button.classList.toggle('is-active', active);
      button.tabIndex = active ? 0 : -1;
    });
    all('.bg-plan-card[data-bg-group]').forEach((card) => {
      const active = card.getAttribute('data-bg-group') === key;
      card.hidden = !active;
      card.style.display = active ? '' : 'none';
      card.classList.toggle('is-active', active);
      card.setAttribute('aria-hidden', String(!active));
    });
  }

  function setBilling(key) {
    const billing = key === 'yearly' ? 'yearly' : 'monthly';
    all('[data-bg-billing]').forEach((button) => {
      const active = button.getAttribute('data-bg-billing') === billing;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
    });
    all('.bg-billing-price').forEach((el) => {
      const value = el.getAttribute(billing === 'yearly' ? 'data-yearly' : 'data-monthly');
      if (value) el.textContent = value;
    });
    all('.bg-billing-period').forEach((el) => {
      const english = document.documentElement.lang.toLowerCase().startsWith('en');
      el.textContent = billing === 'yearly'
        ? (el.tagName === 'SMALL' ? (english ? '/year' : '/jaar') : (english ? 'per year' : 'per jaar'))
        : (el.tagName === 'SMALL' ? (english ? '/month' : '/maand') : (english ? 'per month' : 'per maand'));
    });
    all('a[href*="/afsluiten?plan="]').forEach((a) => {
      try {
        const url = new URL(a.href, location.origin);
        url.searchParams.set('billing', billing);
        a.href = url.toString();
      } catch {}
    });
  }

  function activateFrom(target) {
    const el = asElement(target);
    if (!el) return false;
    const stage = el.closest('[data-bg-stage]');
    if (stage) { selectStage(stage.getAttribute('data-bg-stage')); return true; }
    const group = el.closest('[data-bg-price-tab]');
    if (group) { selectGroup(group.getAttribute('data-bg-price-tab')); return true; }
    const billing = el.closest('[data-bg-billing]');
    if (billing) { setBilling(billing.getAttribute('data-bg-billing')); return true; }
    return false;
  }

  function syncFromDom() {
    const stage = document.querySelector('[data-bg-stage][aria-selected="true"]') || document.querySelector('[data-bg-stage]');
    if (stage) selectStage(stage.getAttribute('data-bg-stage'));
    const group = document.querySelector('[data-bg-price-tab][aria-selected="true"]') || document.querySelector('[data-bg-price-tab]');
    if (group) selectGroup(group.getAttribute('data-bg-price-tab'));
    const billing = document.querySelector('[data-bg-billing][aria-pressed="true"]') || document.querySelector('[data-bg-billing]');
    if (billing) setBilling(billing.getAttribute('data-bg-billing'));
    document.documentElement.dataset.bgPricingInteractions = 'ready-v3';
    document.documentElement.dataset.bgPricingSelectedStage = stage?.getAttribute('data-bg-stage') || '';
    document.documentElement.dataset.bgPricingSelectedGroup = group?.getAttribute('data-bg-price-tab') || '';
    document.documentElement.dataset.bgPricingBilling = billing?.getAttribute('data-bg-billing') || '';
  }

  document.addEventListener('click', (event) => {
    if (!activateFrom(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  document.addEventListener('touchend', (event) => {
    if (!activateFrom(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, {capture:true, passive:false});

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (!activateFrom(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  let repairQueued = false;
  function nodeContainsPricingControl(node) {
    if (!node || node.nodeType !== 1) return false;
    const el = /** @type {Element} */ (node);
    if (el.matches?.('[data-bg-stage],[data-bg-stage-panel],[data-bg-price-tab],[data-bg-group],[data-bg-billing]')) return true;
    return Boolean(el.querySelector?.('[data-bg-stage],[data-bg-stage-panel],[data-bg-price-tab],[data-bg-group],[data-bg-billing]'));
  }
  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((m) =>
      m.type === 'childList'
      && Array.from(m.addedNodes || []).some(nodeContainsPricingControl)
    );
    if (!relevant || repairQueued) return;
    repairQueued = true;
    queueMicrotask(() => {
      repairQueued = false;
      syncFromDom();
    });
  });

  function start() {
    syncFromDom();
    if (document.body) observer.observe(document.body,{subtree:true,childList:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();