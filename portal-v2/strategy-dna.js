const KEY='bg-v2-strategy-dna';
const FIELDS=[
 ['ambitie','Ambitie','Waar wil de organisatie aantoonbaar naartoe?'],
 ['klant','Klantbelofte','Welke klantwaarde moet altijd herkenbaar zijn?'],
 ['keuzes','Strategische keuzes','Wat doen we bewust wel én niet?'],
 ['capabilities','Kerncapabilities','Welke vermogens maken de strategie uitvoerbaar?'],
 ['metrics','Bewijs & maatstaven','Welke uitkomsten bewijzen dat de strategie werkt?'],
 ['ritme','Uitvoeringsritme','Hoe vertalen we dit naar maandagochtend en eigenaarschap?']
];
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function save(state){localStorage.setItem(KEY,JSON.stringify(state))}

export function renderStrategyDna(container,{openPage}){
 const state=load();
 container.innerHTML=`<section class="dna"><div class="pvnativehero"><div><span>Strategy DNA</span><h3>Van identiteit naar uitvoerbare keuzes</h3><p>Leg ambitie, klantbelofte, strategische keuzes, capabilities, bewijs en uitvoeringsritme vast. Alles blijft native binnen Portal V2.</p></div><button type="button" class="pvprimary" data-dna-action="execution">Vertaal naar uitvoering <span>→</span></button></div><div class="dnagrid">${FIELDS.map(([id,label,help])=>`<article><small>${label}</small><textarea data-dna-field="${id}" placeholder="${esc(help)}">${esc(state[id]||'')}</textarea><p>${help}</p></article>`).join('')}</div><section class="pvmodule"><div class="pvmodulehead"><span>DNA</span><h3>Strategische samenhang</h3></div><div class="pvactions"><button type="button" class="primary" data-dna-action="models"><span>Open strategiemodellen</span><i>→</i></button><button type="button" data-dna-action="canvas"><span>Open canvassen</span><i>→</i></button><button type="button" data-dna-action="roadmap"><span>Open roadmap</span><i>→</i></button></div></section></section>`;
 container.querySelectorAll('[data-dna-field]').forEach(field=>field.addEventListener('input',()=>{const next=load();next[field.dataset.dnaField]=field.value;next.updatedAt=new Date().toISOString();save(next)}));
 const routes={execution:'strategie-naar-maandagochtend',models:'strategiemodellen',canvas:'canvassen',roadmap:'roadmap'};
 container.querySelectorAll('[data-dna-action]').forEach(btn=>btn.addEventListener('click',()=>openPage(routes[btn.dataset.dnaAction])));
}
