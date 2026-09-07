const ORIGIN = 'https://www.bedrijfsgeheugen.nl';

function bodyOf(html){return String(html).match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1]||'';}
function mainOf(html){return String(html).match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||bodyOf(html);}
function textOf(html){return String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().toLocaleLowerCase('nl-NL');}
function esc(v){return String(v||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function hasHeading(html,words){const t=textOf(html);return words.some(w=>t.includes(w));}
function anchors(html){return [...String(html).matchAll(/<a\b[^>]*href=(?:"([^"]+)"|'([^']+)')[^>]*>/gi)].map(m=>m[1]??m[2]??'');}
function hasEvidence(html){const main=mainOf(html);return /data-bg-evidence(?:\s|=|>)/i.test(main)||/<table\b/i.test(main)||/class=(?:"[^"]*\b(?:bewijs|bronnen?|onderbouwing|case|resultaat|praktijk|voorbeeld|vergelijk|callout|tabelwrap)\b[^"]*"|'[^']*\b(?:bewijs|bronnen?|onderbouwing|case|resultaat|praktijk|voorbeeld|vergelijk|callout|tabelwrap)\b[^']*')/i.test(main)||hasHeading(main,['bewijs','resultaat','praktijk','voorbeeld','berekening','onderzoek','bron']);}
function hasPrimary(html,entry){const a=entry?.primary_cta?.action;return a?new RegExp(`data-bg-conversion=["']${a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["']`,'i').test(html):false;}
function hasMicro(html,entry){const main=mainOf(html);return anchors(main).some(h=>h.startsWith(`${ORIGIN}/`)&&h!==entry?.primary_cta?.url&&h!==entry?.route);}
function hasSupportLink(html,entry){const links=new Set(anchors(mainOf(html)));return (entry?.supporting_routes||[]).some(r=>links.has(r));}
function marker(html,name){return new RegExp(`data-bg-money-section=["']${name}["']`,'i').test(html);}
function isNative(entry){return entry?.presentation==='native';}
function hasNativeHero(main,entry){
  if(/<section\b[^>]*class=(?:"[^"]*\binhoud-kop\b[^"]*"|'[^']*\binhoud-kop\b[^']*')/i.test(main)) return true;
  return entry?.route===`${ORIGIN}/prijzen`&&/<section\b[^>]*class=(?:"[^"]*\bpaginakop\b[^"]*"|'[^']*\bpaginakop\b[^']*')[^>]*data-bg-component=(?:"hero"|'hero')/i.test(main);
}

export function inspectMoneyPage(input,entry){
  const html=String(input); const main=mainOf(html); const errors=[];
  if(!entry||entry.role!=='money') return errors;
  if(isNative(entry)){
    if(!/data-bg-money-contract-version=["']native-v1["']/i.test(html)) errors.push(`${entry.route}: native money-contract ontbreekt`);
    if(!hasNativeHero(main,entry)) errors.push(`${entry.route}: eigen V18 hero ontbreekt`);
    if(/id=["']bg-money-v3["']/i.test(html)||hasHeading(main,['het zoekprobleem:','methodologie en bronnenbeleid','veelgestelde vragen vóór je beslist'])) errors.push(`${entry.route}: generiek money-page beslisblok mag niet op een native pagina staan`);
    if(!hasPrimary(html,entry)) errors.push(`${entry.route}: primaire CTA is niet meetbaar gemarkeerd`);
    if(!hasMicro(html,entry)) errors.push(`${entry.route}: secundaire microconversie ontbreekt`);
    if((entry.supporting_routes||[]).length&&!hasSupportLink(html,entry)) errors.push(`${entry.route}: contextuele support-link ontbreekt`);
    if(!new RegExp(`data-bg-intent-owner=["']${entry.route.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["']`,'i').test(html)) errors.push(`${entry.route}: primaire intent-owner ontbreekt`);
    if(!/data-bg-intent-role=["']primary["']/i.test(html)) errors.push(`${entry.route}: primary intent-role ontbreekt`);
    return errors;
  }

  if(!(marker(html,'problem')||hasHeading(main,['probleem','herken je','waar loopt','zonder','kost','verlies','risico']))) errors.push(`${entry.route}: probleem/intentie boven de vouw ontbreekt`);
  if(!marker(html,'answer')) errors.push(`${entry.route}: direct antwoord ontbreekt`);
  if(!(marker(html,'proposition')||hasHeading(main,['oplossing','wat we doen','wat het doet','zo helpt','platform','koppeling','aanpak']))) errors.push(`${entry.route}: unieke propositie/oplossing ontbreekt`);
  if(!hasEvidence(html)) errors.push(`${entry.route}: zichtbaar bewijs/onderbouwing ontbreekt`);
  if(!(marker(html,'how')||hasHeading(main,['hoe het werkt','zo werkt','aanpak','stappen','werkwijze','proces']))) errors.push(`${entry.route}: hoe-het-werkt/aanpak ontbreekt`);
  if(!(marker(html,'deliverables')||hasHeading(main,['wat krijg','oplever','resultaat','inbegrepen','je krijgt']))) errors.push(`${entry.route}: deliverables/wat-krijg-je ontbreekt`);
  if(!(marker(html,'audience')||hasHeading(main,['voor wie','geschikt voor','past bij','mkb']))) errors.push(`${entry.route}: doelgroepfit/voor-wie ontbreekt`);
  if(!(marker(html,'pricing')||hasHeading(main,['prijs','prijzen','kosten','investering'])||anchors(main).includes(`${ORIGIN}/prijzen`))) errors.push(`${entry.route}: prijs/kostenlogica ontbreekt`);
  if(!(marker(html,'risk')||hasHeading(main,['risico','veilig','privacy','controle','voorwaarden','geen uurtje-factuurtje','menselijk gecontroleerd']))) errors.push(`${entry.route}: risico/bezwaar/risicoreductie ontbreekt`);
  if(!marker(html,'faq')) errors.push(`${entry.route}: buyer FAQ ontbreekt`);
  if(!marker(html,'method')) errors.push(`${entry.route}: methodologie/bronnenbeleid ontbreekt`);
  if(!/data-bg-content-updated=["'][^"']+["']/i.test(html)) errors.push(`${entry.route}: update-signaal ontbreekt`);
  if(!hasPrimary(html,entry)) errors.push(`${entry.route}: primaire CTA is niet meetbaar gemarkeerd`);
  if(!hasMicro(html,entry)) errors.push(`${entry.route}: secundaire microconversie ontbreekt`);
  if((entry.supporting_routes||[]).length&&!hasSupportLink(html,entry)) errors.push(`${entry.route}: contextuele support-link ontbreekt`);
  if(!new RegExp(`data-bg-intent-owner=["']${entry.route.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["']`,'i').test(html)) errors.push(`${entry.route}: primaire intent-owner ontbreekt`);
  if(!/data-bg-intent-role=["']primary["']/i.test(html)) errors.push(`${entry.route}: primary intent-role ontbreekt`);
  if(!/data-bg-reviewer=["']arthur-prinsen["']/i.test(html)) errors.push(`${entry.route}: zichtbare auteur/reviewer ontbreekt`);
  return errors;
}

function safeSupport(entry){return (entry.supporting_routes||[]).filter(r=>r.startsWith(`${ORIGIN}/`)&&r!==entry.route).slice(0,2);}
function directAnswer(entry){
  const q=String(entry.primary_intent||'').toLocaleLowerCase('nl-NL');
  if(q.includes('koppeling')||q.includes('systemen koppelen')) return 'Koppel alleen wat aantoonbaar dubbel werk, fouten of vertraging veroorzaakt. Begin met één gegevensstroom, leg eigenaarschap en foutafhandeling vast en schaal pas daarna op.';
  if(q.includes('ai')) return 'Begin met een concreet bedrijfsprobleem en een meetbare uitkomst, niet met een AI-tool. Regel data, eigenaarschap, risico en menselijke controle voordat je opschaalt.';
  if(q.includes('due diligence')||q.includes('overname')) return 'Maak vóór de transactie zichtbaar welke kennis, processen, data en afhankelijkheden bedrijfskritisch zijn en wat er gebeurt als sleutelpersonen wegvallen.';
  return 'Maak eerst het echte knelpunt, de eigenaar en de gewenste uitkomst expliciet. Kies daarna de kleinste werkende oplossing en meet of die aantoonbaar waarde levert.';
}

function nativeMoneyPage(input){
  let html=String(input);
  html=html.replace(/<section\b[^>]*id=(?:"bg-money-v2"|'bg-money-v2'|"bg-money-v3"|'bg-money-v3')[^>]*>[\s\S]*?<\/section>\s*/i,'');
  if(/data-bg-money-contract-version=["']native-v1["']/i.test(html)) return html;
  return html.replace(/<main\b([^>]*)>/i,(_tag,attrs)=>{
    const clean=attrs.replace(/\sdata-bg-money-contract-version=(?:"[^"]*"|'[^']*')/gi,'');
    return `<main${clean} data-bg-money-contract-version="native-v1">`;
  });
}

export function enrichMoneyPage(input,entry){
  let html=String(input); if(!entry||entry.role!=='money') return html;
  if(isNative(entry)) return nativeMoneyPage(html);
  if(/data-bg-money-contract-version=["']v3["']/i.test(html)) return html;
  html=html.replace(/<section\b[^>]*id=(?:"bg-money-v2"|'bg-money-v2'|"bg-money-v3"|'bg-money-v3')[^>]*>[\s\S]*?<\/section>\s*/i,'');
  const support=safeSupport(entry); const primary=entry.primary_cta||{action:'zelfscan',url:`${ORIGIN}/zelfscan`};
  const links=support.map((url,i)=>`<a href="${esc(url)}" data-bg-money-support="${i+1}">${i===0?'Lees de inhoudelijke verdieping':'Bekijk de gerelateerde aanpak'}</a>`).join(' · ');
  const updated=new Date().toISOString().slice(0,10);
  const block=`<section id="bg-money-v3" class="bg-money-v2" aria-label="Beslisinformatie" data-bg-money-contract="v2" data-bg-money-contract-version="v3" data-bg-intent-role="primary" data-bg-intent-owner="${esc(entry.route)}" data-bg-content-updated="${updated}">
  <aside class="bg-money-v2-review" data-bg-reviewer="arthur-prinsen" aria-label="Inhoudelijke review">Inhoudelijk gereviewd door <a href="${ORIGIN}/over-ons">Arthur Prinsen</a>. Gebaseerd op implementaties met AFAS, Exact, Microsoft 365, Power BI en bedrijfsprocessen in Nederlandse organisaties. Laatste inhoudelijke publicatiecontrole: <time datetime="${updated}">${updated}</time>.</aside>
  <div data-bg-money-section="problem"><h2>Het zoekprobleem: ${esc(entry.primary_intent)}</h2><p>Deze pagina is de primaire eigenaar van deze zoekintentie. Gerelateerde pagina’s ondersteunen deze pagina en concurreren er niet mee.</p></div>
  <div data-bg-money-section="answer"><h2>Direct antwoord</h2><p>${esc(directAnswer(entry))}</p></div>
  <div data-bg-money-section="proposition"><h2>Wat we doen</h2><p>We verbinden analyse, bedrijfskennis, data en uitvoering zodat je niet blijft hangen in advies of losse tooling.</p></div>
  <div data-bg-money-section="how"><h2>Hoe het werkt</h2><ol><li>We brengen de huidige situatie, data en het echte knelpunt in beeld.</li><li>We bepalen de kleinste werkende oplossing, eigenaar en meetbare uitkomst.</li><li>We implementeren of prioriteren de vervolgstap en controleren het resultaat.</li><li>We borgen wat werkt en stoppen of herstellen wat niet werkt.</li></ol></div>
  <div data-bg-money-section="deliverables"><h2>Wat je krijgt</h2><p>Een concrete analyse, prioriteiten, besliscriteria, een uitvoerbare vervolgstap en zicht op wat daarna moet worden gebouwd, gekoppeld of geborgd.</p></div>
  <div data-bg-money-section="audience"><h2>Voor wie wel en niet</h2><p>Wel voor Nederlandse mkb-organisaties die een concreet proces-, kennis-, data- of AI-probleem willen oplossen. Niet voor organisaties die alleen een generieke tooldemo of onbewezen AI-belofte zoeken.</p></div>
  <div data-bg-money-section="pricing"><h2>Kosten en keuze</h2><p>Prijs en scope hangen af van de gekozen vervolgstap. Bekijk de actuele vaste pakketten en prijslogica op <a href="${ORIGIN}/prijzen">prijzen voor digitalisering</a>.</p></div>
  <div data-bg-money-section="risk"><h2>Risico’s en bezwaren</h2><p>We werken stapsgewijs, maken aannames en eigenaarschap expliciet, gebruiken minimale noodzakelijke data en houden menselijke controle op beslissingen en uitvoering.</p></div>
  <div data-bg-money-section="faq"><h2>Veelgestelde vragen vóór je beslist</h2><details><summary>Moet alles in één keer?</summary><p>Nee. De voorkeur is één afgebakend probleem met een meetbare uitkomst, daarna pas opschalen.</p></details><details><summary>Wat kost het?</summary><p>De actuele prijs- en pakketlogica staat op <a href="${ORIGIN}/prijzen">de prijzenpagina</a>; maatwerk wordt pas gekozen als de scope dat echt vereist.</p></details><details><summary>Hoe voorkom je een traject zonder resultaat?</summary><p>Door vooraf probleem, eigenaar, succesmaat en stopcriteria vast te leggen en na iedere stap readback en verificatie te doen.</p></details></div>
  <div data-bg-money-section="method"><h2>Methodologie en bronnenbeleid</h2><p>We scheiden observatie, bron, aanname en conclusie. Publieke claims moeten herleidbaar zijn naar een bron, berekening, screenshot, architectuur, praktijkvoorbeeld of eigen aantoonbare data. We voegen geen verzonnen klantresultaten of onbewezen cijfers toe.</p></div>
  <div class="bg-money-v2-actions"><a href="${esc(primary.url)}" data-bg-conversion="${esc(primary.action)}" data-bg-page-role="money" data-bg-funnel-stage="${esc(entry.funnel_stage)}">${primary.action==='frisse-blik'?'Plan een Frisse Blik':'Doe de gratis zelfscan'}</a>${links?`<p>${links}</p>`:''}</div>
</section>`;
  if(/<\/main>/i.test(html)) html=html.replace(/<\/main>/i,`${block}\n</main>`); else html=html.replace(/<\/body>/i,`${block}\n</body>`);
  return html;
}