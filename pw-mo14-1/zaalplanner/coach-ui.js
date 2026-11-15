/* PW MO14-1 v8: coaching screens, pinned first five and season minute review. */
(function(){
'use strict';
const POS=['AL','AR','M','VL','VR'],LABEL={AL:'Linksachter',AR:'Rechtsachter',M:'Midden',VL:'Linksvoor',VR:'Rechtsvoor'},ROLE={AL:'A',AR:'A',M:'M',VL:'V',VR:'V'};
const STRONG={AL:'tess',AR:'cato',M:'eline',VL:'lidewij',VR:'coco'};
const el=id=>document.getElementById(id);
VIEW_IDS.push('tactics');
const plan=document.querySelector('[data-view-panel="plan"]');
const toolbar=document.createElement('section');toolbar.className='coach-card';toolbar.id='coachLineupCard';
toolbar.innerHTML='<div class="coach-heading"><div><span class="coach-tag">Eerste opstelling</span><h3>Jij kiest wie waar begint</h3><p>De vijf beginposities kun je zelf vastzetten. Alle volgende wisselblokken berekent de app met voorkeurslinies en een zo eerlijk mogelijke totale speeltijd.</p></div></div><div class="coach-field-grid" id="coachFirstPositions"></div><p id="coachLineupFeedback" class="coach-status" role="status"></p><div class="coach-sticky-actions"><button type="button" class="coach-btn is-primary" id="coachStrong">Sterk blok · Tess, Cato, Eline, Lidewij, Coco</button><button type="button" class="coach-btn" id="coachRelease">Laat app zelf kiezen</button><button type="button" class="coach-btn" data-go="tactics">Teken tactiek</button></div><p class="coach-footnote">Het sterke blok gebruikt Coco als veldspeelster. De app kiest dan een andere beschikbare keeper; pas dit naar wens aan bij Selectie.</p>';
plan.querySelector('.view-head').insertAdjacentElement('afterend',toolbar);
const stats=document.querySelector('[data-view-panel="stats"]');
const fair=document.createElement('section');fair.className='coach-card';fair.id='coachFairness';
fair.innerHTML='<div class="coach-heading"><div><span class="coach-tag">Alle ingeplande wedstrijden</span><h3>Speelminuten over het hele seizoen</h3><p>Veldminuten en keepersminuten tellen afzonderlijk mee. De wissels compenseren eerdere verschillen zo veel mogelijk binnen de gekozen bloklengte.</p></div></div><p id="coachFairSummary" class="coach-fair-summary"></p><div id="coachFairRows"></div><p class="coach-fair-legend">Exact gelijk is soms wiskundig onmogelijk: met negen veldspeelsters kun je 200 veldminuten per wedstrijd niet exact verdelen. Als dezelfde keeper vaak alle 40 minuten speelt, ontstaan ook grotere verschillen inclusief keepen.</p>';
stats.querySelector('.view-head').insertAdjacentElement('afterend',fair);
const panel=document.createElement('section');panel.className='view-panel';panel.id='screen-tactics';panel.dataset.viewPanel='tactics';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-label','Tactiek en kladblok');
panel.innerHTML='<div class="view-head"><div><div class="eyebrow">PW MO14-1</div><h2>Tactiek & kladblok</h2><p class="lead">Notities en veldtekeningen voor jouw wedstrijd. Sleep speelsters, teken looplijnen en download het resultaat.</p><p class="coach-current-fixture" id="coachTacticFixture"></p></div></div><section class="coach-card"><div class="coach-heading"><div><span class="coach-tag">Kladblaadje</span><h3>Jouw wedstrijdaantekeningen</h3><p>Leg opdrachten vast: bijvoorbeeld druk zetten, passing, strafcorners of het sterke blok.</p></div></div><div class="coach-note-row"><div><b>Sterk blok</b>Tess · Cato · Eline · Lidewij · Coco-Mijn, plus een aparte keeper.</div><div><b>Praktische tip</b>Schrijf per blok één aanwijzing. Je kunt de aantekeningen later downloaden.</div></div><label class="fieldlabel" for="coachNotes">Notities</label><textarea id="coachNotes" class="coach-notes" maxlength="5000" placeholder="Tess + Cato achter, Eline midden, Lidewij en Coco voor. Wat doen we bij balverlies?"></textarea><div class="coach-actions" style="margin-top:12px"><button type="button" class="coach-btn" id="coachDownloadNotes">Download notities</button><button type="button" class="coach-btn" id="coachCopyNotes">Kopieer tekst</button></div></section><section class="coach-card"><div class="coach-heading"><div><span class="coach-tag">Zaalveld</span><h3>Teken de spelsituatie</h3><p>Je vinger, stylus en muis werken op hetzelfde veld. Pijlen zijn looplijnen; cirkels zijn zones. Verplaats de pionnen van de opgestelde speelsters.</p></div></div><div class="coach-board-toolbar" role="toolbar" aria-label="Tekengereedschap"><button class="coach-tool is-selected" type="button" data-coach-tool="pen" aria-pressed="true">✎ Pen</button><button class="coach-tool" type="button" data-coach-tool="arrow" aria-pressed="false">➜ Pijl</button><button class="coach-tool" type="button" data-coach-tool="circle" aria-pressed="false">◯ Cirkel</button><button class="coach-tool" type="button" data-coach-tool="move" aria-pressed="false">✥ Verplaats</button><label class="coach-colors"><input type="color" id="coachColor" value="#79283e" aria-label="Penkleur"></label></div><canvas id="coachBoard" class="coach-board-canvas" width="960" height="640" aria-label="Interactief zaalhockeyveld voor tactische tekeningen"></canvas><p class="coach-board-hint">Alles wordt per wedstrijd op dit apparaat bewaard. Kies Verplaats om speelsterpionnen over het veld te schuiven.</p><div class="coach-toolbar-split"><div class="coach-actions"><button class="coach-btn" type="button" id="coachUndo">↶ Ongedaan</button><button class="coach-btn" type="button" id="coachRedo">↷ Opnieuw</button><button class="coach-btn" type="button" id="coachClear">Wis tekening</button></div><button class="coach-btn is-primary" type="button" id="coachDownloadBoard">Download veld als PNG</button></div></section><p class="coach-footnote">Geen gegevens worden gedeeld met een externe dienst. Voor gebruik op een ander apparaat download je de PNG en je notities.</p>';
plan.parentElement.appendChild(panel);
document.querySelector('#screen-more .menu-list')?.insertAdjacentHTML('beforeend','<button class="menu-tile" type="button" data-go="tactics"><span class="menu-tile-icon coach-menu-icon">✎</span><span><b>Tactiek & kladblok</b><small>Spelsituaties tekenen en notities bewaren</small></span><span aria-hidden="true">›</span></button>');
document.querySelector('#appDrawer .drawer-items')?.insertAdjacentHTML('beforeend','<button type="button" data-go="tactics"><span class="coach-menu-icon">✎</span><span>Tactiek & kladblok</span><span>›</span></button>');
const mobile=document.querySelector('.bottom-nav [data-view="stats"]');if(mobile){mobile.dataset.view='tactics';mobile.setAttribute('aria-controls','screen-tactics');mobile.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3h18v18H3zM12 3v18M3 12h18"/><path d="m7 15 2-2 3 1 2-3 3 2"/></svg><span>Tactiek</span>';}
function match(){return matchData();}
function available(){const m=match();return state.roster.filter(p=>!m.absent.includes(p.id)&&p.id!==m.keeper);}
function firstMap(){const p=getPlan(state.selectedMatch);return p.error?{}:p.blocks[0].map;}
function renderFirst(){
 const m=match(),p=getPlan(state.selectedMatch),map=p.error?{}:p.blocks[0].map,manual=m.firstLineup||{},avail=available();
 el('coachFirstPositions').innerHTML=POS.map(pos=>'<label class="coach-pos"><span class="coach-pos-label">'+LABEL[pos]+'</span><select class="coach-field-select" data-coach-position="'+pos+'" aria-label="'+LABEL[pos]+'"><option value="">Kies speelster</option>'+avail.map(q=>'<option value="'+safe(q.id)+'" '+((manual[pos]||map[pos]?.id)===q.id?'selected':'')+'>'+safe(q.name)+(q.roles.includes(ROLE[pos])?'':' · andere linie')+'</option>').join('')+'</select></label>').join('');
 const msg=el('coachLineupFeedback');msg.className='coach-status';
 if(p.error){msg.textContent=p.error;msg.classList.add('warn');return;}
 const out=POS.filter(pos=>{const q=find(manual[pos]);return q&&!q.roles.includes(ROLE[pos]);});
 msg.textContent=Object.keys(manual).length===5?'Vijf startposities vastgezet. '+(out.length?out.length+' positie(s) wijken af van de voorkeurslinie.':'Alle speelsters starten volgens hun voorkeursposities.'):'De app kiest de eerste vijf automatisch. Zodra je een positie wijzigt, worden alle vijf startposities vastgezet.';
 if(out.length)msg.classList.add('warn');
}
el('coachFirstPositions').addEventListener('change',e=>{
 const input=e.target.closest('[data-coach-position]');if(!input||!input.value)return;
 const pos=input.dataset.coachPosition,id=input.value,m=match(),p=getPlan(state.selectedMatch);
 if(p.error)return;
 const next=Object.fromEntries(POS.map(x=>[x,m.firstLineup?.[x]||p.blocks[0].map[x].id]));
 const other=POS.find(x=>x!==pos&&next[x]===id),old=next[pos];next[pos]=id;if(other)next[other]=old;
 m.firstLineup=next;invalidate();
});
el('coachRelease').addEventListener('click',()=>{delete match().firstLineup;invalidate();});
el('coachStrong').addEventListener('click',()=>{
 const m=match(),ids=Object.values(STRONG),absent=ids.filter(id=>m.absent.includes(id)||!find(id));if(absent.length){alert('Deze speelsters zijn niet allemaal aanwezig: '+absent.map(id=>find(id)?.name||id).join(', '));return;}
 if(ids.includes(m.keeper)){const keeper=state.roster.find(p=>p.id==='jackie'&&!m.absent.includes(p.id))||state.roster.find(p=>!ids.includes(p.id)&&!m.absent.includes(p.id));if(!keeper){alert('Er is geen aparte keeper beschikbaar.');return;}m.keeper=keeper.id;}
 m.firstLineup={...STRONG};if(!m.coachNotes)m.coachNotes='Sterk blok: Tess en Cato achter, Eline midden, Lidewij en Coco voor. Keeper: '+find(m.keeper).name+'.\nAandachtspunten:';
 invalidate();showView('plan',false);
});
function minuteTotals(){const sums=Object.fromEntries(state.roster.map(p=>[p.id,{name:p.name,field:0,goal:0,total:0,played:0}]));let games=0;
 for(let i=0;i<state.matches.length;i++){const p=getPlan(i);if(p.error)continue;games++;for(const q of p.pool){sums[q.id].field+=p.counts[q.id]*p.step;sums[q.id].total+=p.counts[q.id]*p.step;sums[q.id].played++;}sums[p.keeper.id].goal+=p.total;sums[p.keeper.id].total+=p.total;sums[p.keeper.id].played++;}
 return {games,rows:Object.values(sums).sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name))};
}
function renderFair(){
 const {games,rows}=minuteTotals(),used=rows.filter(q=>q.played),max=Math.max(1,...used.map(x=>x.total)),min=Math.min(...used.map(x=>x.total)),fields=used.filter(x=>x.field),range=Math.max(...fields.map(x=>x.field))-Math.min(...fields.map(x=>x.field));
 el('coachFairSummary').textContent=games+' wedstrijden gepland · verschil veldminuten '+range+' min · verschil inclusief keepen '+(max-min)+' min. '+(max===min?'De totale speeltijden zijn op dit moment gelijk.':'De app verkleint verschillen waar mogelijk; dezelfde keeper iedere wedstrijd geeft onvermijdelijk hogere totaaltijden.');
 el('coachFairRows').innerHTML=rows.map(p=>'<div class="coach-fair-row"><strong>'+safe(p.name)+'</strong><div class="coach-fair-bar" title="'+p.field+' veld + '+p.goal+' doel"><div class="coach-fair-fill" style="width:'+Math.max(1,p.total/max*100).toFixed(1)+'%"></div></div><span>'+p.total+' min</span></div>').join('');
}
function syncNotes(){const m=match();el('coachTacticFixture').textContent='Wedstrijd '+(state.selectedMatch+1)+' · '+formatKickoff(state.selectedMatch)+' · '+(m.opponent||'Tegenstander nog invullen');if(lastId!==m.fixtureId){el('coachNotes').value=m.coachNotes||'';lastId=m.fixtureId;past=[];future=[];}}
el('coachNotes').addEventListener('input',e=>{match().coachNotes=e.target.value;save();});
el('coachDownloadNotes').addEventListener('click',()=>download(new Blob([match().coachNotes||''],{type:'text/plain;charset=utf-8'}),'PW_MO14-1_notities_wedstrijd_'+(state.selectedMatch+1)+'.txt'));
el('coachCopyNotes').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(match().coachNotes||'');el('coachCopyNotes').textContent='Gekopieerd ✓';}catch(e){el('coachNotes').select();document.execCommand?.('copy');}});
let lastId=null,past=[],future=[];
const baseRender=render;render=function(){baseRender();renderFirst();renderFair();syncNotes();paintBoard();};
window.PWCoachPlus={minuteTotals,render:()=>render(),strong:STRONG};
