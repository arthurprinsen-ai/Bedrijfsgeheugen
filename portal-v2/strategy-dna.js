import { mountStrategyBoard } from './modules/strategy-board.js';
import { mountStrategyExecution } from './modules/strategy-dna-execution.js';
import { mountDnaLibrary } from './modules/dna-library.js';
import { CAPABILITIES } from './capability-catalog.js';

export function renderStrategyDna(container,{openPage,domainState=globalThis.__BG_PORTAL_DOMAIN_STATE__}={}){
 const state=domainState?.get?.()||{};const strategy=state?.portal?.strategy||{};const dna=strategy?.dna||{};const findings=Array.isArray(strategy?.findings)?strategy.findings:[];const executionState=strategy?.execution||{};const filled=Object.entries(dna).filter(([key,value])=>key!=='updatedAt'&&String(value||'').trim()).length;const themeIds=Array.isArray(executionState?.themeIds)?executionState.themeIds:[];
 container.innerHTML=`<section class="dna"><div class="pvnativehero"><div><span>Strategy DNA</span><h3>Van identiteit naar uitvoerbare keuzes</h3><p>Leg ambitie, klantbelofte, strategische keuzes, capabilities, bewijs en uitvoeringsritme vast. Sleep kaarten op desktop of gebruik de pijlen op mobiel; volgorde en inhoud worden in de canonieke V2-state opgeslagen.</p></div><button type="button" class="pvprimary" data-dna-action="execution">Vertaal naar uitvoering <span>→</span></button></div><section class="pvmodule"><div class="pvmodulehead"><span>DNA</span><h3>Van strategie naar maandagochtend</h3></div><p>Dezelfde canonieke strategie wordt vertaald naar keuzes, capabilities, uitvoering en bewijs.</p></section>
<section class="pvmodule"><div class="pvmodulehead"><span>01</span><h3>Hoe dit in elkaar zit</h3></div><div class="v2profilemetrics"><article><small>DNA-velden ingevuld</small><strong>${filled}/6</strong></article><article><small>Strategische bevindingen</small><strong>${findings.length}</strong></article><article><small>Uitvoeringsthema’s</small><strong>${themeIds.length}</strong></article><article><small>Bouwstenen</small><strong>${Object.keys(CAPABILITIES).length}</strong></article></div></section>
<section class="pvmodule"><div class="pvmodulehead"><span>02</span><h3>Hoe je dit gebruikt</h3></div><p>Leg richting vast, verbind die met bouwstenen, vertaal naar uitvoering en borg de uitkomst in roadmap en bewijs.</p></section>
<section class="pvmodule"><div class="pvmodulehead"><span>03</span><h3>Wat het raakt</h3></div><div class="v2reviewlist">${findings.slice(0,8).map(item=>`<article><div><b>${String(item?.finding||item?.title||'Bevinding')}</b></div><strong>${String(item?.dimension||item?.dim||'Nog niet gekoppeld')}</strong></article>`).join('')||'<p>Nog geen gekoppelde bevindingen.</p>'}</div></section>
<section class="pvmodule"><div class="pvmodulehead"><span>04</span><h3>Wat verandert er per afdeling?</h3></div><p>Afdelingsimpact wordt alleen getoond wanneer een bevinding, roadmap-item of execution canvas een afdeling noemt.</p></section>
<section class="pvmodule"><div class="pvmodulehead"><span>05</span><h3>Volwassenheid per capability</h3></div><p>Capability-volwassenheid komt uit de Strategy DNA-bouwstenen en het organisatieprofiel; ontbrekende scores blijven leeg.</p></section>
<section class="pvmodule"><div class="pvmodulehead"><span>06</span><h3>De veranderagenda</h3></div><p>${themeIds.length?themeIds.length+' uitvoeringsthema’s zijn geselecteerd.':'Nog geen uitvoeringsthema’s geselecteerd.'}</p></section>
<section class="pvmodule"><div class="pvmodulehead"><span>07</span><h3>De verbanden — stel er een vraag over</h3></div><p>Gebruik de portaalvraagfunctie op deze pagina; antwoorden blijven begrensd tot de geladen klantcontext.</p></section>
<section class="pvmodule"><div class="pvmodulehead"><span>08</span><h3>De thermometer</h3></div><p>${filled?Math.round(filled/6*100)+'% van de kern-DNA-velden is ingevuld.':'Nog geen Strategy DNA-kernvelden ingevuld.'}</p></section>
<section class="pvmodule"><div class="pvmodulehead"><span>09</span><h3>Je eigen bouwstenen</h3></div><p>Eigen strategische keuzes worden in dezelfde tenant-state opgeslagen en blijven gescheiden van de vaste bouwstenencatalogus.</p></section><div data-strategy-board-root></div><div data-strategy-execution-root></div><div data-dna-library-root></div><section class="pvmodule"><div class="pvmodulehead"><span>DNA</span><h3>Strategische samenhang</h3></div><div class="pvactions"><button type="button" class="primary" data-dna-action="models"><span>Open strategiemodellen</span><i>→</i></button><button type="button" data-dna-action="canvas"><span>Open canvassen</span><i>→</i></button><button type="button" data-dna-action="roadmap"><span>Open roadmap</span><i>→</i></button></div></section></section>`;
 const board=container.querySelector('[data-strategy-board-root]');
 const execution=container.querySelector('[data-strategy-execution-root]');
 if(domainState?.get&&domainState?.set){
  mountStrategyBoard(board,{domainState});
  mountStrategyExecution(execution,{domainState});
 } else {
  board.innerHTML='<section class="v2tabempty"><h4>Beveiligde context laden</h4><p>Strategy DNA wordt beschikbaar zodra de klantcontext is geladen.</p></section>';
  execution.innerHTML='';
 }
 mountDnaLibrary(container.querySelector('[data-dna-library-root]'));
 const routes={execution:'strategie-naar-maandagochtend',models:'strategiemodellen',canvas:'canvassen',roadmap:'roadmap'};
 container.querySelectorAll('[data-dna-action]').forEach(btn=>btn.addEventListener('click',()=>openPage?.(routes[btn.dataset.dnaAction])));
}
