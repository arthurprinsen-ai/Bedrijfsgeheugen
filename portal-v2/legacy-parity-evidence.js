import { calculateCapability } from './legacy-parity-engine.js';

const format=value=>{
 if(typeof value==='number')return new Intl.NumberFormat('nl-NL',{maximumFractionDigits:2}).format(value);
 if(typeof value==='string')return value;
 if(Array.isArray(value))return `${value.length} resultaat${value.length===1?'':'en'}`;
 if(value&&typeof value==='object')return Object.entries(value).map(([k,v])=>`${k}: ${typeof v==='number'?Math.round(v*100)/100:String(v)}`).join(' · ');
 return String(value??'—');
};

export function mountLegacyParityEvidence(root,{legacyCapability,domainState}={}){
 if(!root||!legacyCapability)return ()=>{};
 const render=()=>{
  const shell=root.querySelector('.v2workspace');
  if(!shell||shell.dataset.activeTab!=='analyse')return;
  const content=shell.querySelector('[data-workspace-content]');if(!content)return;
  content.querySelector('[data-legacy-algorithm-parity]')?.remove();
  let results={};try{results=calculateCapability(legacyCapability,domainState?.get?.()||{});}catch{return;}
  const section=document.createElement('section');section.className='v2paritycalc';section.dataset.legacyAlgorithmParity='true';
  const heading=document.createElement('div');heading.className='v2paritycalchead';heading.innerHTML='<strong>Legacy-algoritmen · native V2</strong><span>Uitvoerbare berekeningen op canonieke klantdata</span>';section.appendChild(heading);
  const grid=document.createElement('div');grid.className='v2profilemetrics';
  for(const [id,value] of Object.entries(results)){const card=document.createElement('article');const label=document.createElement('small');label.textContent=id;const output=document.createElement('strong');output.textContent=format(value);card.append(label,output);grid.appendChild(card)}
  section.appendChild(grid);content.appendChild(section);
 };
 const onClick=event=>{if(event.target.closest?.('[data-workspace-tab="analyse"]'))queueMicrotask(render)};
 root.addEventListener('click',onClick);render();return()=>root.removeEventListener('click',onClick);
}
