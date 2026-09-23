import { chromium } from 'playwright';

const baseUrl=String(process.env.UI_VR_BASE_URL||'').replace(/\/$/,'');
if(!baseUrl) throw new Error('UI_VR_BASE_URL ontbreekt');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const pageErrors=[];
const failedRequests=[];
page.on('pageerror',error=>pageErrors.push(String(error?.stack||error)));
page.on('requestfailed',request=>failedRequests.push({url:request.url(),failure:request.failure()?.errorText||'unknown'}));

try{
  await page.goto(baseUrl+'/prijzen',{waitUntil:'networkidle',timeout:90000});
  await page.waitForFunction(()=>document.documentElement.dataset.bgPricingInteractions==='ready-v2',{timeout:30000});

  const runtimeProbe=await page.evaluate(async()=>{
    const script=[...document.scripts].find(s=>s.src.includes('pricing-interactions-rescue-v1.js'));
    let fetchStatus=null,contentType=null,head=null;
    if(script){
      try{
        const response=await fetch(script.src,{cache:'no-store'});
        fetchStatus=response.status;
        contentType=response.headers.get('content-type');
        head=(await response.text()).slice(0,180);
      }catch(error){ head='FETCH_ERROR:'+String(error); }
    }
    return {
      scriptSrc:script?.src||null,
      fetchStatus,
      contentType,
      head,
      yearly:document.querySelector('[data-bg-billing="yearly"]')?.getAttribute('aria-pressed')||null,
      scripts:[...document.scripts].map(s=>s.src||'[inline]').filter(Boolean)
    };
  });
  console.log('PRICING_RUNTIME_PROBE',JSON.stringify({runtimeProbe,pageErrors,failedRequests}));

  await page.locator('[data-bg-billing="yearly"]').tap();
  try{
    await page.waitForFunction(()=>document.querySelector('[data-bg-billing="yearly"]')?.getAttribute('aria-pressed')==='true',{timeout:8000});
  }catch(error){
    const state=await page.evaluate(()=>({
      yearly:document.querySelector('[data-bg-billing="yearly"]')?.getAttribute('aria-pressed')||null,
      monthly:document.querySelector('[data-bg-billing="monthly"]')?.getAttribute('aria-pressed')||null,
      scriptSrc:[...document.scripts].find(s=>s.src.includes('pricing-interactions-rescue-v1.js'))?.src||null
    }));
    throw new Error('Jaarlijks reageert niet: '+JSON.stringify({state,runtimeProbe,pageErrors,failedRequests,cause:String(error)}));
  }
  const yearly=await page.locator('.bg-billing-price[data-yearly="€ 14.950"]').first().textContent();
  if(!String(yearly||'').includes('14.950')) throw new Error('Jaarlijks wijzigt prijs niet');

  await page.locator('[data-bg-price-tab="run"]').tap();
  await page.waitForFunction(()=>document.querySelector('[data-bg-price-tab="run"]')?.getAttribute('aria-selected')==='true');
  const runState=await page.evaluate(()=>({
    start:[...document.querySelectorAll('.bg-plan-card[data-bg-group="start"]')].every(x=>x.hidden),
    run:[...document.querySelectorAll('.bg-plan-card[data-bg-group="run"]')].every(x=>!x.hidden)
  }));
  if(!runState.start||!runState.run) throw new Error('Continu sturen wisselt kaarten niet: '+JSON.stringify(runState));

  await page.locator('[data-bg-stage="loss"]').tap();
  await page.waitForFunction(()=>document.querySelector('[data-bg-stage="loss"]')?.getAttribute('aria-selected')==='true');
  const stageState=await page.evaluate(()=>({
    loss:!document.querySelector('[data-bg-stage-panel="loss"]')?.hidden,
    grow:document.querySelector('[data-bg-stage-panel="grow"]')?.hidden
  }));
  if(!stageState.loss||!stageState.grow) throw new Error('Lifecycle-tab wisselt panel niet: '+JSON.stringify(stageState));

  async function firstVisible(selectors){
    for(const selector of selectors){
      const loc=page.locator(selector);
      const count=await loc.count();
      for(let i=0;i<count;i++){
        const item=loc.nth(i);
        if(await item.isVisible().catch(()=>false)) return item;
      }
    }
    return null;
  }

  let englishButton=await firstVisible(['[data-bg-language-option="en"]']);
  let languageSelect=await firstVisible(['[data-bg-language-select]']);

  if(!englishButton&&!languageSelect){
    const menuButton=await firstVisible([
      'button[aria-controls="bgSharedMobileNav"]',
      'button[aria-controls="bgkopMob"]',
      'button[aria-label*="menu" i]',
      'button:has-text("Menu")'
    ]);
    if(!menuButton) throw new Error('Geen zichtbare mobiele Menu-knop gevonden voor taalwissel');
    await menuButton.tap();
    await page.waitForTimeout(250);
    englishButton=await firstVisible(['[data-bg-language-option="en"]']);
    languageSelect=await firstVisible(['[data-bg-language-select]']);
  }

  const i18nApiProbe=await page.evaluate(async()=>{
    try{
      const response=await fetch('/api/i18n-translate',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({target:'en',source:'nl',context:'public',strings:['Prijzen']})
      });
      return {status:response.status,contentType:response.headers.get('content-type'),body:(await response.text()).slice(0,1200)};
    }catch(error){
      return {status:null,body:'FETCH_ERROR:'+String(error)};
    }
  });
  console.log('I18N_API_PROBE',JSON.stringify(i18nApiProbe));
  if(i18nApiProbe.status!==200) throw new Error('i18n API is niet beschikbaar: '+JSON.stringify(i18nApiProbe));

  const languageProbe=await page.evaluate(()=>({
    path:location.pathname,
    options:[...document.querySelectorAll('[data-bg-language-option="en"]')].map(el=>{
      const cs=getComputedStyle(el),r=el.getBoundingClientRect();
      return {text:el.textContent,display:cs.display,visibility:cs.visibility,width:r.width,height:r.height};
    }),
    selects:[...document.querySelectorAll('[data-bg-language-select]')].map(el=>{
      const cs=getComputedStyle(el),r=el.getBoundingClientRect();
      return {value:el.value,display:cs.display,visibility:cs.visibility,width:r.width,height:r.height};
    })
  }));
  console.log('MOBILE_LANGUAGE_PROBE',JSON.stringify(languageProbe));

  if(englishButton) await englishButton.tap();
  else if(languageSelect) await languageSelect.selectOption('en');
  else throw new Error('Geen zichtbare English taalbediening gevonden');
  await page.waitForFunction(()=>location.pathname.replace(/\/$/,'')==='/en/prijzen',{timeout:30000});
  await page.waitForFunction(()=>document.documentElement.lang==='en',{timeout:30000});
  await page.waitForFunction(()=>/Pricing|Prices|Solutions|Discover|Language/.test(document.body.innerText||''),{timeout:90000});
  const locale=await page.evaluate(()=>({
    lang:document.documentElement.lang,
    path:location.pathname,
    text:(document.body.innerText||'').slice(0,5000),
    error:[...document.querySelectorAll('[data-bg-language-error]')].some(el=>!el.hidden)
  }));
  if(locale.lang!=='en') throw new Error('Engelse route heeft geen lang=en: '+JSON.stringify(locale));
  if(!/Pricing|Prices|Solutions|Discover|Language/.test(locale.text)) throw new Error('Engelse route toont geen Engelse UI-copy: '+JSON.stringify(locale));
  if(locale.error) throw new Error('Taalwissel toont nog een foutmelding op de Engelse route: '+JSON.stringify(locale));

  console.log('Pricing mobile taps + English route browser check: groen');
} finally {
  await browser.close();
}
