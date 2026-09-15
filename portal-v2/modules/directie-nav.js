import { listPortalGroups } from '../page-registry.js';

/**
 * De zijbalk als stuurmodel.
 *
 * Wat hier verandert ten opzichte van de vorige zijbalk: een groep is geen map
 * meer maar een vraag, en achter elke vraag staat of het portaal hem op dit
 * moment k\u00e1n beantwoorden uit eigen gegevens. Daarmee doet de navigatie zelf
 * het werk dat eerst alleen het blok op Overzicht deed - je ziet in \u00e9\u00e9n blik
 * waar je bedrijf een antwoord heeft en waar nog niet.
 *
 * Twee ontwerpregels die hier hard in zitten:
 *
 * 1. Geen getal in de zijbalk. De status is beantwoord of aan te vullen, meer
 *    niet. Een cijfer in een menu is een cijfer zonder bron, en dat is precies
 *    wat dit portaal nergens wil tonen.
 * 2. Klikken op de vraag opent het antwoord, niet een map. Het chevron ernaast
 *    vouwt de onderliggende pagina's open. E\u00e9n handeling, \u00e9\u00e9n uitkomst: een
 *    knop die soms navigeert en soms uitklapt, leert niemand zich aan.
 *
 * `directieNavModel` is expres een pure functie zonder DOM en zonder rekenwerk:
 * de antwoorden komen binnen als argument. Zo is de zijbalk te toetsen zonder
 * browser, en kan hij nooit een ander antwoord tonen dan het Overzicht.
 */

const STATUS = Object.freeze({
  beantwoord: { klasse: 'is-beantwoord', tekst: 'Beantwoord uit je eigen gegevens' },
  aanvullen: { klasse: 'is-aanvullen', tekst: 'Nog aan te vullen' },
  onbekend: { klasse: 'is-onbekend', tekst: 'Nog niet berekend' }
});

const esc = value => String(value ?? '').replace(/[&<>"]/g, teken => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[teken]));

/**
 * De zijbalk als gegevens: groepen, hun status en waar ze heen wijzen.
 *
 * @param {Array} antwoorden uitkomst van directieAntwoorden(); leeg mag ook
 * @param {string|null} actievePagina de pagina die nu open staat
 */
export function directieNavModel(antwoorden = [], actievePagina = null) {
  const perVraag = new Map((Array.isArray(antwoorden) ? antwoorden : []).map(item => [item.id, item]));
  return listPortalGroups().map(groep => {
    const antwoord = groep.vraagId ? perVraag.get(groep.vraagId) : null;
    const status = !groep.vraagId ? null : antwoord ? (antwoord.beantwoord ? 'beantwoord' : 'aanvullen') : 'onbekend';
    const paginas = groep.pages.map(pagina => ({ id: pagina.id, label: pagina.label, actief: pagina.id === actievePagina }));
    return {
      id: groep.id,
      vraagId: groep.vraagId || null,
      label: groep.label,
      domein: groep.domein || '',
      icoon: groep.icoon || '\u2022',
      status,
      statusTekst: status ? STATUS[status].tekst : '',
      // Klikken op de vraag opent het antwoord: de pagina waar het vandaan komt
      // als die er is, anders de eerste pagina van de groep.
      doel: antwoord?.pagina || groep.pages[0]?.id || 'overzicht',
      bevatActievePagina: paginas.some(pagina => pagina.actief),
      paginas
    };
  });
}

function groepMarkup(groep, open) {
  const subId = `dvnav-sub-${groep.id}`;
  const stip = groep.status
    ? `<span class="dvnav-stip ${STATUS[groep.status].klasse}" role="img" aria-label="${esc(groep.statusTekst)}" title="${esc(groep.statusTekst)}"></span>`
    : '';
  const subknoppen = groep.paginas.map(pagina =>
    `<li><button type="button" class="dvnav-pagina${pagina.actief ? ' actief' : ''}" data-dvnav-pagina="${esc(pagina.id)}"${pagina.actief ? ' aria-current="page"' : ''}>${esc(pagina.label)}</button></li>`
  ).join('');
  return `<div class="dvnav-groep${groep.bevatActievePagina ? ' bevat-actief' : ''}" data-dvnav-groep="${esc(groep.id)}">`
    + '<div class="dvnav-rij">'
    + `<button type="button" class="dvnav-vraag" data-dvnav-pagina="${esc(groep.doel)}" data-nav-target="${esc(groep.doel)}">`
    + `<span class="dvnav-ico" aria-hidden="true">${esc(groep.icoon)}</span>`
    + `<span class="dvnav-tekst"><b>${esc(groep.label)}</b>${groep.domein ? `<small>${esc(groep.domein)}</small>` : ''}</span>`
    + stip
    + '</button>'
    + `<button type="button" class="dvnav-klap" aria-expanded="${open ? 'true' : 'false'}" aria-controls="${subId}" aria-label="Onderdelen bij ${esc(groep.label)}"><span aria-hidden="true">\u203a</span></button>`
    + '</div>'
    + `<ul class="dvnav-sub" id="${subId}"${open ? '' : ' hidden'}>${subknoppen}</ul>`
    + '</div>';
}

export function directieNavMarkup(model = [], openGroep = null) {
  return model.map(groep => groepMarkup(groep, groep.id === openGroep || (openGroep === null && groep.bevatActievePagina))).join('');
}

function huidigePagina(doc) {
  try {
    const params = new URLSearchParams(doc?.defaultView?.location?.search || globalThis.location?.search || '');
    return params.get('page') || 'overzicht';
  } catch { return 'overzicht'; }
}

export const DIRECTIE_NAV_STIJL = `
.nav[data-directie="true"]{display:grid;gap:4px;align-content:start;overflow-y:auto;padding-right:2px}
.dvnav-groep{border-radius:12px}
.dvnav-groep.bevat-actief{background:#f6f8ff}
.dvnav-rij{display:grid;grid-template-columns:minmax(0,1fr) 30px;align-items:center;gap:2px}
.nav[data-directie="true"] .dvnav-vraag{height:auto;min-height:46px;padding:8px 10px;display:grid;grid-template-columns:22px minmax(0,1fr) 10px;align-items:center;gap:10px;border:1px solid transparent;border-radius:12px;background:transparent;text-align:left;color:#19204b;transition:.16s ease}
.nav[data-directie="true"] .dvnav-vraag:hover{background:#f5f7ff;border-color:#edf0fb}
.dvnav-ico{width:22px;text-align:center;color:#1954c8;font-size:15px}
.dvnav-tekst{min-width:0}
.dvnav-tekst b{display:block;font-size:12.5px;font-weight:800;line-height:1.25;letter-spacing:-.01em}
.dvnav-tekst small{display:block;font-size:10px;color:#7280a2;font-weight:600;line-height:1.3;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dvnav-stip{width:8px;height:8px;border-radius:50%;background:#dfe4f2;display:block}
.dvnav-stip.is-beantwoord{background:#10b981;box-shadow:0 0 0 3px #d9f6ec}
.dvnav-stip.is-aanvullen{background:#f59e0b;box-shadow:0 0 0 3px #fdf0d8}
.dvnav-stip.is-onbekend{background:#dfe4f2}
.nav[data-directie="true"] .dvnav-klap{height:30px;width:30px;padding:0;border:0;border-radius:9px;background:transparent;color:#8b97b8;display:grid;place-items:center;font-size:15px}
.nav[data-directie="true"] .dvnav-klap:hover{background:#eef2ff;color:#4338ca}
.dvnav-klap span{display:block;transition:transform .16s ease}
.dvnav-klap[aria-expanded="true"] span{transform:rotate(90deg)}
.dvnav-sub{list-style:none;margin:0 0 6px;padding:2px 0 2px 32px;display:grid;gap:1px}
.nav[data-directie="true"] .dvnav-pagina{height:30px;min-height:30px;padding:0 8px;border:0;border-radius:8px;background:transparent;text-align:left;font-size:11.5px;font-weight:600;color:#55617e;display:block;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nav[data-directie="true"] .dvnav-pagina:hover{background:#f1f4ff;color:#2740a8}
.nav[data-directie="true"] .dvnav-pagina.actief{background:#eef2ff;color:#4338ca;font-weight:800}
.nav[data-directie="true"] .dvnav-vraag:focus-visible,.nav[data-directie="true"] .dvnav-klap:focus-visible,.nav[data-directie="true"] .dvnav-pagina:focus-visible{outline:2px solid #4f46e5;outline-offset:1px}
@media (prefers-reduced-motion:reduce){.nav[data-directie="true"] *{transition:none!important}}
`;

/**
 * Zet de zijbalk om naar de zes vragen en houdt hem bij.
 *
 * @param {Document|Element} root
 * @param {{open:(pageId:string)=>void, antwoordenVoor:(state:object)=>Array}} opties
 */
export function mountDirectieNav(root = document, { open, antwoordenVoor } = {}) {
  const doc = root.ownerDocument || root;
  const nav = root.querySelector?.('.sidebar .nav') || doc.querySelector?.('.sidebar .nav');
  if (!nav) return null;

  if (doc.head && !doc.getElementById('dvnav-stijl')) {
    const tag = doc.createElement('style');
    tag.id = 'dvnav-stijl';
    tag.textContent = DIRECTIE_NAV_STIJL;
    doc.head.appendChild(tag);
  }

  let laatsteState = {};
  let openGroep = null;

  const teken = () => {
    const pagina = huidigePagina(doc);
    const antwoorden = typeof antwoordenVoor === 'function' ? (antwoordenVoor(laatsteState) || []) : [];
    const model = directieNavModel(antwoorden, pagina);
    nav.dataset.directie = 'true';
    nav.setAttribute('aria-label', 'De zes vragen');
    nav.innerHTML = directieNavMarkup(model, openGroep);
  };

  nav.addEventListener('click', event => {
    const klap = event.target.closest?.('.dvnav-klap');
    if (klap) {
      const groep = klap.closest('.dvnav-groep')?.dataset.dvnavGroep || null;
      openGroep = klap.getAttribute('aria-expanded') === 'true' ? '' : groep;
      teken();
      return;
    }
    const knop = event.target.closest?.('[data-dvnav-pagina]');
    if (!knop) return;
    const pagina = knop.dataset.dvnavPagina;
    if (knop.classList.contains('dvnav-vraag')) openGroep = knop.closest('.dvnav-groep')?.dataset.dvnavGroep || null;
    if (typeof open === 'function') open(pagina);
    teken();
  });

  // Het antwoordblok op Overzicht kan een vraag in de zijbalk openvouwen; zo
  // hangen de twee plekken waar de zes vragen staan aan elkaar vast.
  doc.addEventListener?.('bg:open-vraag', event => {
    openGroep = event?.detail?.groep || null;
    teken();
    nav.querySelector(`[data-dvnav-groep="${openGroep}"] .dvnav-vraag`)?.focus?.();
  });

  doc.defaultView?.addEventListener?.('popstate', teken);

  teken();
  return {
    refresh(state) { if (state) laatsteState = state; teken(); },
    element: nav
  };
}
