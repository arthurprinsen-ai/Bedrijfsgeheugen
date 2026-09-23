(() => {
  'use strict';
  if (window.__BG_PRICING_RESCUE_V1__) return;
  window.__BG_PRICING_RESCUE_V1__ = true;

  const all = (selector) => Array.from(document.querySelectorAll(selector));

  function selectStage(key) {
    all('[data-bg-stage]').forEach((button) => {
      const active = button.getAttribute('data-bg-stage') === key;
      button.setAttribute('aria-selected', String(active));
      button.classList.toggle('is-active', active);
    });
    all('[data-bg-stage-panel]').forEach((panel) => {
      const active = panel.getAttribute('data-bg-stage-panel') === key;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
      panel.setAttribute('aria-hidden', String(!active));
    });
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
    });
    all('.bg-plan-card[data-bg-group]').forEach((card) => {
      const active = card.getAttribute('data-bg-group') === key;
      card.hidden = !active;
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
      el.textContent = billing === 'yearly'
        ? (el.tagName === 'SMALL' ? '/jaar' : 'per jaar')
        : (el.tagName === 'SMALL' ? '/maand' : 'per maand');
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
    const stage = target.closest?.('[data-bg-stage]');
    if (stage) { selectStage(stage.getAttribute('data-bg-stage')); return true; }
    const group = target.closest?.('[data-bg-price-tab]');
    if (group) { selectGroup(group.getAttribute('data-bg-price-tab')); return true; }
    const billing = target.closest?.('[data-bg-billing]');
    if (billing) { setBilling(billing.getAttribute('data-bg-billing')); return true; }
    return false;
  }

  document.addEventListener('click', (event) => {
    if (!activateFrom(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  document.addEventListener('pointerup', (event) => {
    if (event.pointerType !== 'touch') return;
    activateFrom(event.target);
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const activeStage = document.querySelector('[data-bg-stage][aria-selected="true"]');
      if (activeStage) selectStage(activeStage.getAttribute('data-bg-stage'));
      const activeGroup = document.querySelector('[data-bg-price-tab][aria-selected="true"]');
      if (activeGroup) selectGroup(activeGroup.getAttribute('data-bg-price-tab'));
      const activeBilling = document.querySelector('[data-bg-billing][aria-pressed="true"]');
      if (activeBilling) setBilling(activeBilling.getAttribute('data-bg-billing'));
    }, {once:true});
  }
})();