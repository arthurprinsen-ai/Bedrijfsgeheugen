import { mountStrategyBoard } from './modules/strategy-board.js';

export function renderStrategyDna(container,{openPage,domainState=globalThis.__BG_PORTAL_DOMAIN_STATE__}={}){
 container.innerHTML=`<section class="dna"><div class="pvnativehero"><div><span>Strategy DNA</span><h3>Van identiteit naar uitvoerbare keuzes</h3><p>Leg ambitie, klantbelofte, strategische keuzes, capabilities, bewijs en uitvoeringsritme vast. Sleep kaarten op desktop of gebruik de pijlen op mobiel; volgorde en inhoud worden in de canonieke V2-state opgeslagen.</p></div><button type="button" class="pvprimary" data-dna-action="execution">Vertaal naar uitvoering <span>→</span></button></div><div data-strategy-board-root></div><section class="pvmodule"><div class="pvmodulehead"><span>DNA</span><h3>Strategische samenhang</h3></div><div class="pvactions"><button type="button" class="primary" data-dna-action="models"><span>Open strategiemodellen</span><i>→</i></button><button type="button" data-dna-action="canvas"><span>Open canvassen</span><i>→</i></button><button type="button" data-dna-action="roadmap"><span>Open roadmap</span><i>→</i></button></div></section></section>`;
 const board=container.querySelector('[data-strategy-board-root]');
 if(domainState?.get&&domainState?.set)mountStrategyBoard(board,{domainState});
 else board.innerHTML='<section class="v2tabempty"><h4>Beveiligde context laden</h4><p>Strategy DNA wordt beschikbaar zodra de klantcontext is geladen.</p></section>';
 const routes={execution:'strategie-naar-maandagochtend',models:'strategiemodellen',canvas:'canvassen',roadmap:'roadmap'};
 container.querySelectorAll('[data-dna-action]').forEach(btn=>btn.addEventListener('click',()=>openPage?.(routes[btn.dataset.dnaAction])));
}
