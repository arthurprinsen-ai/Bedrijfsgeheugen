import { bevindingen } from '../bevindingen.js';
import { allPageIds } from '../page-registry.js';
import { PROFILE_DIMENSIONS } from './company-input.js';

/**
 * De zes vragen die een directie stelt.
 *
 * Waarom dit bestand er is
 * ------------------------
 * Het portaal heeft negenenveertig pagina's in zes zijbalkgroepen. Die groepen
 * zeggen waar iets staat, niet waarom je er zou kijken. Een directie opent een
 * portaal met een vraag, niet met een map: hoe gezond zijn we, waar loopt het
 * vast, volgen we onze koers, wat komt er op ons af, wat kunnen we zelf, wat
 * besluiten we nu.
 *
 * Deze laag beantwoordt die zes vragen en stuurt door naar de pagina die het
 * antwoord draagt. Er wordt hier niets nieuws uitgerekend: elk antwoord komt
 * uit bevindingen.js, uit het eigen profiel of uit de eigen roadmap. Is dat er
 * niet, dan blijft de vraag eerlijk onbeantwoord, met de plek erbij waar je hem
 * kunt beantwoorden — een verzonnen antwoord is erger dan geen antwoord.
 *
 * De doelpagina wordt altijd getoetst aan de page-registry. Een bevinding die
 * naar een pagina wijst die niet bestaat, levert hier geen dode knop op maar
 * valt terug op de vaste pagina van de vraag.
 */

const arr = value => (Array.isArray(value) ? value : []);
const nl = (value, digits = 0) => new Intl.NumberFormat('nl-NL', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value || 0);
const euro = value => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
const datum = iso => new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
const meervoud = (aantal, enkel, meer) => `${aantal} ${aantal === 1 ? enkel : meer}`;
const esc = value => String(value ?? '').replace(/[&<>"]/g, teken => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[teken]));

/** Een doelpagina die niet in de zijbalk staat, bestaat niet. */
function bestaandePagina(kandidaat, terugval) {
  return allPageIds().includes(kandidaat) ? kandidaat : terugval;
}

/* ---------- de zes antwoorden ---------- */

/** Gezondheid is de volwassenheid die het bedrijf zelf heeft ingevuld. */
function gezond(state) {
  const maturity = state?.portal?.profile?.maturity;
  const waarden = Object.values(maturity || {}).map(Number).filter(Number.isFinite);
  if (!waarden.length) return null;
  const gemiddelde = waarden.reduce((som, waarde) => som + waarde, 0) / waarden.length;
  return {
    regel: `Gemiddeld ${nl(gemiddelde, 1)} van 5, over ${waarden.length} van de ${PROFILE_DIMENSIONS.length} bedrijfsonderdelen`,
    bron: 'Eigen profiel',
    pagina: 'profiel'
  };
}

/** Vastlopen is waar het geld blijft liggen: de bevindingen van het soort kosten. */
function vastlopen(_state, items) {
  const kosten = items.filter(item => item.soort === 'kosten');
  if (!kosten.length) return null;
  const bedrag = kosten.reduce((som, item) => som + (item.waarde || 0), 0);
  const zwaarste = kosten[0];
  return {
    regel: `${meervoud(kosten.length, 'knelpunt', 'knelpunten')} met een bedrag${bedrag ? `, samen ${euro(bedrag)} per jaar` : ''}. Zwaarste: ${zwaarste.titel}.`,
    bron: zwaarste.bron,
    pagina: bestaandePagina(zwaarste.pagina, 'ai-capabilities')
  };
}

/** Koers is de eigen roadmap: hoeveel staat er stil, en hoeveel is af. */
function koers(state) {
  const items = arr(state?.portal?.roadmap?.items);
  if (!items.length) return null;
  const klaar = items.filter(item => item.done === true).length;
  const stil = items.filter(item => item.done !== true && Number(item.progress || 0) === 0).length;
  return {
    regel: `${klaar} van de ${items.length} roadmaponderdelen is af; ${meervoud(stil, 'onderdeel staat', 'onderdelen staan')} nog op nul procent`,
    bron: 'Eigen roadmap',
    pagina: 'roadmap'
  };
}

/** Wat op je afkomt, heeft een datum: verplichtingen en marktontwikkelingen. */
function aankomend(_state, items) {
  const metDatum = items.filter(item => item.datum).sort((a, b) => String(a.datum).localeCompare(String(b.datum)));
  if (!metDatum.length) return null;
  const eerste = metDatum[0];
  return {
    regel: `${meervoud(metDatum.length, 'punt', 'punten')} met een harde datum. Eerstvolgende: ${eerste.titel}, ${datum(eerste.datum)}.`,
    bron: eerste.bron,
    pagina: bestaandePagina(eerste.pagina, 'compliance-governance')
  };
}

/** Wat je zelf kunt, zijn de kansen: geen verplichting, wel eigen keuze. */
function zelf(_state, items) {
  const kansen = items.filter(item => item.soort === 'kans');
  if (!kansen.length) return null;
  const eerste = kansen[0];
  return {
    regel: `${meervoud(kansen.length, 'kans', 'kansen')} die je op eigen kracht kunt pakken. Bovenaan: ${eerste.titel}.`,
    bron: eerste.bron,
    pagina: bestaandePagina(eerste.pagina, 'kansenkaart')
  };
}

/** Het besluit van vandaag is de bovenste bevinding, met de reden erbij. */
function besluit(_state, items) {
  const eerste = items[0];
  if (!eerste) return null;
  return { regel: `${eerste.titel} — ${eerste.reden}`, bron: eerste.bron, pagina: 'advies' };
}

/* ---------- de vragen zelf ---------- */

export const DIRECTIEVRAGEN = Object.freeze([
  Object.freeze({ id: 'gezond', vraag: 'Hoe gezond zijn we?', mist: 'Nog geen volwassenheid ingevuld voor de bedrijfsonderdelen.', invul: 'gegevens-invullen', antwoord: gezond }),
  Object.freeze({ id: 'vastlopen', vraag: 'Waar loopt het vast?', mist: 'Nog geen doorgerekend knelpunt: vul uren, kosten en omzet aan.', invul: 'gegevens-invullen', antwoord: vastlopen }),
  Object.freeze({ id: 'koers', vraag: 'Volgen we onze koers?', mist: 'Nog geen roadmap met eigenaren en voortgang.', invul: 'roadmap', antwoord: koers }),
  Object.freeze({ id: 'aankomend', vraag: 'Wat komt er op ons af?', mist: 'Nog geen verplichting of ontwikkeling met een datum voor dit bedrijf.', invul: 'compliance-governance', antwoord: aankomend }),
  Object.freeze({ id: 'zelf', vraag: 'Wat kunnen we zelf?', mist: 'Nog geen kansen afgeleid: doe eerst de scan.', invul: 'ai-scan', antwoord: zelf }),
  Object.freeze({ id: 'besluit', vraag: 'Wat besluiten we nu?', mist: 'Zonder eigen gegevens geen advies; het portaal verzint er geen.', invul: 'gegevens-invullen', antwoord: besluit })
]);

/** De zes vragen met hun antwoord, in vaste volgorde. */
export function directieAntwoorden(state = {}, peil = new Date().toISOString().slice(0, 10)) {
  const items = bevindingen(state, peil);
  return DIRECTIEVRAGEN.map(vraag => {
    const antwoord = vraag.antwoord(state, items) || null;
    return Object.freeze({
      id: vraag.id,
      vraag: vraag.vraag,
      regel: antwoord ? antwoord.regel : vraag.mist,
      bron: antwoord ? antwoord.bron : null,
      beantwoord: Boolean(antwoord),
      pagina: antwoord ? antwoord.pagina : bestaandePagina(vraag.invul, 'gegevens-invullen')
    });
  });
}

function kaart(antwoord) {
  return `<li class="dv-kaart${antwoord.beantwoord ? '' : ' dv-leeg'}">`
    + `<h3>${esc(antwoord.vraag)}</h3>`
    + `<p class="dv-regel">${esc(antwoord.regel)}</p>`
    + `<p class="dv-bron">${esc(antwoord.bron || 'Nog niet te beantwoorden')}</p>`
    + `<button type="button" data-pv-page="${esc(antwoord.pagina)}">${antwoord.beantwoord ? 'Bekijk' : 'Vul aan'} <i>→</i></button>`
    + '</li>';
}

/** De zes vragen als blok boven het overzicht. */
export function directievragenMarkup(state = {}, peil) {
  const antwoorden = directieAntwoorden(state, peil);
  return '<section class="dv" aria-label="De zes vragen">'
    + '<h2>Wat wil je verder weten?</h2>'
    + '<p class="dv-sub">Verdiep je vanuit je eigen gegevens. Elke knop opent het onderdeel waar het antwoord vandaan komt.</p>'
    + `<ol class="dv-lijst">${antwoorden.map(kaart).join('')}</ol>`
    + '</section>';
}

export const DIRECTIEVRAGEN_STIJL = `
.dv{background:var(--pv-card,#fff);border:1px solid var(--pv-line,#e3e8f0);border-radius:16px;padding:18px;margin:4px 0 14px}
.dv h2{font-size:15px;margin:0}
.dv-sub{font-size:13px;color:var(--pv-muted,#5b6b82);margin:2px 0 14px}
.dv-lijst{list-style:none;margin:0;padding:0;display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}
.dv-kaart{border:1px solid var(--pv-line,#e3e8f0);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:6px}
.dv-kaart h3{font-size:13px;margin:0;color:var(--pv-accent,#1d4ed8)}
.dv-regel{font-size:13px;margin:0;flex:1}
.dv-bron{font-size:11px;color:var(--pv-muted,#5b6b82);margin:0}
.dv-kaart button{align-self:flex-start;border:1px solid var(--pv-line,#e3e8f0);background:var(--pv-soft,#f1f4fa);border-radius:8px;padding:6px 10px;font:inherit;font-size:12px;font-weight:600;cursor:pointer}
.dv-kaart button:hover{border-color:var(--pv-accent,#1d4ed8)}
.dv-leeg .dv-regel{color:var(--pv-muted,#5b6b82)}
`;
