// Eén zoekwoord, één pagina. Deze lijst komt uit de zoekwoordstrategie en is
// dezelfde die .github/scripts/seocontrole.py hanteert: wijzigt de strategie,
// werk dan beide bij.
//
// Waarom dit bestand er is: de schil van de homepage draagt haar eigen
// zoekwoordmeta mee. Zonder deze lijst erven alle pagina's dat woord, en op
// 1 september 2026 claimden 72 van de 81 pagina's zo 'digitalisering mkb' —
// pagina's die met elkaar concurreren verliezen allebei.

export const ZOEKWOORD_PER_PAGINA = {
  "/blog/systemen-koppelen-mkb/": "systemen koppelen mkb",
  "/blog/wat-kost-digitalisering-mkb/": "wat kost digitalisering mkb",
  "/blog/bedrijfsopvolging-begin-bij-het-geheugen/": "bedrijfsopvolging familiebedrijf kennis",
  "/blog/eu-ai-act-mkb/": "eu ai act mkb",
  "/blog/wat-kost-een-afas-koppeling/": "afas koppeling kosten",
  "/afas-pocket-koppelen": "afas pocket app koppelen",
  "/blog/automatiseren-zonder-traject/": "erp implementatie mislukt",
  "/ai-marketing-mkb": "ai marketing mkb",
  "/product": "kennisborging mkb",
  "/blog/werkinstructie-voorbeeld/": "werkinstructie voorbeeld",
  "/ai-adoptie": "ai adoptie mkb",
  "/ai-act": "ai act compliance mkb",
  "/workshops": "ai workshop mkb",
  "/ai-governance": "ai governance mkb",
  "/ai-capability-model": "ai capability model",
  "/data-soevereiniteit": "data soevereiniteit",
  "/business-case-ai": "business case ai mkb",
  "/ai-voor-bestuurders": "ai strategie directie",
  "/ai-implementeren": "ai implementeren mkb",
  "/ai-poc": "ai pilot opzetten mkb",
  "/bedrijfsprocessen-automatiseren": "bedrijfsprocessen automatiseren",
  "/exact-online-koppeling": "exact online koppeling",
  "/api-koppeling-laten-maken": "api koppeling laten maken",
  "/twinfield-koppeling": "twinfield koppeling",
  "/webshop-koppeling": "webshop koppelen boekhouding",
  "/ai-scan": "ai scan mkb",
  "/benchmark": "benchmark mkb digitalisering",
  "/afmaakindex": "afmaakindex",
  "/bedrijfsgeheugen": "bedrijfsgeheugen",
  "/blog/wat-is-een-bedrijfsgeheugen/": "kennisverlies mkb",
  "/begrippen": "begrippenlijst mkb"
};

// Het pad van een bestand terug naar het adres zoals het in de lijst staat.
export function zoekwoordVoor(bestand) {
  const pad = bestand === 'index.html'
    ? '/'
    : bestand.endsWith('/index.html')
      ? '/' + bestand.slice(0, -'index.html'.length)
      : '/' + bestand.replace(/\.html$/, '');
  return ZOEKWOORD_PER_PAGINA[pad] || ZOEKWOORD_PER_PAGINA[pad.replace(/\/$/, '')] || '';
}
