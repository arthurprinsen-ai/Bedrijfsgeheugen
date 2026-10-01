import { readFile, writeFile, access } from 'node:fs/promises';

const catalog=JSON.parse(await readFile('config/commercial-offers-v1.json','utf8'));
const euro=cents=>cents==null?'Op maat':new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(cents/100);
const esc=value=>String(value).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const yes='✓';

function renderSaas(){
 return catalog.saas.map((p,i)=>`<article class="pcard ${p.code==='pro'?'featured':''}">
  ${p.code==='pro'?'<div class="badge">Meest gekozen</div>':''}
  <div class="icon">◇</div><h3>${esc(p.name)}</h3><p class="aud">Voor ${esc(p.employees)}</p>
  <div class="price">${p.monthly_price_cents==null?'Op maat':euro(p.monthly_price_cents)}${p.monthly_price_cents!=null?'<span>/ maand</span>':''}</div>
  <p class="pos">${esc(p.positioning)}</p>
  <ul>
   <li>${yes} Tot ${p.users>=999?'onbeperkt':p.users} gebruikers</li>
   <li>${yes} ${p.data_sources>=999?'Onbeperkt':p.data_sources} integraties</li>
   <li>${yes} ${p.documents>=999999?'Onbeperkt':p.documents} documenten</li>
   <li>${yes} ${p.refresh_minutes===0?'On-demand':p.refresh_minutes<60?'Elke '+p.refresh_minutes+' min':p.refresh_minutes===60?'Elk uur':'Dagelijks'} datarefresh</li>
   <li>${yes} ${p.ai_requests_month>=999999?'Fair use':p.ai_requests_month} AI-vragen / maand</li>
   <li>${yes} ${p.automations>=999?'Automatiseringen op maat':p.automations+' automatiseringen'}</li>
   ${p.approval_workflows?'<li>✓ Goedkeuringen & workflows</li>':''}
   ${p.sso?'<li>✓ SSO / werkaccount</li>':''}
   ${p.audit_trail?'<li>✓ Audit trail & export</li>':''}
  </ul>
  <a class="cta" href="${p.direct_checkout?'https://www.bedrijfsgeheugen.nl/afsluiten?plan='+p.code:'https://www.bedrijfsgeheugen.nl/contact?onderwerp=enterprise'}">${p.direct_checkout?'Start '+esc(p.name):'Plan enterprise gesprek'} →</a>
 </article>`).join('');
}
function renderMatrix(){
 const rows=[
  ['Gebruikers',p=>p.users>=999?'Onbeperkt':'Tot '+p.users],
  ['Integraties',p=>p.data_sources>=999?'Onbeperkt':p.data_sources],
  ['Datarefresh',p=>p.refresh_minutes===0?'On-demand':p.refresh_minutes<60?'Elke '+p.refresh_minutes+' min':p.refresh_minutes===60?'Elk uur':'Dagelijks'],
  ['AI-vragen / maand',p=>p.ai_requests_month>=999999?'Fair use':p.ai_requests_month],
  ['Documenten',p=>p.documents>=999999?'Onbeperkt':p.documents.toLocaleString('nl-NL')],
  ['Automatiseringen',p=>p.automations>=999?'Op maat':p.automations||'—'],
  ['Goedkeuringen & workflows',p=>p.approval_workflows?'✓':'—'],
  ['SSO / eigen domein',p=>p.sso?'✓':'—'],
  ['Audit trail & export',p=>p.audit_trail?'✓':'—'],
  ['Menselijke review',p=>p.advisory_minutes_month?Math.round(p.advisory_minutes_month/60)+' uur / mnd':'—']
 ];
 return rows.map(([label,fn])=>`<tr><th>${label}</th>${catalog.saas.map(p=>`<td>${fn(p)}</td>`).join('')}</tr>`).join('');
}
function renderServices(){
 return catalog.services.map(s=>`<article class="service">
  <div class="icon small">◎</div><h3>${esc(s.name)}</h3>
  <div class="sprice">${s.price_cents===0?'€ 0':s.price_cents!=null?euro(s.price_cents):'Vanaf '+euro(s.price_cents_from)} <span>| ${esc(s.unit)}</span></div>
  <ul>${s.includes.map(x=>`<li>✓ ${esc(x)}</li>`).join('')}</ul>
  ${s.portal_access?`<p class="access">Incl. ${s.portal_days?s.portal_days+' dagen ':''}${esc(s.portal_access)}-toegang</p>`:''}
  <a class="cta dark" href="${s.code==='frisse-blik'?'https://www.bedrijfsgeheugen.nl/frisse-blik':'https://www.bedrijfsgeheugen.nl/contact?onderwerp='+encodeURIComponent(s.code)}">${s.code==='frisse-blik'?'Plan een Frisse Blik':'Bespreek '+esc(s.name)} →</a>
 </article>`).join('');
}
function page(){
 return `<section data-bg-commercial-pricing-v1 class="pricing-v1">
 <style>
 .pricing-v1{--navy:#0b2445;--yellow:#ffc400;--paper:#fbfcfe;--line:#dfe5ec;--muted:#5f6b7a;font:16px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;color:var(--navy);background:var(--paper)}
 .pricing-v1 *{box-sizing:border-box}.pricing-v1 .wrap{max-width:1180px;margin:auto;padding:0 22px}.hero{padding:70px 0 28px;background:linear-gradient(135deg,#fff 55%,#eef6ff)}
 .hero h1{font-size:clamp(2.2rem,5vw,4.6rem);line-height:.98;letter-spacing:-.045em;max-width:930px}.hero h1 em{color:var(--yellow);font-style:normal}.hero p{font-size:1.15rem;max-width:760px;color:#30415a}
 .choice{display:flex;gap:8px;margin:28px 0}.choice a{padding:13px 20px;border-radius:10px;text-decoration:none;font-weight:800}.choice .on{background:var(--navy);color:#fff}.choice .off{background:#fff;color:var(--navy);border:1px solid var(--line)}
 .sec{padding:48px 0}.sec h2{font-size:clamp(1.8rem,3vw,2.7rem);margin:0}.sub{color:var(--muted);margin:4px 0 24px}.plans{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.pcard,.service{position:relative;background:#fff;border:1px solid var(--line);border-radius:16px;padding:22px;box-shadow:0 8px 28px rgba(8,32,63,.06)}
 .featured{border:2px solid var(--yellow)}.badge{position:absolute;left:-1px;right:-1px;top:-28px;background:var(--yellow);text-align:center;font-weight:800;border-radius:10px 10px 0 0;padding:5px}.icon{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:#fff4c7;font-weight:900}.icon.small{width:36px;height:36px}.pcard h3,.service h3{font-size:1.3rem;margin:10px 0 2px}.aud,.pos{color:var(--muted)}.price{font-size:2rem;font-weight:900;margin:14px 0}.price span,.sprice span{font-size:.85rem;font-weight:500}.pcard ul,.service ul{list-style:none;padding:0;margin:16px 0}.pcard li,.service li{margin:7px 0}.cta{display:block;text-align:center;text-decoration:none;background:var(--yellow);color:#07192d;padding:12px 14px;border-radius:9px;font-weight:800;margin-top:18px}.cta.dark{background:var(--navy);color:#fff}
 .included{display:flex;gap:16px;flex-wrap:wrap;background:#eaf4ff;border-radius:12px;padding:14px 18px;margin-top:16px;font-size:.86rem;font-weight:700}
 .tablebox{overflow:auto;background:var(--navy);color:#fff;border-radius:16px;padding:18px}.tablebox table{width:100%;border-collapse:collapse;min-width:800px}.tablebox th,.tablebox td{padding:12px;border-bottom:1px solid rgba(255,255,255,.15);text-align:center}.tablebox th:first-child{text-align:left}.tablebox thead th:nth-child(3){background:#f2c94c;color:#10223d}
 .services{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}.sprice{font-weight:900;margin:10px 0}.access{font-size:.8rem;background:#eaf4ff;border-radius:8px;padding:7px 9px}
 .bundle{background:linear-gradient(135deg,#eaf4ff,#fff8dc);border-radius:18px;padding:26px}.flow{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:18px}.flow div{background:#fff;border:1px solid var(--line);border-radius:12px;padding:15px}.flow b{display:block}
 .finder{display:grid;grid-template-columns:repeat(3,1fr) auto;gap:10px;align-items:end}.finder label{font-weight:700;font-size:.82rem}.finder select{display:block;width:100%;padding:11px;border:1px solid var(--line);border-radius:8px;background:#fff}.finder a{white-space:nowrap}
 .closing{background:var(--navy);color:#fff;padding:28px 0}.closing .wrap{display:flex;justify-content:space-between;gap:20px;align-items:center}.closing h2{font-size:1.6rem}
 @media(max-width:1000px){.plans{grid-template-columns:repeat(2,1fr)}.services{grid-template-columns:repeat(2,1fr)}.flow{grid-template-columns:1fr 1fr}.finder{grid-template-columns:1fr 1fr}}
 @media(max-width:640px){.plans,.services,.flow,.finder{grid-template-columns:1fr}.hero{padding-top:42px}.choice{flex-direction:column}.closing .wrap{display:block}}
 </style>
 <div class="hero"><div class="wrap"><p><b>POWERHOUSE PRIJZEN</b></p><h1>Kies software of expertise.<br><em>Combineer wanneer het nodig is.</em></h1><p>Powerhouse is er als software (SaaS), als consulting & workshops, of allebei. Zo kies je wat past bij jouw organisatie, tempo en ambitie.</p><div class="choice"><a class="on" href="#saas">Powerhouse SaaS</a><a class="off" href="#expertise">Consulting & workshops</a></div></div></div>
 <div class="wrap">
 <section class="sec" id="saas"><h2>Powerhouse SaaS</h2><p class="sub">Eén platform. Vier niveaus. Altijd op- en downgradebaar.</p><div class="plans">${renderSaas()}</div><div class="included"><span>✓ Powerhouse Intelligence</span><span>✓ Powerhouse Agents</span><span>✓ Powerhouse Connect</span><span>✓ Rolgebaseerde acties</span><span>✓ NL / EN</span><span>✓ Security & privacy</span></div></section>
 <section class="sec"><h2>Wat groeit mee met je abonnement?</h2><p class="sub">De kern blijft gelijk; capaciteit, actualiteit, automatisering en governance groeien mee.</p><div class="tablebox"><table><thead><tr><th></th>${catalog.saas.map(p=>`<th>${esc(p.name)}</th>`).join('')}</tr></thead><tbody>${renderMatrix()}</tbody></table></div></section>
 <section class="sec" id="expertise"><h2>Liever eerst samen scherpstellen of versnellen?</h2><p class="sub">Onze workshops en trajecten helpen je om snel de juiste keuzes te maken en direct impact te realiseren.</p><div class="services">${renderServices()}</div></section>
 <section class="sec"><div class="bundle"><h2>Combineer zonder dubbel te betalen</h2><p>${esc(catalog.commercial_rules.credit_rule)} ${esc(catalog.commercial_rules.temporary_access_rule)}</p><div class="flow"><div><b>1. Workshop of scan</b>Breng kansen en prioriteiten in kaart.</div><div><b>2. Waarde wordt verrekend</b>De kosten tellen mee bij een aansluitende Build Sprint.</div><div><b>3. Tijdelijke portaltoegang</b>Tijdens de uitvoering krijg je Pro- of Groei-toegang.</div><div><b>4. Daarna door met SaaS</b>Na oplevering loopt je abonnement door als je dat kiest.</div></div></div></section>
 <section class="sec"><h2>Wat past bij mij?</h2><p class="sub">Gebruik drie keuzes om snel naar het logischste startpunt te gaan.</p><div class="finder"><label>1. Aantal medewerkers<select><option>3–15</option><option selected>15–100</option><option>60–150</option><option>150+</option></select></label><label>2. Belangrijkste doel<select><option>Inzicht</option><option selected>Automatiseren</option><option>Governance</option><option>Versnellen met experts</option></select></label><label>3. Hoe aanpakken?<select><option>Zelf met software</option><option selected>Samen met experts</option><option>Volledig begeleid</option></select></label><a class="cta" href="https://www.bedrijfsgeheugen.nl/contact?onderwerp=prijsadvies">Bekijk mijn pakket →</a></div></section>
 </div>
 <div class="closing"><div class="wrap"><h2>Begin klein. Bewijs waarde. Schaal alleen op als het werkt.</h2><div><a class="cta" href="https://www.bedrijfsgeheugen.nl/afsluiten?plan=starter">Start gratis gesprek →</a></div></div></div>
 </section>`;
}
function englishPage(){
  let html=page();
  const replacements=[
    ['POWERHOUSE PRIJZEN','POWERHOUSE PRICING'],
    ['Kies software of expertise.','Choose software or expertise.'],
    ['Combineer wanneer het nodig is.','Combine them when needed.'],
    ['Powerhouse is er als software (SaaS), als consulting & workshops, of allebei. Zo kies je wat past bij jouw organisatie, tempo en ambitie.','Powerhouse is available as software (SaaS), consulting & workshops, or both. Choose what fits your organisation, pace and ambition.'],
    ['Consulting & workshops','Consulting & workshops'],
    ['Eén platform. Vier niveaus. Altijd op- en downgradebaar.','One platform. Four levels. Upgrade or downgrade at any time.'],
    ['Meest gekozen','Most popular'],
    ['Voor ','For '],
    ['Op maat','Custom'],
    ['/ maand','/ month'],
    ['gebruikers','users'],
    ['onbeperkt','unlimited'],
    ['Onbeperkt','Unlimited'],
    ['integraties','integrations'],
    ['documenten','documents'],
    ['Elke 15 min','Every 15 min'],
    ['Elk uur','Every hour'],
    ['Dagelijks','Daily'],
    ['datarefresh','data refresh'],
    ['AI-vragen / maand','AI requests / month'],
    ['Automatiseringen op maat','Custom automations'],
    ['automatiseringen','automations'],
    ['Goedkeuringen & workflows','Approvals & workflows'],
    ['SSO / werkaccount','SSO / work account'],
    ['Plan enterprise gesprek','Schedule enterprise call'],
    ['Start Groei','Start Growth'],
    ['Groei','Growth'],
    ['Start met inzicht en de eerste acties.','Start with insight and your first actions.'],
    ['De complete basis voor groei, sturing en uitvoering.','The complete foundation for growth, steering and execution.'],
    ['Voor organisaties die willen automatiseren en opschalen.','For organisations that want to automate and scale.'],
    ['Volledig afgestemd op jouw organisatie en eisen.','Fully aligned with your organisation and requirements.'],
    ['60–150 of meerdere locaties','60–150 employees or multiple locations'],
    ['Grotere organisaties','Larger organisations'],
    ['Powerhouse Intelligence basis','Powerhouse Intelligence core'],
    ['Bedrijfsprofiel & benchmark','Company profile & benchmark'],
    ['Maandelijks veranderoverzicht','Monthly change overview'],
    ['Basis actielijst','Basic action list'],
    ['E-mail support','Email support'],
    ['Alles uit Starter','Everything in Starter'],
    ['Uurlijkse datarefresh','Hourly data refresh'],
    ['Goedkeuringen & eigenaren','Approvals & owners'],
    ["Uitvoerings-thema's",'Execution themes'],
    ['Due diligence & exit modules','Due diligence & exit modules'],
    ['Alles uit Pro','Everything in Pro'],
    ['Data refresh elke 15 minuten','Data refresh every 15 minutes'],
    ['AI in 6 automatiseringen','AI in 6 automations'],
    ['Dagelijkse management summary','Daily management summary'],
    ['Maandelijkse executive review','Monthly executive review'],
    ['Onbeperkt binnen afgesproken fair use','Unlimited within agreed fair use'],
    ['Onbeperkt integraties','Unlimited integrations'],
    ['Eigen domein & branding','Custom domain & branding'],
    ['Eigen AI key / model optioneel','Own AI key / model optional'],
    ['On-demand datarefresh','On-demand data refresh'],
    ['Security & governance review','Security & governance review'],
    ['Wat groeit mee met je abonnement?','What scales with your subscription?'],
    ['De kern blijft gelijk; capaciteit, actualiteit, automatisering en governance groeien mee.','The core stays the same; capacity, freshness, automation and governance scale with your plan.'],
    ['Gebruikers','Users'],
    ['Integraties','Integrations'],
    ['Datarefresh','Data refresh'],
    ['Documenten','Documents'],
    ['Automatiseringen','Automations'],
    ['SSO / eigen domein','SSO / custom domain'],
    ['Menselijke review','Human review'],
    ['uur / mnd','hour / month'],
    ['Liever eerst samen scherpstellen of versnellen?','Prefer to sharpen the plan or accelerate together first?'],
    ['Onze workshops en trajecten helpen je om snel de juiste keuzes te maken en direct impact te realiseren.','Our workshops and delivery engagements help you make the right choices quickly and create impact immediately.'],
    ['Frisse Blik','Fresh Perspective'],
    ['Directie & AI Workshop','Executive & AI Workshop'],
    ['Transformation / Fractional Lead','Transformation / Fractional Lead'],
    ['eenmalig','one-off'],
    ['Vanaf ','From '],
    ['30 minuten','30 minutes'],
    ['Korte kennismaking','Short introduction'],
    ['Jouw situatie en doelen','Your situation and goals'],
    ['Kansen en quick wins','Opportunities and quick wins'],
    ['Advies over volgende stap','Advice on the next step'],
    ['Voorbereiding & analyse','Preparation & analysis'],
    ['3 uur workshop met MT/directie','3-hour workshop with leadership'],
    ['Kansenkaart en top 5 prioriteiten','Opportunity map and top 5 priorities'],
    ['30 dagen actieplan','30-day action plan'],
    ['Benchmark met jouw sector','Benchmark against your sector'],
    ['Analyse processen, data en AI','Analysis of processes, data and AI'],
    ['Businesscase en prioriteiten','Business case and priorities'],
    ['90 dagen roadmap','90-day roadmap'],
    ['Beslismemo voor directie','Decision memo for leadership'],
    ['Proces, data, AI en dashboards','Process, data, AI and dashboards'],
    ['Integraties met jouw systemen','Integrations with your systems'],
    ['Testen en adoptie','Testing and adoption'],
    ['Oplevering en overdracht','Delivery and handover'],
    ['Senior begeleiding op directieniveau','Senior guidance at leadership level'],
    ['Sturingsritme en roadmap','Operating cadence and roadmap'],
    ['Governance en risicobeheersing','Governance and risk management'],
    ['Coördinatie leveranciers en teams','Coordination of vendors and teams'],
    ['Monitoring van resultaten','Monitoring outcomes'],
    ['dagen ',' days '],
    ['-toegang',' access'],
    ['Plan een Fresh Perspective','Schedule a Fresh Perspective'],
    ['Plan een Frisse Blik','Schedule a Fresh Perspective'],
    ['Bespreek ','Discuss '],
    ['Combineer zonder dubbel te betalen','Combine without paying twice'],
    ['De betaalde waarde van een Executive & AI Workshop of Bedrijfsgeheugen Scan wordt verrekend met een aansluitende Build Sprint wanneer die binnen 30 dagen start.','The paid value of an Executive & AI Workshop or Bedrijfsgeheugen Scan is credited toward a Build Sprint that starts within 30 days.'],
    ['De betaalde waarde van een Directie & AI Workshop of Bedrijfsgeheugen Scan wordt verrekend met een aansluitende Build Sprint wanneer die binnen 30 dagen start.','The paid value of an Executive & AI Workshop or Bedrijfsgeheugen Scan is credited toward a Build Sprint that starts within 30 days.'],
    ['Workshop- en scantrajecten krijgen tijdelijke portaltoegang op het aangegeven niveau.','Workshop and scan engagements include temporary portal access at the stated plan level.'],
    ['1. Workshop of scan','1. Workshop or scan'],
    ['Breng kansen en prioriteiten in kaart.','Map opportunities and priorities.'],
    ['2. Waarde wordt verrekend','2. Value is credited'],
    ['De kosten tellen mee bij een aansluitende Build Sprint.','The cost is credited toward a follow-on Build Sprint.'],
    ['3. Tijdelijke portaltoegang','3. Temporary portal access'],
    ['Tijdens de uitvoering krijg je Pro- of Growth-toegang.','During delivery you receive Pro or Growth access.'],
    ['Tijdens de uitvoering krijg je Pro- of Groei-toegang.','During delivery you receive Pro or Growth access.'],
    ['4. Daarna door met SaaS','4. Continue with SaaS'],
    ['Na oplevering loopt je abonnement door als je dat kiest.','After delivery your subscription continues if you choose.'],
    ['Wat past bij mij?','What fits me?'],
    ['Gebruik drie keuzes om snel naar het logischste startpunt te gaan.','Use three choices to find the most logical starting point.'],
    ['1. Aantal medewerkers','1. Number of employees'],
    ['2. Belangrijkste doel','2. Main goal'],
    ['3. Hoe aanpakken?','3. How do you want to proceed?'],
    ['Inzicht','Insight'],
    ['Automatiseren','Automate'],
    ['Versnellen met experts','Accelerate with experts'],
    ['Zelf met software','Self-service software'],
    ['Samen met experts','Together with experts'],
    ['Volledig begeleid','Fully guided'],
    ['Bekijk mijn pakket','See my package'],
    ['Begin klein. Bewijs waarde. Schaal alleen op als het werkt.','Start small. Prove value. Scale only when it works.'],
    ['Start gratis gesprek','Start a free conversation'],
    ['Rolgebaseerde acties','Role-based actions'],
    ['Tot ','Up to '],
    ['Voor organisaties die willen automatiseren en opschalen.','For organisations that want to automate and scale.'],
    ['Grotere organisaties','Larger organisations'],
    ['AI-vragen','AI requests'],
    ['uur / mnd','hour / month'],
    ['4 uur / mnd','4 hours / month'],
    ['1 uur / mnd','1 hour / month'],
    ['30 dagen pro-toegang','30 days Pro access'],
    ['30 dagen groei-toegang','30 days Growth access'],
    ['60 dagen pro-toegang','60 days Pro access']
  ];
  for(const [from,to] of replacements) html=html.split(from).join(to);
  const residuals=[
    ['Directie & AI Workshop','Executive & AI Workshop'],
    ['Voorbereiding & analyse','Preparation & analysis'],
    ['Bedrijfsgeheugen Scan','Bedrijfsgeheugen Scan'],
    ['Integraties met jouw systemen','Integrations with your systems'],
    ['De betaalde waarde van een Executive & AI Workshop of Bedrijfsgeheugen Scan wordt verrekend met een aansluitende Build Sprint wanneer die binnen 30 days start.','The paid value of an Executive & AI Workshop or Bedrijfsgeheugen Scan is credited toward a Build Sprint that starts within 30 days.'],
    ['De betaalde waarde van een Directie & AI Workshop of Bedrijfsgeheugen Scan wordt verrekend met een aansluitende Build Sprint wanneer die binnen 30 days start.','The paid value of an Executive & AI Workshop or Bedrijfsgeheugen Scan is credited toward a Build Sprint that starts within 30 days.'],
    ['Tijdens de uitvoering krijg je Pro- of Growth access.','During delivery you receive Pro or Growth access.'],
    ['Tijdens de uitvoering krijg je Pro- of Groei-toegang.','During delivery you receive Pro or Growth access.'],
    ['maand','month'],
    ['pro access','Pro access'],
    ['groei access','Growth access'],
    ['pro-toegang','Pro access'],
    ['groei-toegang','Growth access']
  ];
  for(const [from,to] of residuals) html=html.split(from).join(to);
  html=html
    .replaceAll('https://www.bedrijfsgeheugen.nl/afsluiten','https://www.bedrijfsgeheugen.nl/en/afsluiten')
    .replaceAll('https://www.bedrijfsgeheugen.nl/contact','https://www.bedrijfsgeheugen.nl/en/contact')
    .replaceAll('https://www.bedrijfsgeheugen.nl/frisse-blik','https://www.bedrijfsgeheugen.nl/en/frisse-blik');
  return html;
}

async function apply(path,locale='nl'){
 try{await access(path)}catch{return}
 let html=await readFile(path,'utf8');
 const start=html.search(/<main\b[^>]*>/i), end=html.search(/<\/main>/i);
 if(start<0||end<0)throw new Error('Pricing page missing main: '+path);
 const openEnd=html.indexOf('>',start)+1;
 html=html.slice(0,openEnd)+'\n'+(locale==='en'?englishPage():page())+'\n'+html.slice(end);
 await writeFile(path,html,'utf8');
 console.log('commercial pricing applied',path);
}
await apply('prijzen.html','nl');
await apply('en/prijzen.html','en');
