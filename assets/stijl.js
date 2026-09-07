/* Bedrijfsgeheugen — gedeelde interactie */

(function(){
  var KEY='bg_consent';
  function applyConsent(state){try{if(typeof gtag==='function')gtag('consent','update',{analytics_storage:(state==='granted'?'granted':'denied'),ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});}catch(e){}}
  function el(){return document.getElementById('bgCookie');}
  function show(){var b=el();if(b)b.classList.add('bgShow');}
  function hide(){var b=el();if(b)b.classList.remove('bgShow');}
  function choose(state){try{localStorage.setItem(KEY,state);localStorage.setItem(KEY+'_ts',new Date().toISOString());}catch(e){}applyConsent(state);hide();}
  window.bgOpenCookies=function(){show();};
  document.addEventListener('DOMContentLoaded',function(){
    var a=document.getElementById('bgCookieAccept'),d=document.getElementById('bgCookieDeny');
    if(a)a.addEventListener('click',function(){choose('granted');});
    if(d)d.addEventListener('click',function(){choose('denied');});
    var stored=null;try{stored=localStorage.getItem(KEY);}catch(e){}
    if(stored!=='granted'&&stored!=='denied'){show();}
  });
})();

/* Money-page conversion contract — organic-money-page-intent-to-order-coverage-v1 */
(function(){
  var CONTRACT='organic-money-page-intent-to-order-coverage-v1';
  var pages={
    '/systemen-koppelen':{intent:'systemen koppelen',price:'€ 3.500–€ 6.000 voor één richting; complexer tot circa € 12.000',time:'Meestal 2–4 weken',proof:'Praktijkvoorbeeld op deze pagina: aanvragen automatisch naar AFAS, zonder overtypen.',objection:'Je bestaande pakketten blijven staan; we koppelen eromheen.',ownership:'De koppeling, toegang en documentatie blijven van jou.',primary:'App de twee pakketten',href:'https://wa.me/31627483345?text=Hoi%20Arthur%2C%20ik%20wil%20twee%20systemen%20koppelen%3A%20',secondary:'Bekijk de prijzen',secondaryHref:'/prijzen'},
    '/afas-koppeling':{intent:'AFAS koppeling laten maken',price:'€ 3.500–€ 6.000 voor één richting; met uitzonderingen tot circa € 12.000',time:'Meestal 2–6 weken',proof:'Bouwen op echte procesdata, eerst testen en pas live als beide routes kloppen.',objection:'AFAS hoeft niet vervangen te worden en je zit niet aan ons vast.',ownership:'Code, toegang, documentatie en uitleg gaan mee naar je eigen team.',primary:'Bespreek mijn AFAS-koppeling',href:'/#contact',secondary:'Doe eerst de zelfscan',secondaryHref:'/zelfscan'},
    '/exact-online-koppeling':{intent:'Exact Online koppeling laten maken',price:'Meestal € 1.500–€ 5.000 voor een eenvoudige koppeling',time:'Meestal binnen 2 weken werkend',proof:'De nieuwe koppeling draait eerst naast de oude werkwijze voordat je overstapt.',objection:'Je hoeft Exact Online niet te vervangen.',ownership:'Inloggegevens en documentatie worden overgedragen; geen lock-in.',primary:'Bespreek mijn Exact-koppeling',href:'/#contact',secondary:'Bekijk alle koppelingen',secondaryHref:'/systemen-koppelen'},
    '/twinfield-koppeling':{intent:'Twinfield koppeling laten maken',price:'Vaste prijs vooraf op basis van richting, velden en uitzonderingen',time:'Doorlooptijd vooraf afgesproken',proof:'De koppeling wordt getest op de echte uitzonderingen voordat de oude werkwijze verdwijnt.',objection:'Twinfield blijft je financiële kern; alleen het handwerk ertussen verdwijnt.',ownership:'Toegang en documentatie blijven bij jouw organisatie.',primary:'Bespreek mijn Twinfield-koppeling',href:'/#contact',secondary:'Bekijk alle koppelingen',secondaryHref:'/systemen-koppelen'},
    '/webshop-koppeling':{intent:'webshop koppelen aan boekhouding',price:'Meestal € 2.000–€ 6.000',time:'Vaste prijs en scope vooraf',proof:'Geschikt voor onder meer Shopify, WooCommerce, Magento en Lightspeed naar boekhouding.',objection:'Een latere webshopvernieuwing hoeft de boekhoudkant niet opnieuw te bouwen.',ownership:'De koppeling wordt los en overdraagbaar ingericht.',primary:'Bespreek mijn webshop-koppeling',href:'/#contact',secondary:'Bekijk alle koppelingen',secondaryHref:'/systemen-koppelen'},
    '/frisse-blik':{intent:'bedrijfsscan / Frisse blik',price:'€ 2.900 excl. btw voor de bedrijfsscan',time:'Eén dag meekijken, rapport binnen een week',proof:'Je krijgt concrete bevindingen, prioriteiten en een rapport waar je zelf mee verder kunt.',objection:'Geen verplicht vervolgtraject na de scan.',ownership:'De uitkomsten en het rapport zijn van jouw organisatie.',primary:'Plan mijn Frisse blik',href:'/#contact',secondary:'Doe eerst de zelfscan',secondaryHref:'/zelfscan'},
    '/ai-scan':{intent:'AI-scan voor het mkb',price:'Prijs en scope vooraf duidelijk — geen open AI-traject',time:'Eerst bepalen waar AI aantoonbaar iets oplevert',proof:'De scan begint bij processen, data en risico’s in plaats van bij een tool.',objection:'Geen AI om de AI; niet zinvolle toepassingen vallen af.',ownership:'Je houdt controle over data, keuzes en vervolgstappen.',primary:'Bespreek mijn AI-scan',href:'/#contact',secondary:'Bekijk AI & governance',secondaryHref:'/ai-adoptie'},
    '/ai-adoptie':{intent:'AI adoptie en governance',price:'Vaste scope en prijs per concrete verbetering',time:'Klein beginnen, testen en pas daarna verbreden',proof:'Afspraken, rollen en controle worden onderdeel van de implementatie — niet een document ernaast.',objection:'Geen big-bang programma en geen afhankelijkheid van één AI-leverancier.',ownership:'Data, beleid en werkwijze blijven bestuurbaar door je eigen organisatie.',primary:'Bespreek onze AI-aanpak',href:'/#contact',secondary:'Doe de AI-scan',secondaryHref:'/ai-scan'},
    '/due-diligence':{intent:'due diligence en bedrijfsoverdracht',price:'Scope en vaste prijs vooraf op basis van de onderzoeksvraag',time:'Onderzoek gericht op beslisinformatie, niet op een lang adviestraject',proof:'Kennis, systemen, afhankelijkheden en continuïteitsrisico’s worden expliciet zichtbaar gemaakt.',objection:'We toetsen wat aantoonbaar is en maken onzekerheden zichtbaar in plaats van ze weg te schrijven.',ownership:'Onderzoeksresultaten en onderbouwing blijven bij opdrachtgever en onderneming.',primary:'Bespreek de due-diligence vraag',href:'/#contact',secondary:'Bekijk voor investeerders & M&A',secondaryHref:'/investeerders-ma'},
    '/bedrijfsprocessen-automatiseren':{intent:'bedrijfsprocessen automatiseren',price:'Eerst businesscase en kleinste rendabele verbetering; daarna vaste prijs',time:'Eén proces tegelijk zodat resultaat zichtbaar blijft',proof:'De pagina rekent handwerk en terugverdientijd terug naar concrete processtappen.',objection:'Je hoeft niet eerst je hele IT-landschap te vervangen.',ownership:'Automatisering wordt overdraagbaar ingericht en blijft uitlegbaar voor je team.',primary:'Laat mijn proces doorrekenen',href:'/#contact',secondary:'Bekijk systemen koppelen',secondaryHref:'/systemen-koppelen'},
    '/prijzen':{intent:'prijzen en pakketkeuze',price:'Alle bedragen, ranges en wat inbegrepen is op één plek',time:'Je ziet vóór een gesprek welk prijsniveau bij de vraag hoort',proof:'Prijs wordt gekoppeld aan concrete deliverables en niet aan een open urenpot.',objection:'Geen verrassingen door een onbegrensd uurtje-factuurtje model.',ownership:'Je ziet wat je koopt, wat van jou blijft en welke vervolgstap optioneel is.',primary:'Kies mijn beste startpunt',href:'/frisse-blik',secondary:'Bespreek mijn situatie',secondaryHref:'/#contact'}
  };

  function normPath(){var p=location.pathname.replace(/\.html$/,'').replace(/\/$/,'')||'/';return p;}
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
  function event(name,meta){
    try{if(typeof window.bgEvent==='function')window.bgEvent(name);}catch(e){}
    try{if(typeof gtag==='function')gtag('event',name,{money_page:meta.intent,contract:CONTRACT,page_path:location.pathname});}catch(e){}
    try{window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:name,bg_money_page:meta.intent,bg_contract:CONTRACT,bg_path:location.pathname});}catch(e){}
  }
  function style(){
    if(document.getElementById('bgMoneyStyle'))return;
    var s=document.createElement('style');s.id='bgMoneyStyle';s.textContent=
      '.bg-money-hero,.bg-money-decision{font-family:Instrument Sans,system-ui,sans-serif;box-sizing:border-box}.bg-money-hero *,.bg-money-decision *{box-sizing:border-box}.bg-money-hero{margin:1.25rem 0 2rem;padding:1rem;border:1px solid #DCDFE6;border-radius:14px;background:#fff;display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) auto;gap:.8rem;align-items:stretch}.bg-money-fact{padding:.7rem .8rem;border-right:1px solid #ECEEF2}.bg-money-fact:last-of-type{border-right:0}.bg-money-label{display:block;font:600 .65rem/1.2 IBM Plex Mono,monospace;letter-spacing:.08em;text-transform:uppercase;color:#5C646E;margin-bottom:.28rem}.bg-money-value{font-weight:700;font-size:.92rem;line-height:1.4;color:#14171A}.bg-money-actions{display:flex;flex-direction:column;justify-content:center;gap:.45rem;min-width:180px}.bg-money-btn{display:inline-flex;align-items:center;justify-content:center;text-align:center;border-radius:9px;padding:.72rem .9rem;font-weight:700;text-decoration:none!important;background:#2742D6;color:#fff!important;border:2px solid #2742D6;font-size:.88rem}.bg-money-btn.alt{background:#fff;color:#2742D6!important}.bg-money-decision{margin:2.5rem 0 1rem;border-radius:18px;background:#14171A;color:#fff;padding:1.6rem}.bg-money-decision h2{color:#fff;margin:0 0 .5rem;font-size:clamp(1.4rem,3vw,2rem)}.bg-money-decision>p{color:#D9DCE3;margin:0 0 1.2rem;max-width:54rem}.bg-money-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem;margin:1rem 0 1.2rem}.bg-money-card{border:1px solid rgba(255,255,255,.16);border-radius:12px;padding:.9rem;background:rgba(255,255,255,.06)}.bg-money-card b{display:block;margin-bottom:.25rem}.bg-money-card span{display:block;color:#D9DCE3;font-size:.9rem;line-height:1.5}.bg-money-decision .bg-money-actions{flex-direction:row;justify-content:flex-start;flex-wrap:wrap}.bg-money-decision .bg-money-btn.alt{border-color:#fff;color:#fff!important;background:transparent}.bg-money-note{display:block;margin-top:.8rem;color:#AEB4BF;font-size:.78rem}@media(max-width:860px){.bg-money-hero{grid-template-columns:1fr 1fr}.bg-money-fact{border-right:0;border-bottom:1px solid #ECEEF2}.bg-money-actions{grid-column:1/-1;flex-direction:row;min-width:0}}@media(max-width:560px){.bg-money-hero,.bg-money-grid{grid-template-columns:1fr}.bg-money-actions,.bg-money-decision .bg-money-actions{flex-direction:column}.bg-money-btn{width:100%}}';
    document.head.appendChild(s);
  }
  function button(cls,label,href,kind,meta){var a=document.createElement('a');a.className='bg-money-btn'+(cls?' '+cls:'');a.href=href;a.textContent=label;a.setAttribute('data-bg-cta',kind);a.addEventListener('click',function(){event(kind==='primary'?'money_page_primary_cta':'money_page_secondary_cta',meta);});return a;}
  function trackExistingCta(a,kind,meta){
    if(!a)return;
    a.setAttribute('data-bg-cta',kind);
    if(a.getAttribute('data-bg-money-bound')==='1')return;
    a.setAttribute('data-bg-money-bound','1');
    a.addEventListener('click',function(){event(kind==='primary'?'money_page_primary_cta':'money_page_secondary_cta',meta);});
  }
  function hydrateExistingHero(meta,main){
    var existing=main.querySelector('.p-hero');if(!existing)return false;
    existing.setAttribute('data-bg-money-contract',CONTRACT);
    existing.setAttribute('data-bg-money-intent',meta.intent);
    var ctas=existing.querySelectorAll('.p-cta a');
    trackExistingCta(ctas[0],'primary',meta);
    trackExistingCta(ctas[1],'secondary',meta);
    return true;
  }
  function hero(meta,main){
    if(document.querySelector('.bg-money-hero'))return;
    var h1=main.querySelector('h1');if(!h1)return;
    var anchor=h1.nextElementSibling;
    var box=document.createElement('section');box.className='bg-money-hero';box.setAttribute('data-bg-money-contract',CONTRACT);box.setAttribute('aria-label','Koopbeslissing in het kort');
    box.innerHTML='<div class="bg-money-fact"><span class="bg-money-label">Prijs</span><span class="bg-money-value">'+esc(meta.price)+'</span></div><div class="bg-money-fact"><span class="bg-money-label">Doorlooptijd</span><span class="bg-money-value">'+esc(meta.time)+'</span></div><div class="bg-money-fact"><span class="bg-money-label">Risico omlaag</span><span class="bg-money-value">'+esc(meta.ownership)+'</span></div><div class="bg-money-actions"></div>';
    var acts=box.querySelector('.bg-money-actions');acts.appendChild(button('',meta.primary,meta.href,'primary',meta));acts.appendChild(button('alt',meta.secondary,meta.secondaryHref,'secondary',meta));
    if(anchor)anchor.insertAdjacentElement('afterend',box);else h1.insertAdjacentElement('afterend',box);
  }
  function decision(meta,main){
    if(document.querySelector('.bg-money-decision'))return;
    var box=document.createElement('section');box.className='bg-money-decision';box.setAttribute('data-bg-money-contract',CONTRACT);
    box.innerHTML='<span class="bg-money-label" style="color:#AEB4BF">Besliskader</span><h2>Kun je hiermee een besluit nemen?</h2><p>Deze pagina moet niet eindigen bij informatie. Dit zijn de vier punten die vóór een opdracht helder moeten zijn.</p><div class="bg-money-grid"><div class="bg-money-card"><b>Bewijs</b><span>'+esc(meta.proof)+'</span></div><div class="bg-money-card"><b>Belangrijkste bezwaar</b><span>'+esc(meta.objection)+'</span></div><div class="bg-money-card"><b>Prijs & scope</b><span>'+esc(meta.price)+'</span></div><div class="bg-money-card"><b>Eigendom & afhankelijkheid</b><span>'+esc(meta.ownership)+'</span></div></div><div class="bg-money-actions"></div><span class="bg-money-note">Geen automatische verplichting na een gesprek. Eerst moet helder zijn wat het probleem, resultaat, bewijs en de vaste volgende stap zijn.</span>';
    var acts=box.querySelector('.bg-money-actions');acts.appendChild(button('',meta.primary,meta.href,'primary',meta));acts.appendChild(button('alt',meta.secondary,meta.secondaryHref,'secondary',meta));
    main.appendChild(box);
  }
  function initMoneyPage(){
    var path=normPath();
    var meta=pages[path];if(!meta)return;
    var main=document.querySelector('main');if(!main)return;
    style();
    if(path==='/due-diligence')hydrateExistingHero(meta,main);else hero(meta,main);
    decision(meta,main);event('money_page_view',meta);
  }
  if(document.readyState==='loading'&&!document.querySelector('main')){
    document.addEventListener('DOMContentLoaded',initMoneyPage,{once:true});
  }else{
    initMoneyPage();
  }
})();