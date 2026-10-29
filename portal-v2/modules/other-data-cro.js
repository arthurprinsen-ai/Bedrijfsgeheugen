// CRO meet- en experimentoverzicht onder de bestaande portalnavigatie.
// De interne rapportage heeft eigen authorisatie. Nooit publieke analytics-data vrijgeven.
const DOCS = Object.freeze([
  ['Google Analytics events','https://developers.google.com/analytics/devguides/collection/ga4/events'],
  ['Microsoft Clarity scrollmaps','https://learn.microsoft.com/en-us/clarity/heatmaps/scroll-maps'],
  ['Microsoft Clarity clickmaps','https://learn.microsoft.com/en-us/clarity/heatmaps/click-maps'],
  ['Nederlandse privacyregels','https://autoriteitpersoonsgegevens.nl/nl/onderwerpen/internet-telefoon-tv-en-post/cookies']
]);
const SIGNALS = Object.freeze([
  ['Uitval per pagina/sectie','Laatste zichtbare sectie + maximale scroll (waargenomen, niet exacte vertrekhandeling)'],
  ['Frictie','Formulierfouten, verlaten formulieren en herhaalde klikken (heuristiek)'],
  ['Contact','CTA, WhatsApp, formulier, afspraak, offerte en geverifieerde order'],
  ['Experiment','Hypothese, controle/treatment, blootstelling, primaire metric, guardrails, eindbesluit'],
  ['Betrouwbaarheid','Mens/bot-filter, consent, ontvangen/bevestigd, versheid, ontbrekende events, incident'],
]);
export function mountOtherDataCro(root) {
  if(!root)return;
  root.replaceChildren();
  const wrap=document.createElement('div');
  wrap.className='pvotherdata';
  const heading=document.createElement('section');heading.className='pvmodule';
  heading.innerHTML='<div class="pvmodulehead"><span>CRO</span><h3>Andere data · Website & experimenten</h3></div><p>Deze pagina gebruikt het bestaande Meetoverzicht en de bestaande Powerhouse-experimentcyclus. Een gebeurtenis is pas betrouwbaar opgeslagen na een databasebevestiging. Geen botverkeer als bezoekers tellen, geen hypothetische omzet als gerealiseerde omzet.</p><p><strong>Stand:</strong> Gebruik de beschermde livegegevens hieronder. Als het overzicht niet laadt, blijft de toestand ONBEKEND, niet groen.</p>';
  wrap.appendChild(heading);
  const sec=document.createElement('section');sec.className='pvmodule';
  const header=document.createElement('div');header.className='pvmodulehead';header.innerHTML='<span>01</span><h3>Meetdimensies voor CRO-agents</h3>';sec.appendChild(header);
  const list=document.createElement('ul');
  SIGNALS.forEach(function(row){const li=document.createElement('li');const b=document.createElement('strong');b.textContent=row[0]+': ';li.append(b,document.createTextNode(row[1]));list.append(li);});
  sec.appendChild(list);wrap.appendChild(sec);
  const panel=document.createElement('section');panel.className='pvmodule';
  panel.innerHTML='<div class="pvmodulehead"><span>02</span><h3>Live meetoverzicht en experimentbesluiten</h3></div><p>Extra beveiligd: voer in het kader je bestaande interne toegangscode in. De code en de metingen worden niet overgenomen door deze portaalpagina.</p>';
  const direct=document.createElement('a');direct.href='https://www.bedrijfsgeheugen.nl/intern/meetoverzicht/';direct.target='_blank';direct.rel='noopener noreferrer';direct.textContent='Open het beveiligde Meetoverzicht in een eigen tabblad ↗';
  panel.appendChild(direct);
  const iframe=document.createElement('iframe');iframe.src='https://www.bedrijfsgeheugen.nl/intern/meetoverzicht/';iframe.title='Beveiligd CRO-meetoverzicht: bezoekers, experimenten en meetbewijzen';iframe.loading='lazy';
  iframe.style.cssText='display:block;width:100%;min-height:760px;margin-top:18px;border:1px solid #dce1e8;border-radius:12px;background:#fff';
  panel.appendChild(iframe);wrap.appendChild(panel);
  const research=document.createElement('section');research.className='pvmodule';
  research.innerHTML='<div class="pvmodulehead"><span>03</span><h3>Onderzoeksbronnen en meetcontract</h3></div><p>Methodiek: menselijk verkeer, randomisatie vóór de behandeling, één vooraf gekozen hoofdmetric, guardrails, voldoende steekproef, sample-ratio-controle, onafhankelijk resultaat en terugschrijven naar Brain. Geen uitslag zonder betrouwbare data.</p>';
  const sources=document.createElement('ul');DOCS.forEach(function(d){const li=document.createElement('li'),a=document.createElement('a');a.href=d[1];a.target='_blank';a.rel='noopener noreferrer';a.textContent=d[0];li.append(a);sources.append(li);});
  research.appendChild(sources);wrap.appendChild(research);
  root.appendChild(wrap);
}
