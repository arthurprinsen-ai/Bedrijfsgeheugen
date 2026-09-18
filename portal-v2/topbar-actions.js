const byId=id=>document.getElementById(id);

const triggers=[
 ['portalNotifications','portalNotificationsPanel'],
 ['portalHelp','portalHelpPanel'],
 ['portalAccount','portalAccountPanel']
];

function closePanels(except=null){
 for(const [triggerId,panelId] of triggers){
  const trigger=byId(triggerId),panel=byId(panelId);
  if(!trigger||!panel||panelId===except)continue;
  panel.hidden=true;
  trigger.setAttribute('aria-expanded','false');
 }
}

function togglePanel(triggerId,panelId){
 const trigger=byId(triggerId),panel=byId(panelId);
 if(!trigger||!panel)return;
 const willOpen=panel.hidden;
 closePanels(willOpen?panelId:null);
 panel.hidden=!willOpen;
 trigger.setAttribute('aria-expanded',willOpen?'true':'false');
 if(willOpen)panel.querySelector('button,a,[tabindex]:not([tabindex="-1"])')?.focus({preventScroll:true});
}

function mountNotifications(){
 const list=byId('portalNotificationsList');
 if(!list)return;
 const items=[...document.querySelectorAll('.activities .act')].map(x=>x.textContent.replace(/\s+/g,' ').trim()).filter(Boolean);
 list.innerHTML='';
 if(!items.length){
  const p=document.createElement('p');p.className='portal-popover-empty';p.textContent='Er zijn nu geen activiteiten om als melding te tonen.';list.appendChild(p);return;
 }
 for(const text of items.slice(0,6)){
  const row=document.createElement('div');row.className='portal-notification-item';row.textContent=text;list.appendChild(row);
 }
}

for(const [triggerId,panelId] of triggers){
 const trigger=byId(triggerId);
 trigger?.addEventListener('click',event=>{event.stopPropagation();togglePanel(triggerId,panelId)});
}

byId('portalMainMenu')?.addEventListener('click',()=>{
 closePanels();
 const showPages=byId('showPages');
 if(showPages)showPages.click();
});

byId('portalHelpAllSections')?.addEventListener('click',()=>{
 closePanels();
 const showPages=byId('showPages');
 if(showPages)showPages.click();
});


document.querySelectorAll('[data-popover-close]').forEach(button=>button.addEventListener('click',()=>closePanels()));

document.addEventListener('click',event=>{
 if(event.target.closest('.portal-popover')||event.target.closest('[aria-controls^="portal"]'))return;
 closePanels();
});

document.addEventListener('keydown',event=>{
 if(event.key==='Escape')closePanels();
});

mountNotifications();
