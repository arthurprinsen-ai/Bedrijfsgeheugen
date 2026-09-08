export const LEGACY_CAPABILITY_MAP = Object.freeze({
  overzicht:'overzicht', profiel:'profiel', dataai:'data-ai', aiscan:'ai-scan',
  invoeren:'gegevens-invullen', antwoorden:'ingevulde-gegevens', business:'businesscase',
  cijfers:'cijfers-maatstaven', waarde:'waarde-financiering', mensen:'mensen',
  branche:'branche-markt', onderzoek:'onderzoek', beleid:'compliance-governance',
  aicap:'ai-capabilities', strategie:'strategiemodellen', canvassen:'canvassen',
  eindconclusie:'eindconclusie', dd:'due-diligence', dna:'strategy-dna',
  bijhouden:'actueel-houden', wijzigingen:'wijzigingen', advies:'advies',
  offerte:'offerte', roadmap:'roadmap'
});

export const OVERVIEW_CAPABILITIES = Object.freeze([
  ['maturity','Volwassenheidsniveau','3,4 / 5','Gebaseerd op processen, data, kennis en uitvoering.'],
  ['manual-work-annual','Handmatig werk per jaar','6.720 uur','Capaciteit die kan verschuiven naar werk met meer waarde.'],
  ['fte','FTE-impact','3,7 FTE','Geen cashclaim: beschikbare capaciteit op jaarbasis.'],
  ['company-state','Bedrijfsstatus','In beweging','Sterk fundament met gerichte verbeterpunten.'],
  ['cmmi','Procesvolwassenheid','Niveau 3','Gestandaardiseerd; borgen en meten is de volgende stap.'],
  ['adoption-curve','Adoptiecurve','Early majority','Adoptie groeit, maar verschilt per team.'],
  ['leakage','Waarde-lekkage','11%','Indicatieve verspilling door overdracht, herstelwerk en handmatige stappen.'],
  ['blockers','Blokkades','5','Open belemmeringen met eigenaar en vervolgstap.'],
  ['progress','Voortgang','68%','Aandeel van de huidige verbeterroadmap dat op koers ligt.'],
  ['advice','Topadvies','Borg Finance-kennis','Hoogste combinatie van continuiteitsrisico en uitvoerbaarheid.']
]);

export const GLOBAL_CAPABILITIES = Object.freeze([
  'identity-login-logout','export','import','print-permission','feedback','customer-branding','mobile-navigation'
]);

function ensureStyles(){if(document.querySelector('link[data-v2-parity-style]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='./legacy-parity.css';l.dataset.v2ParityStyle='true';document.head.appendChild(l)}
function mountOverviewParity(){const anchor=document.querySelector('.kpis');if(!anchor||document.querySelector('[data-legacy-overview]'))return;const section=document.createElement('section');section.className='card legacyoverview';section.dataset.legacyOverview='true';section.innerHTML=`<div class="sectiontitle"><div><h3>Bedrijfsbeeld</h3><p>De volledige kernset uit het oorspronkelijke portaal, nu native in V2.</p></div><span>46 weken als conservatieve jaarbasis</span></div><div class="legacygrid">${OVERVIEW_CAPABILITIES.map(([id,label,value,detail])=>`<article data-overview-capability="${id}"><small>${label}</small><strong>${value}</strong><p>${detail}</p></article>`).join('')}</div>`;anchor.insertAdjacentElement('afterend',section)}
function bindLegacyDeepLinks(openPage){const raw=new URLSearchParams(location.search).get('legacy')||location.hash.replace(/^#/,'');const target=LEGACY_CAPABILITY_MAP[raw];if(target)requestAnimationFrame(()=>openPage(target))}
export function mountLegacyParity({openPage}){ensureStyles();mountOverviewParity();bindLegacyDeepLinks(openPage);document.querySelector('.mobilebar')?.setAttribute('data-capability','mobile-navigation')}
