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

const STORAGE_PREFIX='bg-v2-';
const BRAND_KEY=`${STORAGE_PREFIX}brand`;
const FEEDBACK_KEY=`${STORAGE_PREFIX}feedback`;

function safeParse(value,fallback){try{return JSON.parse(value)}catch{return fallback}}
function ensureStyles(){if(document.querySelector('link[data-v2-parity-style]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='./legacy-parity.css';l.dataset.v2ParityStyle='true';document.head.appendChild(l)}
function setBrand(name){const clean=String(name||'').trim();if(!clean)return;localStorage.setItem(BRAND_KEY,clean);const brand=document.querySelector('.brand');if(brand)brand.lastChild.textContent=clean;document.documentElement.dataset.customerBrand=clean}
function restoreBrand(){const brand=localStorage.getItem(BRAND_KEY);if(brand)setBrand(brand)}
function ensureIdentity(){if(window.netlifyIdentity)return Promise.resolve(window.netlifyIdentity);return new Promise(resolve=>{const existing=document.querySelector('script[data-v2-identity]');if(existing){existing.addEventListener('load',()=>resolve(window.netlifyIdentity||null),{once:true});return;}const script=document.createElement('script');script.src='https://identity.netlify.com/v1/netlify-identity-widget.js';script.async=true;script.dataset.v2Identity='true';script.addEventListener('load',()=>resolve(window.netlifyIdentity||null),{once:true});script.addEventListener('error',()=>resolve(null),{once:true});document.head.appendChild(script)})}
function exportSnapshot(){const data={version:2,exportedAt:new Date().toISOString(),storage:{}};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith(STORAGE_PREFIX))data.storage[key]=localStorage.getItem(key)}const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`bedrijfsgeheugen-v2-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url)}
function importSnapshot(file){if(!file)return;const reader=new FileReader();reader.onload=()=>{const payload=safeParse(reader.result,null);if(!payload||payload.version!==2||typeof payload.storage!=='object'){alert('Dit is geen geldige Portal V2-export.');return;}for(const [key,value] of Object.entries(payload.storage)){if(key.startsWith(STORAGE_PREFIX)&&typeof value==='string')localStorage.setItem(key,value)}restoreBrand();alert('Portal V2-gegevens zijn geïmporteerd.')};reader.readAsText(file)}
function requestPrint(){if(confirm('Rapport afdrukken? Alleen informatie waarvoor je in deze sessie toegang hebt wordt meegenomen.'))window.print()}
function captureFeedback(){const text=prompt('Welke feedback wil je vastleggen?');if(!text?.trim())return;const items=safeParse(localStorage.getItem(FEEDBACK_KEY),'[]');const list=Array.isArray(items)?items:[];list.push({text:text.trim(),at:new Date().toISOString()});localStorage.setItem(FEEDBACK_KEY,JSON.stringify(list));alert('Feedback is vastgelegd in Portal V2.')}
function changeBrand(){const current=localStorage.getItem(BRAND_KEY)||'Bedrijfsgeheugen';const next=prompt('Welke klantnaam wil je in Portal V2 tonen?',current);if(next)setBrand(next)}
async function logout(){const identity=await ensureIdentity();if(identity?.currentUser?.())await identity.logout();else alert('Er is geen actieve Netlify Identity-sessie om uit te loggen.')}
function utilityButton(label,capability,handler){const b=document.createElement('button');b.type='button';b.className='smallbtn';b.dataset.capability=capability;b.textContent=label;b.addEventListener('click',handler);return b}
function mountUtilities(){const host=document.querySelector('.actionrow');if(!host||host.querySelector('[data-v2-utilities]'))return;const wrap=document.createElement('div');wrap.className='v2utilities';wrap.dataset.v2Utilities='true';const input=document.createElement('input');input.type='file';input.accept='application/json';input.hidden=true;input.addEventListener('change',()=>importSnapshot(input.files?.[0]));wrap.append(utilityButton('Export','export',exportSnapshot),utilityButton('Import','import',()=>input.click()),utilityButton('Print','print-permission',requestPrint),utilityButton('Feedback','feedback',captureFeedback),utilityButton('Klantmerk','customer-branding',changeBrand),utilityButton('Uitloggen','identity-login-logout',logout),input);host.appendChild(wrap)}
function mountOverviewParity(){const anchor=document.querySelector('.kpis');if(!anchor||document.querySelector('[data-legacy-overview]'))return;const section=document.createElement('section');section.className='card legacyoverview';section.dataset.legacyOverview='true';section.innerHTML=`<div class="sectiontitle"><div><h3>Bedrijfsbeeld</h3><p>De volledige kernset uit het oorspronkelijke portaal, nu native in V2.</p></div><span>46 weken als conservatieve jaarbasis</span></div><div class="legacygrid">${OVERVIEW_CAPABILITIES.map(([id,label,value,detail])=>`<article data-overview-capability="${id}"><small>${label}</small><strong>${value}</strong><p>${detail}</p></article>`).join('')}</div>`;anchor.insertAdjacentElement('afterend',section)}
function bindLegacyDeepLinks(openPage){const raw=new URLSearchParams(location.search).get('legacy')||location.hash.replace(/^#/,'');const target=LEGACY_CAPABILITY_MAP[raw];if(target)requestAnimationFrame(()=>openPage(target))}
export function mountLegacyParity({openPage}){ensureStyles();restoreBrand();mountUtilities();mountOverviewParity();bindLegacyDeepLinks(openPage);document.querySelector('.mobilebar')?.setAttribute('data-capability','mobile-navigation');ensureIdentity()}
