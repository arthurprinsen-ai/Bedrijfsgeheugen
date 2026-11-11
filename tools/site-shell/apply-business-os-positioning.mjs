import {readFile,writeFile} from 'node:fs/promises';

// One canonical website build pass, AFTER pricing/locales/daily positioning.
// No second funnel, publisher, scheduler, price catalog or billing authority.
const ORIGIN='https://www.bedrijfsgeheugen.nl';
const STYLE=`<style id="bg-one-roof-style">
.bg-one-roof{max-width:1180px;margin:28px auto;padding:clamp(18px,3vw,32px);border:1px solid #dce5e9;border-radius:22px;background:linear-gradient(135deg,#f9fcff 10%,#eff8f4 100%);color:#18314a}
.bg-one-roof *{box-sizing:border-box}.bg-one-roof .bgor-eyebrow{font-size:.73rem;font-weight:800;letter-spacing:.09em;color:#246b69;text-transform:uppercase}
.bg-one-roof h2{font-size:clamp(1.55rem,3vw,2.4rem);line-height:1.14;max-width:750px;letter-spacing:-.035em;margin:12px 0}
.bg-one-roof>p{max-width:820px;font-size:1rem;line-height:1.6;color:#435c6b}
.bg-one-roof .bgor-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:19px 0}
.bg-one-roof .bgor-step{background:#fff;padding:17px;border-radius:14px;border:1px solid #dfebeb}
.bg-one-roof .bgor-step strong{display:block;font-size:1rem;margin-bottom:7px}.bg-one-roof .bgor-step p{margin:0;color:#526877;font-size:.88rem;line-height:1.55}
.bg-one-roof .bgor-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.bg-one-roof .bgor-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:11px 17px;border-radius:11px;border:2px solid #16495c;text-decoration:none;font-size:.94rem;font-weight:800;color:#16495c}
.bg-one-roof .bgor-actions a:first-child{background:#16495c;color:#fff}.bg-one-roof .bgor-actions a:hover{text-decoration:underline}
.bg-one-roof .bgor-actions a:focus-visible{outline:3px solid #0e63bd;outline-offset:3px}
.bg-one-roof .bgor-evidence{margin:14px 0 0;font-size:.78rem;color:#496072}
@media(max-width:720px){.bg-one-roof{margin:20px 14px}.bg-one-roof .bgor-steps{grid-template-columns:1fr}.bg-one-roof .bgor-actions a{width:100%}}
@media(prefers-reduced-motion:reduce){.bg-one-roof *{scroll-behavior:auto}}
</style>`;
const COPY={
 nl:{
  home:{eyebrow:'BEDRIJFSGEHEUGEN · ÉÉN BEDRIJF',title:'Je bedrijf onder één dak. Je systemen blijven waar ze zijn.',
   intro:'Doelen, mensen, processen, klanten, projecten en cijfers krijgen samenhang. Vanuit één werkplek kies je de volgende stap; de bestaande ONE BRAIN–Powerhouse–Heartbeat-keten verwerkt, controleert en leert waar de bron en toestemming dat toelaten.',
   stages:[['Begrijp je bedrijf','Koppel kennis, brondata, doelen en een gratis nulmeting aan dezelfde bedrijfscontext.'],['Organiseer het werk','Zie wie verantwoordelijk is, welke stap volgt en wat op bevestiging wacht.'],['Verbeter met bewijs','Een advies is nog geen resultaat. Controleer uitvoering en effect voordat je verder stuurt.']],
   cta:'Start de gratis Bedrijfslek-scan →',second:'Bekijk het portaal',third:'Pakketten en prijzen',note:'Geen vervanging van je bestaande ERP of CRM nodig. Beschikbaarheid van workflows en integraties hangt af van je pakket en geautoriseerde koppelingen.'},
  price:{eyebrow:'ZO WERKT JE ABONNEMENT',title:'Eén werkplek. Begin klein en verbind wat voor jouw bedrijf telt.',
   intro:'Starter begint bij bedrijfsinzicht. Pro voegt onder meer goedkeuringen en eigenaren toe. Groei biedt meer automatiseringsruimte. Voor maatwerkkoppelingen en extra governance kijken we naar de Enterprise-scope. De actuele pakketgrenzen en tarieven staan hieronder.',
   stages:[['Eerst begrijpen','Begin gratis met een nulmeting zonder account of e-mailverplichting.'],['Dan verbinden','Kies het passende plan en sluit alleen benodigde, geautoriseerde systemen aan.'],['Daarna verbeteren','Werk vanuit het bestaande portaal en toets elke actie aan echte voortgang en bronbewijs.']],
   cta:'Doe eerst de gratis scan →',second:'Bekijk het portaal',third:'Vergelijk de pakketten',note:'Geen nieuwe prijslaag of automatische upgrade: abonnement en betaalvoorwaarden blijven uitsluitend gelden zoals hieronder gepubliceerd.'}
 },
 en:{
  home:{eyebrow:'BEDRIJFSGEHEUGEN · ONE BUSINESS',title:'One home for your business. Keep the systems you already use.',
   intro:'Bring goals, people, processes, customers, projects and financial data into one coherent view. Choose the next action in one workspace, with traceable source evidence and accountable execution through the existing ONE BRAIN–Powerhouse–Heartbeat chain.',
   stages:[['Understand the business','Connect knowledge, authorised data sources and goals to a shared business context.'],['Coordinate the work','See ownership, next steps and handoffs still awaiting confirmation.'],['Improve with evidence','A recommendation is not a realised result: verify execution and outcomes first.']],
   cta:'Start a free business scan →',second:'View the portal',third:'Plans and pricing',note:'No need to replace your ERP or CRM. Available workflows and integrations depend on the plan and authorised data access.'},
  price:{eyebrow:'HOW THE SUBSCRIPTION WORKS',title:'One workspace. Start small and connect what matters.',
   intro:'Starter focuses on insight, Pro adds approvals and owners, Growth offers more automation capacity, and Enterprise is scoped individually. Check the plan limits and prices below.',
   stages:[['Start with insight','Use a free assessment before selecting software.'],['Connect selectively','Choose a plan and integrate authorised systems.'],['Improve with proof','Track work and verify actual outcomes in the existing portal.']],
   cta:'Take the free scan →',second:'Explore the portal',third:'Compare plans',note:'No new pricing tier or automatic upgrade. Only the published terms and plan limits below apply.'}
 }
};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function markup(locale,page){
 const x=COPY[locale][page],scan=locale==='en'?'/en/zelfscan':'/zelfscan',pricing=locale==='en'?'/en/prijzen':'/prijzen';
 const plans=page==='price'?'#prijzen-pakketten':pricing;
 return `<section class="bg-one-roof" data-bg-business-os-journey="v1" aria-labelledby="bgor-title">
 <span class="bgor-eyebrow">${esc(x.eyebrow)}</span>
 <h2 id="bgor-title">${esc(x.title)}</h2>
 <p>${esc(x.intro)}</p>
 <div class="bgor-steps">${x.stages.map(([title,description])=>`<article class="bgor-step"><strong>${esc(title)}</strong><p>${esc(description)}</p></article>`).join('')}</div>
 <div class="bgor-actions">
  <a href="${ORIGIN+scan}" data-bg-conversion="bedrijfslek" data-bg-funnel-stage="discover">${esc(x.cta)}</a>
  <a href="${ORIGIN}/portaal-demo" data-bg-funnel-stage="consider">${esc(x.second)}</a>
  <a href="${page==='price'?ORIGIN+pricing+'#prijzen-pakketten':ORIGIN+pricing}" data-bg-funnel-stage="decide">${esc(x.third)}</a>
 </div><p class="bgor-evidence">${esc(x.note)}</p>
 </section>`;
}
export function applyBusinessOSPositioning(input,{locale='nl',page='home'}={}){
 if(!['nl','en'].includes(locale)||!['home','price'].includes(page))throw new Error('ONE_ROOF_SCOPE_INVALID');
 const original=String(input||'');
 if(!original.includes('<main')||!original.includes('</main>'))return original;
 if(original.includes('data-bg-business-os-journey="v1"'))return original;
 let html=original;
 if(!html.includes('id="bg-one-roof-style"'))html=html.replace('</head>',STYLE+'\n</head>');
 const block=markup(locale,page);
 // Place after the existing H1 hero and before the existing value section.
 // The original hero and the original conversion/canonical pricing stay intact.
 const spots=page==='home'
  ?[/<section\b[^>]*data-bg-business-value-first=["']v1["']/i,/<section\b[^>]*class=["'][^"']*\bbgvf\b[^"']*["']/i]
  :[/<section\b[^>]*id=["']prijzen-pakketten["']/i,/<section\b[^>]*class=["'][^"']*\bsec\b[^"']*["']/i];
 let at=-1;
 for(const re of spots){const m=re.exec(html);if(m){at=m.index;break;}}
 if(at<0)at=html.indexOf('</main>');
 return html.slice(0,at)+block+'\n'+html.slice(at);
}
export async function applyBusinessOSPages(){
 const changed=[];
 for(const [file,locale,page] of [['index.html','nl','home'],['en/index.html','en','home'],['prijzen.html','nl','price'],['en/prijzen.html','en','price']]){
  let existing;try{existing=await readFile(file,'utf8')}catch{continue}
  const next=applyBusinessOSPositioning(existing,{locale,page});
  if(next!==existing){await writeFile(file,next,'utf8');changed.push(file)}
 }
 return changed;
}
if(process.argv[1]&&import.meta.url.endsWith(process.argv[1].replace(/\\/g,'/'))){
 console.log('ONE_ROOF_CANONICAL_SITE_PASS',JSON.stringify(await applyBusinessOSPages()));
}
