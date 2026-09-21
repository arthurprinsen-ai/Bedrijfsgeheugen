(() => {
  'use strict';
  const STORAGE_KEY = 'bg_locale';
  const CACHE_KEY = 'bg_i18n_cache_v2';
  const SUPPORTED = new Set(['nl','en']);
  const ORIGINAL = new WeakMap();
  const ATTR_ORIGINAL = new WeakMap();
  const SKIP = new Set(['SCRIPT','STYLE','CODE','PRE','TEXTAREA','INPUT','SELECT','NOSCRIPT','SVG']);
  let locale = 'nl';
  let observer;
  let mutationTimer;
  let localeEpoch = 0;
  let cache = loadCache();
  let controlsBound = false;

  const cssEscape = value => String(value).replace(/"/g, '&quot;');
  const normalizeLocale = value => String(value || '').toLowerCase().split('-')[0];
  const isPortal = () => location.pathname.startsWith('/portal') || location.pathname.startsWith('/klantportaal');
  const context = () => isPortal() ? 'portal' : 'public';

  const CORE_EN = new Map([
    ['Ontdekken','Discover'],['Oplossingen','Solutions'],['Platform','Platform'],['Prijzen','Pricing'],['Cases','Cases'],
    ['Kennis & bedrijf','Knowledge & business'],['Kennis','Knowledge'],['Over ons','About us'],['Meer','More'],
    ['Start','Start'],['Gratis zelfscan','Free self-scan'],['Frisse Blik Scan','Fresh Perspective Scan'],
    ['Inloggen','Log in'],['Aanmelden','Sign up'],['Home','Home'],['Taal','Language'],
    ['Nederlands','Dutch'],['English','English'],['Voor het Nederlandse mkb','For Dutch SMEs'],
    ['Vaste prijs, geen uurtje-factuurtje','Fixed price, no hourly billing'],
    ['In twee weken draaiend','Up and running in two weeks']
  ]);

  function localTranslation(target, source) {
    return target === 'en' ? (CORE_EN.get(source) || null) : null;
  }

  function loadCache() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch { return {}; }
  }

  function saveCache() {
    try {
      const entries = Object.entries(cache);
      if (entries.length > 1800) cache = Object.fromEntries(entries.slice(-1400));
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {}
  }

  function cacheId(target,source) { return target + '|' + source; }

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
    if (s.length < 2 || s.length > 3000) return false;
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
    for (const attr of ['placeholder','title','aria-label','alt']) {
      if (el.hasAttribute?.(attr) && meaningful(el.getAttribute(attr))) values[attr] = el.getAttribute(attr);
    }
    const type = String(el.getAttribute?.('type') || '').toLowerCase();
    if ((type === 'submit' || type === 'button' || type === 'reset') && el.hasAttribute?.('value') && meaningful(el.getAttribute('value'))) {
      values.value = el.getAttribute('value');
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
    root.querySelectorAll?.('[placeholder],[title],[aria-label],[alt],input[type="submit"][value],input[type="button"][value],input[type="reset"][value]').forEach(el => {
      if (el.closest?.('[data-bg-no-translate],.notranslate,[translate="no"],[contenteditable="true"]')) return;
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

  async function translate(strings, target, requestEpoch) {
    const unique = [...new Set(strings)];
    const out = new Map();
    const missing = [];
    for (const source of unique) {
      const local = localTranslation(target, source);
      if (local) { out.set(source, local); continue; }
      const hit = cache[cacheId(target,source)];
      if (typeof hit === 'string' && hit) out.set(source,hit);
      else missing.push(source);
    }
    const batches = [];
    let batch = [], chars = 0;
    for (const source of missing) {
      if (batch.length >= 20 || chars + source.length > 2400) {
        if (batch.length) batches.push(batch);
        batch = []; chars = 0;
      }
      batch.push(source); chars += source.length;
    }
    if (batch.length) batches.push(batch);
    async function requestPart(part) {
      if (requestEpoch !== localeEpoch) return false;
      let response;
      for (let attempt=0; attempt<2; attempt++) {
        try {
          response = await fetch('/api/i18n-translate', {
            method:'POST',
            headers:{'content-type':'application/json'},
            body:JSON.stringify({ target, source:'nl', context:context(), strings:part })
          });
        } catch { response = null; }
        if (response?.ok) break;
        if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 300));
      }
      if (!response?.ok) {
        if (part.length > 5) {
          let any = false;
          for (let i=0;i<part.length;i+=5) any = (await requestPart(part.slice(i,i+5))) || any;
          return any;
        }
        return false;
      }
      let payload;
      try { payload = await response.json(); } catch { return false; }
      if (requestEpoch !== localeEpoch) return false;
      if (!Array.isArray(payload.translations) || payload.translations.length !== part.length) return false;
      let wrote = false;
      part.forEach((source,i) => {
        const translated = typeof payload.translations[i] === 'string' && payload.translations[i].trim()
          ? payload.translations[i].trim()
          : null;
        if (!translated) return;
        wrote = true;
        out.set(source,translated);
        cache[cacheId(target,source)] = translated;
      });
      if (wrote) saveCache();
      return wrote;
    }

    for (const part of batches) await requestPart(part);

    const unresolved = missing.filter(source => !out.has(source));
    for (const source of unresolved) {
      await requestPart([source]);
    }

    const stillMissing = unique.filter(source => !out.has(source));
    if (stillMissing.length) {
      throw new Error('translation_incomplete:' + stillMissing.length);
    }
    return out;
  }

  function applyLocalTranslations(items) {
    if (locale !== 'en') return;
    for (const item of items) {
      const value = localTranslation('en', item.source);
      if (!value) continue;
      if (item.kind === 'text') {
        const original = ORIGINAL.get(item.node) || '';
        const leading = original.match(/^\s*/)?.[0] || '';
        const trailing = original.match(/\s*$/)?.[0] || '';
        item.node.nodeValue = leading + value + trailing;
      } else {
        item.node.setAttribute(item.attr, value);
      }
    }
  }

  async function apply(root=document.body) {
    const requestEpoch = localeEpoch;
    document.documentElement.lang = locale === 'en' ? 'en' : 'nl';
    document.documentElement.dataset.bgLocale = locale;
    if (locale === 'nl') {
      restore(root);
      if (root === document.body) {
        const originalTitle=document.documentElement.dataset.bgOriginalTitle;
        if (originalTitle) document.title=originalTitle;
        document.querySelectorAll('meta[data-bg-original-content]').forEach(meta=>meta.setAttribute('content',meta.getAttribute('data-bg-original-content')||''));
      }
      syncControls();
      return;
    }
    const items = collect(root);

    const extras = [];
    if (root === document.body) {
      if (meaningful(document.title)) extras.push(document.documentElement.dataset.bgOriginalTitle || document.title);
      document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"]').forEach(meta => {
        const value = meta.getAttribute('data-bg-original-content') || meta.getAttribute('content');
        if (meaningful(value)) extras.push(value);
      });
    }
    const map = await translate(items.map(item=>item.source).concat(extras), locale, requestEpoch);
    if (requestEpoch !== localeEpoch || locale !== 'en') return;
    if (root === document.body) {
      const originalTitle = document.documentElement.dataset.bgOriginalTitle || document.title;
      document.documentElement.dataset.bgOriginalTitle = originalTitle;
      document.title = map.get(originalTitle) || originalTitle;
      document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"]').forEach(meta => {
        const attr='data-bg-original-content';
        const original=meta.getAttribute(attr) || meta.getAttribute('content') || '';
        if (!meta.hasAttribute(attr)) meta.setAttribute(attr,original);
        meta.setAttribute('content', map.get(original) || original);
      });
    }
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
      el.textContent = locale === 'nl' ? 'Taal · NL' : 'Language · EN';
      el.setAttribute('aria-label', locale === 'nl' ? 'Taal: Nederlands' : 'Language: English');
    });
    document.querySelectorAll('[data-bg-language-label]').forEach(el => {
      el.textContent = 'Language';
    });
    document.querySelectorAll('[data-bg-language-select]').forEach(select => {
      if (select.value !== locale) select.value = locale;
      select.setAttribute('aria-label', 'Language');
    });
  }

  async function setLocale(next) {
    const normalized = normalizeLocale(next);
    if (!SUPPORTED.has(normalized) || normalized === locale) { closeMenus(); return; }
    const previous = locale;
    const previousEpoch = localeEpoch;
    locale = normalized;
    localeEpoch += 1;
    document.documentElement.dataset.bgI18nBusy = 'true';
    delete document.documentElement.dataset.bgI18nError;
    closeMenus();
    try {
      await apply(document.body);
      try { localStorage.setItem(STORAGE_KEY, locale); } catch {}
      document.cookie = 'bg_locale=' + encodeURIComponent(locale) + '; Path=/; Max-Age=31536000; SameSite=Lax';
      syncControls();
      document.dispatchEvent(new CustomEvent('bg:localechange',{detail:{locale}}));
    } catch (error) {
      locale = previous;
      localeEpoch = previousEpoch + 1;
      await apply(document.body).catch(()=>{});
      document.documentElement.dataset.bgI18nError = 'true';
      syncControls();
      throw error;
    } finally {
      delete document.documentElement.dataset.bgI18nBusy;
    }
  }

  function closeMenus() {
    document.querySelectorAll('[data-bg-language-menu]').forEach(menu => menu.hidden = true);
    document.querySelectorAll('button[data-bg-language-current]').forEach(btn => btn.setAttribute('aria-expanded','false'));
  }

  function languageControl(mode) {
    const wrap = document.createElement('div');
    wrap.dataset.bgLanguageSwitcher = mode;
    wrap.dataset.bgNoTranslate = '';
    if (mode === 'mobile') {
      wrap.className = 'bg-mobile-language';
      wrap.innerHTML = '<span class="bg-mobile-language-label" data-bg-language-label>Language</span>' +
        '<div class="bg-mobile-language-select-wrap">' +
        '<select class="bg-mobile-language-select" data-bg-language-select aria-label="Language">' +
        '<option value="en">English</option><option value="nl">Dutch</option></select>' +
        '<span class="bg-mobile-language-chevron" aria-hidden="true">⌄</span></div>' +
        '<span class="bg-language-error" data-bg-language-error hidden>Switching language failed. Try again.</span>';
    } else {
      wrap.className = 'bgkop-language';
      wrap.innerHTML = '<button type="button" class="bgkop-language-current" data-bg-language-current aria-haspopup="listbox" aria-expanded="false">Taal · NL</button>' +
        '<div class="bgkop-language-menu" data-bg-language-menu role="listbox" hidden>' +
        '<button type="button" role="option" data-bg-language-option="nl">Nederlands</button>' +
        '<button type="button" role="option" data-bg-language-option="en">English</button></div>' +
        '<span class="bg-language-error" data-bg-language-error hidden>Wisselen mislukt. Probeer opnieuw.</span>';
    }
    return wrap;
  }

  function mountControl() {
    document.querySelectorAll('.bg-language-switcher').forEach(el => el.remove());

    const desktopHost = document.querySelector('.bgkop-links, .navlinks, .v17-nav-links, [data-bg-desktop-nav], .desktop-nav');
    if (desktopHost && !desktopHost.querySelector('[data-bg-language-switcher="desktop"]')) {
      desktopHost.appendChild(languageControl('desktop'));
    }

    const mobileRoot = document.querySelector('[data-bg-mobile-view="root"], [data-bg-shared-mobile-view="root"]');
    if (mobileRoot && !mobileRoot.querySelector('[data-bg-language-switcher="mobile"]')) {
      const control = languageControl('mobile');
      const auth = mobileRoot.querySelector('a[href="/inloggen"], a[href="/login"], .bg-mobile-auth, .bg-shared-mobile-auth');
      const cta = mobileRoot.querySelector('.bg-mobile-cta, .bg-shared-mobile-cta');
      mobileRoot.insertBefore(control, auth || cta || null);
    }

    const legacyMobile = document.getElementById('bgkopMob');
    if (!mobileRoot && legacyMobile && !legacyMobile.querySelector('[data-bg-language-switcher="mobile"]')) {
      legacyMobile.appendChild(languageControl('mobile'));
    }

    syncControls();
  }

  function showLocaleError() {
    document.querySelectorAll('[data-bg-language-error]').forEach(el => {
      el.hidden = false;
      clearTimeout(el._bgTimer);
      el._bgTimer = setTimeout(() => { el.hidden = true; }, 4500);
    });
  }

  function bindControlEvents() {
    if (controlsBound) return;
    controlsBound = true;
    document.addEventListener('change', event => {
      const select = event.target.closest?.('[data-bg-language-select]');
      if (!select) return;
      setLocale(select.value).catch(showLocaleError);
    });
    document.addEventListener('click', event => {
      const option = event.target.closest?.('[data-bg-language-option]');
      if (option) {
        event.preventDefault();
        setLocale(option.dataset.bgLanguageOption).catch(showLocaleError);
        return;
      }
      const current = event.target.closest?.('button[data-bg-language-current]');
      if (current) {
        event.preventDefault();
        const wrap = current.closest('[data-bg-language-switcher]');
        const menu = wrap?.querySelector('[data-bg-language-menu]');
        if (!menu) return;
        const opening = menu.hidden;
        closeMenus();
        menu.hidden = !opening;
        current.setAttribute('aria-expanded', String(opening));
        return;
      }
      if (!event.target.closest?.('[data-bg-language-switcher]')) closeMenus();
    });
  }

  function startObserver() {
    observer?.disconnect();
    observer = new MutationObserver(mutations => {
      const roots = new Set();
      for (const m of mutations) {
        if (m.type === 'childList') m.addedNodes.forEach(n => { if (n.nodeType === 1) roots.add(n); });
      }
      if (!roots.size) return;
      mountControl();
      if (locale !== 'en') return;
      clearTimeout(mutationTimer);
      mutationTimer = setTimeout(()=>apply(document.body).catch(()=>{}), 40);
    });
    observer.observe(document.body,{subtree:true,childList:true});
  }

  async function init() {
    locale = preferredLocale();
    bindControlEvents();
    mountControl();
    await apply(document.body).catch(()=>{ syncControls(); showLocaleError(); });
    startObserver();
  }

  window.BGI18N = Object.freeze({
    get locale(){ return locale; },
    setLocale,
    translateText: async text => {
      if (locale === 'nl' || !meaningful(text)) return text;
      const map = await translate([String(text)], locale, localeEpoch);
      return map.get(String(text)) || text;
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();