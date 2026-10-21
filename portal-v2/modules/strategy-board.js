import { ensureInteractionParityStyles } from './interaction-parity-style.js';

const DEFAULT_CARDS=Object.freeze([
  Object.freeze({id:'ambitie',label:'Ambitie',help:'Waar wil de organisatie aantoonbaar naartoe?'}),
  Object.freeze({id:'klant',label:'Klantbelofte',help:'Welke klantwaarde moet altijd herkenbaar zijn?'}),
  Object.freeze({id:'keuzes',label:'Strategische keuzes',help:'Wat doen we bewust wel én niet?'}),
  Object.freeze({id:'capabilities',label:'Kerncapabilities',help:'Welke vermogens maken de strategie uitvoerbaar?'}),
  Object.freeze({id:'metrics',label:'Bewijs & maatstaven',help:'Welke uitkomsten bewijzen dat de strategie werkt?'}),
  Object.freeze({id:'ritme',label:'Uitvoeringsritme',help:'Hoe vertalen we dit naar maandagochtend en eigenaarschap?'})
]);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const cloneCards=cards=>(Array.isArray(cards)?cards:[]).map(card=>({...card}));

export function reorderStrategyCards(cards,sourceId,targetId){
  const next=cloneCards(cards);const from=next.findIndex(card=>String(card.id)===String(sourceId));const to=next.findIndex(card=>String(card.id)===String(targetId));
  if(from<0||to<0||from===to)return next;
  const [moved]=next.splice(from,1);next.splice(to,0,moved);return next;
}

function orderedCards(order=[],values={}){
  const byId=new Map(DEFAULT_CARDS.map(card=>[card.id,{...card,value:String(values?.[card.id]??'')}])) ;
  const ids=[...(Array.isArray(order)?order:[]).map(String),...DEFAULT_CARDS.map(card=>card.id)].filter((id,index,list)=>byId.has(id)&&list.indexOf(id)===index);
  return ids.map(id=>byId.get(id));
}

function markup(cards){
  return `<div class="dnagrid v2strategygrid" data-strategy-board>${cards.map((card,index)=>`<article class="v2strategycard" draggable="true" data-strategy-id="${esc(card.id)}">
    <div class="v2strategycardhead"><span class="v2strategydrag" aria-hidden="true">⠿</span><small>${esc(card.label)}</small><div class="v2strategycontrols"><button type="button" data-strategy-move-up aria-label="Verplaats ${esc(card.label)} omhoog" ${index===0?'disabled':''}>↑</button><button type="button" data-strategy-move-down aria-label="Verplaats ${esc(card.label)} omlaag" ${index===cards.length-1?'disabled':''}>↓</button></div></div>
    <textarea data-strategy-field="${esc(card.id)}" placeholder="${esc(card.help)}">${esc(card.value)}</textarea><p>${esc(card.help)}</p>
  </article>`).join('')}</div>`;
}

export function mountStrategyBoard(root,{domainState,onSaveStatus}={}){
  if(!root?.replaceChildren)throw new TypeError('STRATEGY_BOARD_ROOT_REQUIRED');
  if(!domainState?.get||!domainState?.set)throw new TypeError('STRATEGY_DOMAIN_STATE_REQUIRED');
  ensureInteractionParityStyles(root.ownerDocument||globalThis.document);
  let cards=orderedCards(domainState.get('portal.strategy.cardOrder'),domainState.get('portal.strategy.dna')||{});let draggedId=null;let saveTimer=null;
  const flush=()=>{clearTimeout(saveTimer);saveTimer=setTimeout(()=>domainState.flush?.().then(()=>onSaveStatus?.(domainState.status?.()||'saved')).catch(()=>onSaveStatus?.('error')),250);};
  const persistOrder=next=>{cards=cloneCards(next);domainState.set('portal.strategy.cardOrder',cards.map(card=>card.id));onSaveStatus?.(domainState.status?.()||'dirty');flush();render();};
  const persistValue=(id,value)=>{const values=domainState.get('portal.strategy.dna')||{};domainState.set('portal.strategy.dna',{...values,[id]:value,updatedAt:new Date().toISOString()});cards=cards.map(card=>card.id===id?{...card,value}:card);onSaveStatus?.(domainState.status?.()||'dirty');flush();};
  const moveBy=(id,offset)=>{const index=cards.findIndex(card=>card.id===id);const target=index+offset;if(index<0||target<0||target>=cards.length)return;persistOrder(reorderStrategyCards(cards,id,cards[target].id));};
  const render=()=>{
    root.innerHTML=markup(cards);
    root.querySelectorAll('.v2strategycard').forEach(card=>{
      const id=card.dataset.strategyId;
      card.addEventListener('dragstart',event=>{draggedId=id;card.classList.add('dragging');event.dataTransfer?.setData('text/plain',id);if(event.dataTransfer)event.dataTransfer.effectAllowed='move';});
      card.addEventListener('dragend',()=>{draggedId=null;card.classList.remove('dragging');root.querySelectorAll('.dragover').forEach(node=>node.classList.remove('dragover'));});
      card.addEventListener('dragover',event=>{event.preventDefault();card.classList.add('dragover');});
      card.addEventListener('dragleave',()=>card.classList.remove('dragover'));
      card.addEventListener('drop',event=>{event.preventDefault();card.classList.remove('dragover');const source=draggedId||event.dataTransfer?.getData('text/plain');if(source&&source!==id)persistOrder(reorderStrategyCards(cards,source,id));});
      card.querySelector('[data-strategy-move-up]')?.addEventListener('click',()=>moveBy(id,-1));
      card.querySelector('[data-strategy-move-down]')?.addEventListener('click',()=>moveBy(id,1));
      card.querySelector('[data-strategy-field]')?.addEventListener('change',event=>persistValue(id,event.currentTarget.value));
    });
  };
  render();
  return Object.freeze({getCards:()=>cloneCards(cards),reorder:(source,target)=>persistOrder(reorderStrategyCards(cards,source,target))});
}
