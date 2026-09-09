import { PROFILE_DIMENSIONS } from './company-input.js';
import { NIVEAUS, capabilityImpact } from '../capability-catalog.js';

/**
 * Nieuwe wijziging voorstellen — teruggebracht uit het vorige klantportaal
 * (velden wz-k, wz-n, wz-e, wz-r, wz-d).
 *
 * Twee dingen maakten dit in het oude portaal meer dan een formulier, en die
 * staan hier daarom ook in:
 *   1. een volledigheidsmeter van vier stappen, zodat zichtbaar is wat er nog
 *      mist voordat iemand om akkoord wordt gevraagd;
 *   2. een impactweergave die live meebeweegt met het gekozen onderdeel, zodat
 *      je vóór het indienen ziet hoeveel afdelingen, processen, systemen en
 *      maatstaven eraan hangen.
 *
 * De regel uit het oude portaal blijft staan: niets geldt voordat het is
 * goedgekeurd en doorgevoerd. Een ingediende wijziging krijgt status 'Open'.
 */

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const arr=value=>Array.isArray(value)?value:[];
const level=value=>{const n=Number(value);return Number.isFinite(n)&&n>=1&&n<=5?n:0;};

export function wizardCompleteness(draft={},currentLevel=0){
  return [
    Boolean(draft.dimension),
    level(draft.toLevel)>0 && level(draft.toLevel)!==level(currentLevel),
    Boolean(String(draft.reason||'').trim()),
    Boolean(String(draft.owner||'').trim())
  ];
}

export function buildChange(draft={},currentLevel=0){
  const dimension=PROFILE_DIMENSIONS.find(item=>item.id===draft.dimension);
  return {
    change:`${dimension?.label||draft.dimension} naar ${NIVEAUS[level(draft.toLevel)]||''}`.trim(),
    area:dimension?.label||draft.dimension||'',
    dimension:draft.dimension||'',
    fromLevel:level(currentLevel),
    toLevel:level(draft.toLevel),
    reason:String(draft.reason||'').trim(),
    owner:String(draft.owner||'').trim(),
    effectiveDate:draft.effectiveDate||'',
    impact:capabilityImpact(draft.dimension).capabilities.length,
    status:'Open',
    proposedAt:new Date().toISOString().slice(0,10)
  };
}

function impactRow(impact){
  return [
    ['Afdelingen',impact.afd.length],['Cijfers',impact.kpi.length],
    ['Processen',impact.proc.length],['Acties',impact.proj.length],
    ['Systemen',impact.sys.length],['Bouwstenen',impact.capabilities.length]
  ].map(([label,count])=>`<span class="wzstat"><b>${count}</b><span>${label}</span></span>`).join('');
}

export function mountChangeWizard(root,{domainState,onSaved}={}){
  if(!root||!domainState?.get)return ()=>{};
  let draft={dimension:PROFILE_DIMENSIONS[0]?.id||'',toLevel:2,reason:'',owner:'',effectiveDate:''};

  const currentLevel=()=>level(domainState.get()?.portal?.profile?.maturity?.[draft.dimension]);

  const draw=()=>{
    const current=currentLevel();
    const impact=capabilityImpact(draft.dimension);
    const steps=wizardCompleteness(draft,current);
    const done=steps.filter(Boolean).length;
    root.innerHTML=`<section class="pvmodule wzcard">
      <div class="pvmodulehead"><span>${done}/4</span><h3>Nieuwe wijziging</h3></div>
      <p class="wzsub">Niets geldt voordat het is goedgekeurd en doorgevoerd.</p>
      <div class="wzsteps" role="img" aria-label="${done} van 4 stappen ingevuld">${steps.map(ok=>`<i class="${ok?'aan':''}"></i>`).join('')}</div>
      <div class="wzform">
        <label class="wzveld"><span>Welk onderdeel wil je wijzigen?</span>
          <select data-wz="dimension">${PROFILE_DIMENSIONS.map(item=>`<option value="${esc(item.id)}"${item.id===draft.dimension?' selected':''}>${esc(item.label)}</option>`).join('')}</select></label>
        <label class="wzveld"><span>Nieuwe waarde</span>
          <select data-wz="toLevel">${[1,2,3,4,5].map(n=>`<option value="${n}"${n===level(draft.toLevel)?' selected':''}>${n} — ${esc(NIVEAUS[n])}</option>`).join('')}</select></label>
        <label class="wzveld"><span>Huidige waarde</span>
          <input readonly value="${current?esc(`${current} — ${NIVEAUS[current]}`):'nog niet beoordeeld'}"></label>
        <label class="wzveld"><span>Wie is de eigenaar? (die moet akkoord geven)</span>
          <input type="text" data-wz="owner" value="${esc(draft.owner)}" placeholder="naam"></label>
        <label class="wzveld wzvol"><span>Waarom deze wijziging?</span>
          <textarea rows="2" data-wz="reason" placeholder="Eén zin. Dit is het enige wat het portaal niet voor je kan bedenken.">${esc(draft.reason)}</textarea></label>
        <label class="wzveld"><span>Ingangsdatum (mag leeg)</span>
          <input type="date" data-wz="effectiveDate" value="${esc(draft.effectiveDate)}"></label>
      </div>
      <div class="wzimpact"><b>Hier hangt het aan vast</b><div class="wzstats">${impactRow(impact)}</div>
        ${impact.capabilities.length?`<p class="wzsub">${esc(impact.capabilities.join(' · '))}</p>`:'<p class="wzsub">Voor dit onderdeel staan nog geen bouwstenen in het model.</p>'}</div>
      <div class="pvactions"><button type="button" class="primary" data-wz-submit${done===4?'':' disabled'}><span>Dien wijziging in</span><i>→</i></button></div>
      <output class="wzout" aria-live="polite"></output>
    </section>`;

    root.querySelectorAll('[data-wz]').forEach(field=>{
      const event=field.tagName==='SELECT'?'change':'input';
      field.addEventListener(event,()=>{
        draft={...draft,[field.dataset.wz]:field.value};
        if(field.dataset.wz==='dimension'||field.dataset.wz==='toLevel')draw();
        else refreshMeter();
      });
    });

    const refreshMeter=()=>{
      const now=wizardCompleteness(draft,currentLevel());
      root.querySelectorAll('.wzsteps i').forEach((dot,index)=>dot.classList.toggle('aan',now[index]));
      root.querySelector('.pvmodulehead span').textContent=`${now.filter(Boolean).length}/4`;
      root.querySelector('[data-wz-submit]').disabled=now.filter(Boolean).length<4;
    };

    root.querySelector('[data-wz-submit]')?.addEventListener('click',()=>{
      const change=buildChange(draft,currentLevel());
      const state=domainState.get()||{};
      const items=arr(state?.portal?.changes?.items);
      domainState.set({...state,portal:{...state.portal,changes:{...state.portal?.changes,items:[...items,change]}}});
      draft={dimension:draft.dimension,toLevel:2,reason:'',owner:'',effectiveDate:''};
      draw();
      root.querySelector('.wzout').textContent=`Ingediend en wacht op akkoord van ${change.owner}. Niets is doorgevoerd.`;
      onSaved?.(change);
    });
  };

  draw();
  return ()=>{root.innerHTML='';};
}
