/*
 * Kwartaalrapporten: toont de edities uit portal-v2/reports/manifest.json met download van PDF en database.
 * Geen klantdata, geen schrijfroute: een nieuwe editie is een nieuwe rij in het manifest plus de bestanden.
 */
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const SAFE_PATH=/^\/portal-v2\/reports\/[A-Za-z0-9._-]+$/;
const mb=bytes=>{const n=Number(bytes);return Number.isFinite(n)&&n>0?`${(n/1048576).toFixed(1).replace('.',',')} MB`:'';};

export function sortEditions(manifest){
  const list=Array.isArray(manifest?.editions)?manifest.editions.filter(e=>e&&e.id&&e.quarter):[];
  return [...list].sort((a,b)=>String(b.quarter).localeCompare(String(a.quarter)));
}

export function renderEditions(manifest){
  const editions=sortEditions(manifest);
  if(!editions.length)return '<section class="kwr"><p>Er is nog geen kwartaalrapport gepubliceerd.</p></section>';
  const cards=editions.map((e,i)=>{
    const pdf=SAFE_PATH.test(e.pdf||'')?`<a class="kwr-btn" href="${esc(e.pdf)}" download>Download rapport (PDF${e.pages?`, ${esc(e.pages)} pagina’s`:''}${mb(e.pdfBytes)?`, ${mb(e.pdfBytes)}`:''})</a>`:'';
    const data=SAFE_PATH.test(e.data||'')?`<a class="kwr-link" href="${esc(e.data)}" download>Download de data (SQLite)</a>`:'';
    const points=(e.highlights||[]).map(h=>`<li>${esc(h)}</li>`).join('');
    return `<article class="kwr-card" data-edition="${esc(e.id)}"><header><span class="kwr-q">${esc(e.quarter)}</span>${i===0?'<span class="kwr-new">Nieuwste</span>':''}</header><h3>${esc(e.title)}</h3><p>${esc(e.summary||'')}</p>${points?`<ul>${points}</ul>`:''}<p class="kwr-meta">Gepubliceerd ${esc(e.published||'')} · ${esc(e.sources??'')} bronnen · elke bron met datum en populatie in het rapport</p><div class="kwr-actions">${pdf}${data}</div></article>`;
  }).join('');
  return `<section class="kwr"><p class="kwr-intro">Elk kwartaal verschijnt een nieuwe editie, gebouwd uit een databestand met alle bronnen. Je ziet hier alle edities; oudere blijven beschikbaar.</p>${cards}</section>`;
}

const CSS='.kwr{display:grid;gap:14px;font:inherit;color:#14171a}.kwr-intro{margin:0;color:#5c646e}.kwr-card{border:1px solid #dcdfe6;border-radius:14px;padding:18px;background:#fff}.kwr-card header{display:flex;gap:8px;align-items:center;margin-bottom:6px}.kwr-q{font-weight:800;letter-spacing:.08em;color:#ff4f17}.kwr-new{background:#ffe86b;border-radius:4px;padding:1px 8px;font-size:.78rem;font-weight:700}.kwr-card h3{margin:0 0 6px}.kwr-card ul{margin:8px 0 8px 18px;padding:0}.kwr-meta{font-size:.82rem;color:#5c646e}.kwr-actions{display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-top:10px}.kwr-btn{background:#2742d6;color:#fff;border-radius:8px;padding:9px 14px;text-decoration:none;font-weight:700}.kwr-link{color:#2742d6}';

export async function mountKwartaalrapporten(root,{fetchFn=globalThis.fetch,manifestUrl=new URL('../reports/manifest.json',import.meta.url).href}={}){
  if(!root)return;
  if(!root.querySelector('style[data-kwr]')){const s=root.ownerDocument.createElement('style');s.setAttribute('data-kwr','');s.textContent=CSS;root.appendChild(s);}
  const host=root.ownerDocument.createElement('div');root.appendChild(host);
  host.innerHTML='<p>Rapporten laden…</p>';
  try{
    const response=await fetchFn(manifestUrl,{credentials:'same-origin'});
    if(!response.ok)throw new Error(`manifest ${response.status}`);
    host.innerHTML=renderEditions(await response.json());
  }catch{
    host.innerHTML='<p>De rapporten konden niet worden geladen. Probeer het zo opnieuw.</p>';
  }
}
