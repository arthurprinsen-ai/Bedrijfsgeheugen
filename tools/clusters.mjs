// De clusters uit de zoekwoordstrategie, gelijk aan die in
// .github/scripts/seocontrole.py. Een cluster is pas een cluster als de pagina's
// naar elkaar wijzen: de pijler naar zijn leden, elk lid terug naar de pijler.
// Zonder die links is het een stapel losse pagina's en verdeelt Google de
// autoriteit niet.

export const CLUSTERS = {
  "/afas-koppeling": [
    "/exact-online-koppeling",
    "/twinfield-koppeling",
    "/webshop-koppeling",
    "/api-koppeling-laten-maken"
  ],
  "/bedrijfsgeheugen": [
    "/blog/wat-is-een-bedrijfsgeheugen/",
    "/zelfscan",
    "/product",
    "/afmaakindex",
    "/frisse-blik",
    "/systemen-koppelen",
    "/due-diligence",
    "/ai-adoptie",
    "/begrippen"
  ],
  "/blog/systemen-koppelen-mkb/": [
    "/blog/afas-exact-koppelen/",
    "/blog/afas-koppeling/",
    "/blog/wat-kost-een-afas-koppeling/",
    "/blog/wat-kost-een-afas-partner/",
    "/blog/planning-in-excel-vervangen/",
    "/blog/offertes-opvolgen-zonder-crm/",
    "/connect",
    "/systemen-koppelen"
  ],
  "/blog/wat-kost-digitalisering-mkb/": [
    "/blog/wat-kost-een-afas-koppeling/",
    "/blog/wat-kost-een-afas-partner/",
    "/blog/automatiseren-zonder-traject/",
    "/frisse-blik"
  ],
  "/blog/wat-is-een-bedrijfsgeheugen/": [
    "/blog/bedrijfsopvolging-begin-bij-het-geheugen/",
    "/product",
    "/zelfscan",
    "/blog/werkinstructie-voorbeeld/"
  ],
  "/blog/bedrijfsopvolging-begin-bij-het-geheugen/": [
    "/due-diligence",
    "/investeerders-ma",
    "/blog/wat-is-een-bedrijfsgeheugen/"
  ],
  "/ai-adoptie": [
    "/ai-act",
    "/ai-governance",
    "/data-soevereiniteit",
    "/business-case-ai",
    "/ai-voor-bestuurders",
    "/ai-implementeren",
    "/ai-poc",
    "/workshops",
    "/ai-scan",
    "/benchmark",
    "/afmaakindex",
    "/ai-capability-model"
  ]
};

const NAAM = pad => pad.replace(/^\/(blog\/)?/, '').replace(/\/$/, '').replace(/-/g, ' ')
  .replace(/^./, l => l.toUpperCase());

export function padVanBestand(bestand) {
  if (bestand === 'index.html') return '/';
  if (bestand.endsWith('/index.html')) return '/' + bestand.slice(0, -'index.html'.length);
  return '/' + bestand.replace(/\.html$/, '');
}

// het blok met verwijzingen binnen het cluster waar deze pagina in zit
export function clusterblok(bestand, titels = {}) {
  const pad = padVanBestand(bestand);
  const noem = p => titels[p] || NAAM(p);

  if (CLUSTERS[pad]) {
    const leden = CLUSTERS[pad].map(p => `<a href="${p}">${noem(p)}</a>`).join('');
    return blok('In dit onderwerp', `Deze pagina is het vertrekpunt. Van hieruit gaat het verder:`, leden);
  }
  for (const [pijler, leden] of Object.entries(CLUSTERS)) {
    if (!leden.includes(pad)) continue;
    const rest = leden.filter(p => p !== pad).slice(0, 5);
    const links = [`<a href="${pijler}" class="bgx-pijler">${noem(pijler)}</a>`]
      .concat(rest.map(p => `<a href="${p}">${noem(p)}</a>`)).join('');
    return blok('Verder in dit onderwerp', 'Begin bij het overzicht, of spring naar een aangrenzend stuk:', links);
  }
  return '';
}

function blok(kop, uitleg, links) {
  return `<nav class="bgx-cluster" data-op aria-label="${kop}">
<div class="bgx-kop">${kop}</div>
<p>${uitleg}</p>
<div class="bgx-links">${links}</div>
</nav>`;
}

export const CLUSTER_CSS = `<style id="v18-cluster">
.bgx-cluster{max-width:none!important;background:var(--white);border:1px solid var(--line);border-radius:22px;
  padding:24px 26px;margin:34px 0;box-shadow:0 1px 2px rgba(7,21,35,.04),0 16px 40px rgba(7,21,35,.06)}
.bgx-cluster .bgx-kop{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11.5px;letter-spacing:.14em;
  text-transform:uppercase;color:#C2410C}
.bgx-cluster p{font-size:15.5px!important;color:var(--muted);margin:8px 0 14px}
.bgx-links{display:flex;flex-wrap:wrap;gap:9px}
.bgx-links a{background:var(--paper);border:1px solid var(--line);border-radius:999px;padding:9px 16px;
  font-size:14.5px;font-weight:650;text-decoration:none;color:var(--ink);transition:.2s ease}
.bgx-links a:hover{border-color:var(--blue);color:var(--blue);transform:translateY(-2px)}
.bgx-links a.bgx-pijler{background:var(--ink);color:#fff;border-color:var(--ink)}
</style>`;
