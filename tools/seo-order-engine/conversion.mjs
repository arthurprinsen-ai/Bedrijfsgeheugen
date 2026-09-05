function escapeAttr(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function markPrimaryConversions(input, entry) {
  let html = String(input);
  if (!entry?.primary_cta?.url || !entry?.primary_cta?.action) return html;
  const target = entry.primary_cta.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<a\\b([^>]*\\bhref=(?:"${target}"|'${target}')[^>]*)>`, 'i');
  html = html.replace(re, (match, attrs) => {
    if (/\bdata-bg-conversion=/.test(match)) return match;
    return `<a${attrs} data-bg-conversion="${escapeAttr(entry.primary_cta.action)}" data-bg-page-role="${escapeAttr(entry.role)}" data-bg-funnel-stage="${escapeAttr(entry.funnel_stage)}">`;
  });
  return html;
}

export function injectConversionTracker(input) {
  const html = String(input);
  if (/id=["']bg-conversion-tracker["']/i.test(html)) return html;
  const script = `<script id="bg-conversion-tracker">(function(){if(window.__bgConversionTracker)return;window.__bgConversionTracker=true;document.addEventListener('click',function(e){var el=e.target&&e.target.closest?e.target.closest('[data-bg-conversion],[data-bg-order-cta]'):null;if(!el)return;window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'bg_conversion_intent',conversion_action:el.getAttribute('data-bg-conversion')||el.getAttribute('data-bg-order-cta')||'',landing_path:window.location.pathname,target_url:el.href||'',page_role:el.getAttribute('data-bg-page-role')||document.body.getAttribute('data-bg-page-role')||'',funnel_stage:el.getAttribute('data-bg-funnel-stage')||document.body.getAttribute('data-bg-funnel-stage')||''});},true);}());</script>`;
  if (!/<\/body>/i.test(html)) throw new Error('HTML mist </body> voor conversion tracker');
  return html.replace(/<\/body>/i, `${script}\n</body>`);
}
