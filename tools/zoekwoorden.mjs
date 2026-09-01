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
  "/blog/bedrijfsopvolging-begin-bij-het-geheugen/": "bedrijfsopvolging",
  "/blog/eu-ai-act-mkb/": "eu ai act mkb",
  "/blog/wat-kost-een-afas-koppeling/": "afas koppeling kosten",
  "/afas-pocket-koppelen": "afas pocket app koppelen",
  "/blog/automatiseren-zonder-traject/": "erp implementatie mislukt",
  "/ai-marketing-mkb": "ai marketing mkb",
  "/product": "kennisborging mkb",
  "/blog/werkinstructie-voorbeeld/": "werkinstructie voorbeeld",
  "/ai-adoptie": "ai adoptie mkb",
  "/ai-act": "ai act",
  "/workshops": "ai workshop",
  "/ai-governance": "ai governance mkb",
  "/ai-capability-model": "ai capability model",
  "/data-soevereiniteit": "data soevereiniteit",
  "/business-case-ai": "business case ai mkb",
  "/ai-voor-bestuurders": "ai strategie directie",
  "/ai-implementeren": "ai implementeren mkb",
  "/ai-poc": "ai pilot opzetten mkb",
  "/bedrijfsprocessen-automatiseren": "bedrijfsprocessen automatiseren",
  "/exact-online-koppeling": "exact online api",
  "/api-koppeling-laten-maken": "afas api",
  "/twinfield-koppeling": "twinfield boekhouding",
  "/webshop-koppeling": "webshop koppelen boekhouding",
  "/ai-scan": "ai scan mkb",
  "/benchmark": "benchmark mkb digitalisering",
  "/afmaakindex": "afmaakindex",
  "/bedrijfsgeheugen": "bedrijfsgeheugen",
  "/blog/wat-is-een-bedrijfsgeheugen/": "kennisverlies mkb",
  "/begrippen": "begrippenlijst mkb",
  "/afas-koppeling": "afas koppeling"
};

// Het pad van een bestand terug naar het adres zoals het in de lijst staat.
// het woord van de homepage: geen andere pagina mag dit claimen
export const HOMEPAGE_WOORD = 'digitalisering mkb';

export function zoekwoordVoor(bestand) {
  const pad = bestand === 'index.html'
    ? '/'
    : bestand.endsWith('/index.html')
      ? '/' + bestand.slice(0, -'index.html'.length)
      : '/' + bestand.replace(/\.html$/, '');
  return ZOEKWOORD_PER_PAGINA[pad] || ZOEKWOORD_PER_PAGINA[pad.replace(/\/$/, '')] || '';
}


// Titels die te lang waren voor de zoekresultaten (Google kapt rond 65 tekens)
// of die hun eigen zoekwoord niet noemden. Staat een pagina hier, dan wint deze
// titel van wat er in het bestand of in de weergavelijst staat.
export const TITEL_PER_PAGINA = {
  "/product": "Kennisborging mkb: alles op één plek | Bedrijfsgeheugen",
  "/zelfscan": "Gratis zelfscan: waar lekt je tijd weg? | Bedrijfsgeheugen",
  "/frisse-blik": "Frisse blik: van gevoel naar agenda | Bedrijfsgeheugen",
  "/security": "Beveiliging en eigenaarschap van je data | Bedrijfsgeheugen",
  "/templates": "Templates en calculators voor het mkb | Bedrijfsgeheugen",
  "/onderzoeken": "Onderzoek en cijfers over digitalisering | Bedrijfsgeheugen",
  "/data-soevereiniteit": "Data-soevereiniteit: ChatGPT en je gegevens | Bedrijfsgeheugen",
  "/cases": "Praktijkvoorbeelden digitalisering mkb | Bedrijfsgeheugen",
  "/oplossingen": "Digitalisering oplossingen mkb | Bedrijfsgeheugen",
  "/prijzen": "Kosten digitalisering mkb: vaste prijzen | Bedrijfsgeheugen",
  "/api-koppeling-laten-maken": "AFAS API koppeling laten maken | Bedrijfsgeheugen"
};

export function titelVoor(bestand) {
  const pad = bestand === 'index.html' ? '/'
    : bestand.endsWith('/index.html') ? '/' + bestand.slice(0, -'index.html'.length)
    : '/' + bestand.replace(/\.html$/, '');
  return TITEL_PER_PAGINA[pad] || TITEL_PER_PAGINA[pad.replace(/\/$/, '')] || '';
}
