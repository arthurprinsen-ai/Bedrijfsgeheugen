const API='/api/portal-entitlements';
const PLAN_LABELS={starter:'Starter',pro:'Pro',groei:'Groei',enterprise:'Enterprise'};
const UPGRADE_URL='https://www.bedrijfsgeheugen.nl/prijzen';

function fmt(value,unlimitedAt=9000){const n=Number(value||0);return n>=unlimitedAt?'Onbeperkt':n.toLocaleString('nl-NL')}
function item(label,value){return '<div class="pe-item"><small>'+label+'</small><strong>'+value+'</strong></div>'}
function upgrade(copy){return '<a class="pe-upgrade" href="'+UPGRADE_URL+'">'+copy+' →</a>'}

export async function loadCommercialEntitlements({fetchFn=globalThis.fetch}={}){
 try{
  const response=await fetchFn(API,{headers:{accept:'application/json'},credentials:'same-origin'});
  if(response.status===401||response.status===403||response.status===402)return {state:'unavailable',record:null};
  if(!response.ok)return {state:'error',record:null};
  return {state:'ready',record:await response.json()};
 }catch{return {state:'error',record:null}}
}

function render(record){
 const e=record?.entitlements||{},plan=String(record?.plan||'').toLowerCase();
 const shell=document.createElement('section');shell.className='portal-entitlements';shell.dataset.plan=plan;
 shell.innerHTML='<div class="pe-head"><div><span>Jouw Powerhouse</span><h3>'+ (PLAN_LABELS[plan]||record?.plan_name||'Abonnement') +'</h3></div><a href="'+UPGRADE_URL+'">Pakket bekijken ↗</a></div>'+
 '<div class="pe-grid">'+
 item('Gebruikers',fmt(e.seats))+
 item('Integraties',fmt(e.data_sources,900))+
 item('Documenten',fmt(e.documents,90000))+
 item('Data refresh',Number(e.refresh_minutes)===0?'On-demand':Number(e.refresh_minutes)<=15?'Elke 15 min':Number(e.refresh_minutes)<=60?'Elk uur':'1× per nacht')+
 item('AI-vragen / maand',fmt(e.ai_questions_month,90000))+
 item('Automatiseringen',fmt(e.automations,900))+
 '</div>'+
 '<div class="pe-flags"><span class="'+(e.intelligence_core?'on':'off')+'">Intelligence</span><span class="'+(e.agent_mode&&e.agent_mode!=='none'?'on':'off')+'">Agents</span><span class="'+(Number(e.data_sources)>0?'on':'off')+'">Connect</span><span class="'+(e.audit_trail?'on':'off')+'">Audit trail</span><span class="'+(e.sso?'on':'off')+'">SSO</span></div>'+
 (plan!=='enterprise'?upgrade('Meer capaciteit of functies nodig?'):'');
 return shell;
}

function installStyles(){
 if(document.getElementById('portalEntitlementStyles'))return;
 const style=document.createElement('style');style.id='portalEntitlementStyles';style.textContent=`
 .portal-entitlements{margin:16px 0 22px;padding:18px;border:1px solid #dbe4ef;border-radius:16px;background:linear-gradient(135deg,#fff,#edf6ff)}
 .pe-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.pe-head span{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#6a7890}.pe-head h3{margin:3px 0 0;color:#0e2148}.pe-head a,.pe-upgrade{color:#0e2148;font-weight:800;text-decoration:none}
 .pe-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-top:14px}.pe-item{background:#fff;border:1px solid #e1e7ef;border-radius:10px;padding:10px}.pe-item small{display:block;color:#718099;font-size:11px}.pe-item strong{display:block;color:#142442;margin-top:2px}
 .pe-flags{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.pe-flags span{font-size:11px;font-weight:800;padding:5px 8px;border-radius:999px}.pe-flags .on{background:#dff7e9;color:#17603a}.pe-flags .off{background:#f1f3f6;color:#8a94a3}.pe-upgrade{display:inline-block;margin-top:12px;font-size:13px}
 .portal-plan-locked{opacity:.52;position:relative}.portal-plan-locked:after{content:"Upgrade";font-size:10px;font-weight:900;color:#0e2148;background:#ffd21c;border-radius:999px;padding:3px 6px;margin-left:6px}
 @media(max-width:900px){.pe-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:560px){.pe-grid{grid-template-columns:repeat(2,1fr)}}
 `;document.head.appendChild(style);
}

function applyUiGates(record){
 const e=record?.entitlements||{};
 document.documentElement.dataset.powerhousePlan=record?.plan||'';
 const automations=Number(e.automations||0),sources=Number(e.data_sources||0);
 document.querySelectorAll('.mod').forEach(node=>{
   const id=node.dataset.id;
   const locked=(id==='doen'&&automations<1)||(id==='koppelingen'&&sources<1);
   node.classList.toggle('portal-plan-locked',locked);
   if(locked)node.title='Niet inbegrepen in je huidige pakket. Bekijk upgrade-opties.';
 });
}

export async function mountCommercialEntitlements(){
 installStyles();
 const result=await loadCommercialEntitlements();
 if(result.state!=='ready'||!result.record)return result;
 const anchor=document.querySelector('main .toprow, main .welcome, main h1')?.parentElement||document.querySelector('main');
 if(anchor&&!document.querySelector('.portal-entitlements'))anchor.insertBefore(render(result.record),anchor.children[1]||null);
 applyUiGates(result.record);
 globalThis.__POWERHOUSE_ENTITLEMENTS__=result.record;
 return result;
}
