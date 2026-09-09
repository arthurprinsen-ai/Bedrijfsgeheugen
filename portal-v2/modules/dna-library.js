import { CAPABILITIES, searchCatalog, translateToModel, CATALOG_FIELD_LABELS } from '../capability-catalog.js';
import { PROFILE_DIMENSIONS } from './company-input.js';

/**
 * De bouwstenenkast — teruggebracht uit het vorige klantportaal (velden
 * dnaZoek en dnaVrij).
 *
 * Twee ingangen op hetzelfde model:
 *   1. zoeken op capability, systeem, proces, gegeven of maatstaf;
 *   2. "vertel het in je eigen woorden": losse taal die wordt teruggelegd op
 *      de bouwstenen, zodat je ziet welke onderdelen je eigenlijk bedoelt.
 *
 * De vertaling is een woordmatch op de kast, geen taalmodel. Dat is bewust:
 * het portaal belooft dat het de verbanden in het model kent, niet dat het
 * iets nieuws verzint.
 */

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const dimLabel=id=>PROFILE_DIMENSIONS.find(item=>item.id===id)?.label||id;

function capabilityCard(item){
  const velden=Object.entries(CATALOG_FIELD_LABELS)
    .map(([veld,label])=>{const waarden=item[veld]||[];return waarden.length?`<div class="dnaveld"><span>${esc(label)}</span><b>${esc(waarden.join(' · '))}</b></div>`:'';})
    .join('');
  const treffers=(item.treffers||[]).length
    ? `<p class="dnahit">gevonden in ${esc([...new Set(item.treffers.map(hit=>hit.veld))].join(', '))}</p>` : '';
  return `<article class="dnakaart"><header><b>${esc(item.n)}</b><span>${esc(dimLabel(item.dim))}</span></header>${treffers}<div class="dnavelden">${velden}</div></article>`;
}

export function mountDnaLibrary(root){
  if(!root)return ()=>{};
  root.innerHTML=`
    <section class="pvmodule">
      <div class="pvmodulehead"><span>${Object.keys(CAPABILITIES).length}</span><h3>De bouwstenenkast</h3></div>
      <p class="wzsub">Alles wat het model kent. Zoek erin op capability, systeem, proces, gegeven of maatstaf.</p>
      <input type="search" class="dnazoek" data-dna-search placeholder="zoek op capability, systeem, proces of maatstaf" aria-label="Zoek in de bouwstenenkast">
      <div class="dnabieb" data-dna-results></div>
    </section>
    <section class="pvmodule">
      <div class="pvmodulehead"><span>↔</span><h3>Vertel het in je eigen woorden</h3></div>
      <p class="wzsub">Typ waar jullie heen willen. Geen strategisch jargon nodig — gewoon zoals je het tegen je team zou zeggen.</p>
      <div class="dnavrijrij">
        <input type="text" data-dna-free placeholder="bijv. we willen groeien zonder dat het hier vastloopt" aria-label="Waar willen jullie heen">
        <button type="button" class="primary" data-dna-translate>Vertaal naar mijn organisatie</button>
      </div>
      <output class="dnavrijuit" data-dna-free-out aria-live="polite"></output>
    </section>`;

  const results=root.querySelector('[data-dna-results]');
  const search=root.querySelector('[data-dna-search]');
  const renderResults=()=>{
    const found=searchCatalog(search.value);
    results.innerHTML=found.length
      ? found.map(capabilityCard).join('')
      : `<p class="wzsub">Niets gevonden voor “${esc(search.value)}”. De kast kent ${Object.keys(CAPABILITIES).length} bouwstenen.</p>`;
  };
  search.addEventListener('input',renderResults);
  renderResults();

  const free=root.querySelector('[data-dna-free]');
  const out=root.querySelector('[data-dna-free-out]');
  const translate=()=>{
    const uitkomst=translateToModel(free.value);
    if(!uitkomst.capabilities.length){
      out.innerHTML=`<p class="wzsub">Hier kan het model nog niets aan koppelen. Probeer woorden die bij je werk horen — klanten, offertes, planning, onderhoud, cijfers.</p>`;
      return;
    }
    const perDim=uitkomst.dimensies.map(dim=>{
      const caps=uitkomst.capabilities.filter(item=>item.dim===dim);
      return `<li><b>${esc(dimLabel(dim))}</b> — ${esc(caps.map(item=>item.naam).join(', '))}</li>`;
    }).join('');
    out.innerHTML=`<p class="wzsub">Wat je zegt raakt ${uitkomst.dimensies.length} ${uitkomst.dimensies.length===1?'onderdeel':'onderdelen'} en ${uitkomst.capabilities.length} ${uitkomst.capabilities.length===1?'bouwsteen':'bouwstenen'}.</p><ul class="dnavertaal">${perDim}</ul>`;
  };
  root.querySelector('[data-dna-translate]').addEventListener('click',translate);
  free.addEventListener('keydown',event=>{if(event.key==='Enter')translate();});

  return ()=>{root.innerHTML='';};
}
