const ORIGIN = 'https://www.bedrijfsgeheugen.nl';

function bodyOf(html){return String(html).match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1]||'';}
function mainOf(html){return String(html).match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||bodyOf(html);}
function textOf(html){return String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().toLocaleLowerCase('nl-NL');}
function esc(v){return String(v||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function hasHeading(html,words){const t=textOf(html);return words.some(w=>t.includes(w));}
function anchors(html){return [...String(html).matchAll(/<a\b[^>]*href=(?:"([^"]+)"|'([^']+)')[^>]*>/gi)].map(m=>m[1]??m[2]??'');}
function hasEvidence(html){const main=mainOf(html);return /data-bg-evidence(?:\s|=|>)/i.test(main)||/<table\b/i.test(main)||/class=(?:"[^"]*\b(?:bewijs|bronnen?|onderbouwing|case|resultaat|praktijk|voorbeeld|methode|vergelijk|callout|tabelwrap)\b[^"]*"|'[^']*\b(?:bewijs|bronnen?|onderbouwing|case|resultaat|praktijk|voorbeeld|methode|vergelijk|callout|tabelwrap)\b[^']*')/i.test(main)||hasHeading(main,['bewijs','resultaat','praktijk','voorbeeld','methode','berekening','onderzoek']);}
function hasPrimary(html,entry){const a=entry?.primary_cta?.action;return a?new RegExp(`data-bg-conversion=["']${a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["']`,'i').test(html):false;}
function hasMicro(html,entry){const main=mainOf(html);return anchors(main).some(h=>h.startsWith(`${ORIGIN}/`)&&h!==entry?.primary_cta?.url&&h!==entry?.route);}
function hasSupportLink(html,entry){const links=new Set(anchors(mainOf(html)));return (entry?.supporting_routes||[]).some(r=>links.has(r));}
function marker(html,name){return new RegExp(`data-bg-money-section=["']${name}["']`,'i').test(html);}

export function inspectMoneyPage(input,entry){
  const html=String(input); const main=mainOf(html); const text=textOf(main); const errors=[];
  if(!entry||entry.role!=='money') return errors;
  if(!(marker(html,'problem')||hasHeading(main,['probleem','herken je','waar loopt','zonder','kost','verlies','risico']))) errors.push(`${entry.route}: probleem/intentie boven de vouw ontbreekt`);
  if(!(marker(html,'proposition')||hasHeading(main,['oplossing','wat we doen','wat het doet','zo helpt','platform','koppeling','aanpak']))) errors.push(`${entry.route}: unieke propositie/oplossing ontbreekt`);
  if(!hasEvidence(html)) errors.push(`${entry.route}: zichtbaar bewijs/onderbouwing ontbreekt`);
  if(!(marker(html,'how')||hasHeading(main,['hoe het werkt','zo werkt','aanpak','stappen','werkwijze','proces']))) errors.push(`${entry.route}: hoe-het-werkt/aanpak ontbreekt`);
  if(!(marker(html,'deliverables')||hasHeading(main,['wat krijg','oplever','resultaat','inbegrepen','je krijgt']))) errors.push(`${entry.route}: deliverables/wat-krijg-je ontbreekt`);
  if(!(marker(html,'audience')||hasHeading(main,['voor wie','geschikt voor','past bij','mkb']))) errors.push(`${entry.route}: doelgroepfit/voor-wie ontbreekt`);
  if(!(marker(html,'pricing')||hasHeading(main,['prijs','prijzen','kosten','investering'])||anchors(main).includes(`${ORIGIN}/prijzen`))) errors.push(`${entry.route}: prijs/kostenlogica ontbreekt`);
  if(!(marker(html,'risk')||hasHeading(main,['risico','veilig','privacy','controle','voorwaarden','geen uurtje-factuurtje','menselijk gecontroleerd']))) errors.push(`${entry.route}: risico/bezwaar/risicoreductie ontbreekt`);
  if(!hasPrimary(html,entry)) errors.push(`${entry.route}: primaire CTA is niet meetbaar gemarkeerd`);
  if(!hasMicro(html,entry)) errors.push(`${entry.route}: secundaire microconversie ontbreekt`);
  if((entry.supporting_routes||[]).length&&!hasSupportLink(html,entry)) errors.push(`${entry.route}: contextuele support-link ontbreekt`);
  return errors;
}

function safeSupport(entry){return (entry.supporting_routes||[]).filter(r=>r.startsWith(`${ORIGIN}/`)&&r!==entry.route).slice(0,2);}

export function enrichMoneyPage(input,entry){
  let html=String(input); if(!entry||entry.role!=='money'||/id=["']bg-money-v2["']/i.test(html)) return html;
  const support=safeSupport(entry); const primary=entry.primary_cta||{action:'zelfscan',url:`${ORIGIN}/zelfscan`};
  const links=support.map((url,i)=>`<a href="${esc(url)}" data-bg-money-support="${i+1}">${i===0?'Lees de verdieping':'Bekijk gerelateerde aanpak'}</a>`).join(' · ');
  const block=`<section id="bg-money-v2" class="bg-money-v2" aria-label="Beslisinformatie" data-bg-money-contract="v2">
  <div data-bg-money-section="problem"><h2>Van ${esc(entry.primary_intent)} naar een werkende aanpak</h2><p>Je zoekt geen losse technologie, maar een oplossing die in je organisatie werkt en aantoonbaar een volgende stap oplevert.</p></div>
  <div data-bg-money-section="proposition"><h2>Wat we doen</h2><p>We verbinden analyse, bedrijfskennis, data en uitvoering zodat je niet blijft hangen in advies alleen.</p></div>
  <div data-bg-money-section="how"><h2>Hoe het werkt</h2><ol><li>We brengen de huidige situatie en het echte knelpunt in beeld.</li><li>We bepalen de kleinste werkende oplossing en prioriteiten.</li><li>We maken de uitvoering meetbaar en sturen bij op uitkomst.</li></ol></div>
  <div data-bg-money-section="deliverables"><h2>Wat je krijgt</h2><p>Een concrete analyse, prioriteiten, een uitvoerbare vervolgstap en zicht op wat daarna moet worden gebouwd of geborgd.</p></div>
  <div data-bg-money-section="audience"><h2>Voor wie</h2><p>Voor Nederlandse mkb-organisaties die bedrijfskennis, processen, data of AI beter willen laten samenwerken.</p></div>
  <div data-bg-money-section="pricing"><h2>Kosten en keuze</h2><p>Bekijk de actuele prijs- en pakketlogica op <a href="${ORIGIN}/prijzen">prijzen voor digitalisering</a>.</p></div>
  <div data-bg-money-section="risk"><h2>Risico beheersen</h2><p>We werken stapsgewijs, maken keuzes expliciet en houden menselijke controle op beslissingen en uitvoering.</p></div>
  <div class="bg-money-v2-actions"><a href="${esc(primary.url)}" data-bg-conversion="${esc(primary.action)}" data-bg-page-role="money" data-bg-funnel-stage="${esc(entry.funnel_stage)}">${primary.action==='frisse-blik'?'Plan een Frisse Blik':'Doe de gratis zelfscan'}</a>${links?`<p>${links}</p>`:''}</div>
</section>`;
  if(/<\/main>/i.test(html)) html=html.replace(/<\/main>/i,`${block}\n</main>`); else html=html.replace(/<\/body>/i,`${block}\n</body>`);
  return html;
}
