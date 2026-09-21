(() => {
  'use strict';
  const STORAGE_KEY = 'bg_locale';
  const SUPPORTED = new Set(['nl','en']);
  const ORIGINAL = new WeakMap();
  const ATTR_ORIGINAL = new WeakMap();
  const SKIP = new Set(['SCRIPT','STYLE','CODE','PRE','TEXTAREA','INPUT','SELECT','OPTION','NOSCRIPT','SVG']);
  let locale = 'nl';
  let observer;
  let mutationTimer;
  let run = 0;

  const cssEscape = value => String(value).replace(/"/g, '&quot;');
  const normalizeLocale = value => String(value || '').toLowerCase().split('-')[0];
  const isPortal = () => location.pathname.startsWith('/portal') || location.pathname.startsWith('/klantportaal');
  const context = () => isPortal() ? 'portal' : 'public';

  function preferredLocale() {
    try {
      const stored = normalizeLocale(localStorage.getItem(STORAGE_KEY));
      if (SUPPORTED.has(stored)) return stored;
    } catch {}
    return 'nl';
  }

  function shouldSkipElement(el) {
    if (!el || SKIP.has(el.tagName)) return true;
    if (el.closest('[data-bg-no-translate],.notranslate,[translate="no"],[contenteditable="true"]')) return true;
    return false;
  }

  function meaningful(text) {
    const s = String(text || '').replace(/\s+/g,' ').trim();
    if (s.length < 2 || s.length > 900) return false;
    if (/^[\d\s€$£¥%+\-–—.,:/()]+$/.test(s)) return false;
    if (/^(https?:\/\/|www\.)/i.test(s)) return false;
    return /[A-Za-zÀ-ÿ]/.test(s);
  }

  function rememberText(node) {
    if (!ORIGINAL.has(node)) ORIGINAL.set(node, node.nodeValue);
  }

  function rememberAttrs(el) {
    if (ATTR_ORIGINAL.has(el)) return;
    const values = {};
    for (const attr of ['placeholder','title','aria-label']) {
      if (el.hasAttribute?.(attr) && meaningful(el.getAttribute(attr))) values[attr] = el.getAttribute(attr);
    }
    if (Object.keys(values).length) ATTR_ORIGINAL.set(el, values);
  }

  function collect(root=document.body) {
    const items = [];
    if (!root) return items;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (shouldSkipElement(parent) || !meaningful(node.nodeValue)) continue;
      rememberText(node);
      items.push({ kind:'text', node, source:ORIGINAL.get(node).replace(/\s+/g,' ').trim() });
    }
    root.querySelectorAll?.('[placeholder],[title],[aria-label]').forEach(el => {
      if (shouldSkipElement(el)) return;
      rememberAttrs(el);
      const original = ATTR_ORIGINAL.get(el);
      if (!original) return;
      for (const [attr,source] of Object.entries(original)) items.push({ kind:'attr', node:el, attr, source });
    });
    return items;
  }

  function restore(root=document.body) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) if (ORIGINAL.has(node)) node.nodeValue = ORIGINAL.get(node);
    root.querySelectorAll?.('*').forEach(el => {
      const attrs = ATTR_ORIGINAL.get(el);
      if (!attrs) return;
      for (const [name,value] of Object.entries(attrs)) el.setAttribute(name,value);
    });
  }

  async function translate(strings, target, requestRun) {
    const unique = [...new Set(strings)].slice(0,60);
    if (!unique.length) return new Map();
    const response = await fetch('/api/i18n-translate', {
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({ target, source:'nl', context:context(), strings:unique })
    });
    if (!response.ok) throw new Error('translation_failed');
    const payload = await response.json();
    if (requestRun !== run || !Array.isArray(payload.translations)) return new Map();
    return new Map(unique.map((s,i)=>[s,payload.translations[i] || s]));
  }

  async function apply(root=document.body) {
    const requestRun = ++run;
    document.documentElement.lang = locale === 'en' ? 'en' : 'nl';
    document.documentElement.dataset.bgLocale = locale;
    if (locale === 'nl') {
      restore(root);
      syncControls();
      return;
    }
    const items = collect(root);
    const map = await translate(items.map(item=>item.source), locale, requestRun);
    if (requestRun !== run || locale !== 'en') return;
    for (const item of items) {
      const value = map.get(item.source);
      if (!value) continue;
      if (item.kind === 'text') {
        const original = ORIGINAL.get(item.node) || '';
        const leading = original.match(/^\s*/)?.[0] || '';
        const trailing = original.match(/\s*$/)?.[0] || '';
        item.node.nodeValue = leading + value + trailing;
      } else item.node.setAttribute(item.attr,value);
    }
    syncControls();
  }

  function syncControls() {
    document.querySelectorAll('[data-bg-language-option]').forEach(btn => {
      const selected = btn.dataset.bgLanguageOption === locale;
      btn.setAttribute('aria-selected', String(selected));
      btn.classList.toggle('is-active', selected);
    });
    document.querySelectorAll('[data-bg-language-current]').forEach(el => {
      el.textContent = locale.toUpperCase();
      el.setAttribute('aria-label', locale === 'nl' ? 'Taal: Nederlands' : 'Language: English');
    });
  }

  async function setLocale(next) {
    const normalized = normalizeLocale(next);
    if (!SUPPORTED.has(normalized)) return;
    locale = normalized;
    try { localStorage.setItem(STORAGE_KEY, locale); } catch {}
    document.cookie = 'bg_locale=' + encodeURIComponent(locale) + '; Path=/; Max-Age=31536000; SameSite=Lax';
    document.dispatchEvent(new CustomEvent('bg:localechange',{detail:{locale}}));
    closeMenus();
    await apply(document.body);
  }

  function closeMenus() {
    document.querySelectorAll('[data-bg-language-menu]').forEach(menu => menu.hidden = true);
    document.querySelectorAll('[data-bg-language-current]').forEach(btn => btn.setAttribute('aria-expanded','false'));
  }

  function mountControl() {
    if (document.querySelector('[data-bg-language-switcher]')) return;
    const wrap = document.createElement('div');
    wrap.className = 'bg-language-switcher';
    wrap.dataset.bgLanguageSwitcher = '';
    wrap.innerHTML = '<button type="button" class="bg-language-current" data-bg-language-current aria-haspopup="listbox" aria-expanded="false">NL</button>' +
      '<div class="bg-language-menu" data-bg-language-menu role="listbox" hidden>' +
      '<button type="button" role="option" data-bg-language-option="nl">Nederlands</button>' +
      '<button type="button" role="option" data-bg-language-option="en">English</button>' +
      '</div>';
    document.body.appendChild(wrap);
    const current = wrap.querySelector('[data-bg-language-current]');
    const menu = wrap.querySelector('[data-bg-language-menu]');
    current.addEventListener('click', () => {
      const opening = menu.hidden;
      closeMenus();
      menu.hidden = !opening;
      current.setAttribute('aria-expanded', String(opening));
    });
    wrap.querySelectorAll('[data-bg-language-option]').forEach(btn => btn.addEventListener('click',()=>setLocale(btn.dataset.bgLanguageOption)));
    document.addEventListener('click', e => { if (!wrap.contains(e.target)) closeMenus(); });
    syncControls();
  }

  function startObserver() {
    observer?.disconnect();
    observer = new MutationObserver(mutations => {
      if (locale !== 'en') return;
      const roots = new Set();
      for (const m of mutations) {
        if (m.type === 'childList') m.addedNodes.forEach(n => { if (n.nodeType === 1) roots.add(n); });
      }
      if (!roots.size) return;
      clearTimeout(mutationTimer);
      mutationTimer = setTimeout(()=>apply(document.body).catch(()=>{}), 40);
    });
    observer.observe(document.body,{subtree:true,childList:true});
  }

  async function init() {
    locale = preferredLocale();
    mountControl();
    await apply(document.body).catch(()=>syncControls());
    startObserver();
  }

  window.BGI18N = Object.freeze({
    get locale(){ return locale; },
    setLocale,
    translateText: async text => {
      if (locale === 'nl' || !meaningful(text)) return text;
      const map = await translate([String(text)], locale, run);
      return map.get(String(text)) || text;
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();