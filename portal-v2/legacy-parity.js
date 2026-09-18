export const LEGACY_CAPABILITY_MAP = Object.freeze({
  overzicht:'overzicht', profiel:'profiel', dataai:'data-ai', aiscan:'ai-scan',
  invoeren:'gegevens-invullen', antwoorden:'ingevulde-gegevens', business:'businesscase',
  cijfers:'cijfers-maatstaven', waarde:'waarde-financiering', mensen:'mensen',
  branche:'branche-markt', onderzoek:'onderzoek', beleid:'compliance-governance',
  aicap:'ai-capabilities', strategie:'strategiemodellen', canvassen:'canvassen',
  eindconclusie:'eindconclusie', dd:'due-diligence', dna:'strategy-dna',
  bijhouden:'actueel-houden', wijzigingen:'wijzigingen', advies:'advies',
  offerte:'offerte', roadmap:'roadmap', uitvoering:'uitvoeringsladder'
});

/*
 * Compatibility manifest only. It deliberately contains identifiers, never
 * customer-facing values. Business truth is projected from canonical
 * Powerhouse state by modules/overview.js.
 */
export const OVERVIEW_CAPABILITIES = Object.freeze([
  'maturity','manual-work-annual','fte','company-state','cmmi','adoption-curve','leakage','blockers','progress','advice'
].map(id=>Object.freeze([id])));

export const GLOBAL_CAPABILITIES = Object.freeze([
  'identity-login-logout','export','import','print-permission','feedback','customer-branding','mobile-navigation'
]);

function ensureStyles(){if(document.querySelector('link[data-v2-parity-style]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='./legacy-parity.css';l.dataset.v2ParityStyle='true';document.head.appendChild(l)}

/*
 * Het overzicht heeft één business-truth authority: de canonieke Powerhouse
 * state die via modules/overview.js wordt geprojecteerd. De parity-laag mag
 * daarom alleen de bestaande V2-oppervlakte markeren en nooit voorbeeld- of
 * fallbackgetallen injecteren.
 */
function mountOverviewParity(){
  const anchor=document.querySelector('.kpis');
  if(!anchor)return;
  anchor.dataset.legacyOverview='canonical-powerhouse';
}

function bindLegacyDeepLinks(openPage){const raw=new URLSearchParams(location.search).get('legacy')||location.hash.replace(/^#/,'');const target=LEGACY_CAPABILITY_MAP[raw];if(target)requestAnimationFrame(()=>openPage(target))}
export function mountLegacyParity({openPage}){ensureStyles();mountOverviewParity();bindLegacyDeepLinks(openPage);document.querySelector('.mobilebar')?.setAttribute('data-capability','mobile-navigation')}
