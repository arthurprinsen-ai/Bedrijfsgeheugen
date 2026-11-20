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

const actualCard=document.createElement('section');actualCard.id='coachActualMinutes';actualCard.className='coach-card';
actualCard.innerHTML='<div class="coach-heading"><div><span class="coach-tag">Na de wedstrijd</span><h3>Werkelijk gespeelde minuten</h3><p>Controleer na de wedstrijd de minuten per speelster. Je kunt veld- en keepersminuten afzonderlijk invullen. De volgende wisselplannen houden rekening met deze bevestigde registratie.</p><p id="coachActualFixture" class="coach-current-fixture"></p></div></div><div id="coachActualTable"></div><p class="coach-status" id="coachActualFeedback" aria-live="polite"></p><div class="coach-sticky-actions"><button type="button" id="coachConfirmActual" class="coach-btn is-primary">Bevestig gespeelde minuten</button><button type="button" id="coachActualReset" class="coach-btn">Vul gepland opnieuw in</button><button type="button" id="coachRemoveActual" class="coach-btn">Verwijder registratie</button></div>';
fair.insertAdjacentElement('afterend',actualCard);

const panel=document.createElement('section');panel.className='view-panel';panel.id='screen-tactics';panel.dataset.viewPanel='tactics';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-label','Tactiek en kladblok');
panel.innerHTML='<div class="view-head"><div><div class="eyebrow">PW MO14-1</div><h2>Tactiek & kladblok</h2><p class="lead">Notities en veldtekeningen voor jouw wedstrijd. Sleep speelsters, teken looplijnen en download het resultaat.</p><p class="coach-current-fixture" id="coachTacticFixture"></p></div></div><section class="coach-card"><div class="coach-heading"><div><span class="coach-tag">Kladblaadje</span><h3>Jouw wedstrijdaantekeningen</h3><p>Leg opdrachten vast: bijvoorbeeld druk zetten, passing, strafcorners of het sterke blok.</p></div></div><div class="coach-note-row"><div><b>Sterk blok</b>Tess · Cato · Eline · Lidewij · Coco-Mijn, plus een aparte keeper.</div><div><b>Praktische tip</b>Schrijf per blok één aanwijzing. Je kunt de aantekeningen later downloaden.</div></div><label class="fieldlabel" for="coachNotes">Notities</label><textarea id="coachNotes" class="coach-notes" maxlength="5000" placeholder="Tess + Cato achter, Eline midden, Lidewij en Coco voor. Wat doen we bij balverlies?"></textarea><div class="coach-actions" style="margin-top:12px"><button type="button" class="coach-btn" id="coachDownloadNotes">Download notities</button><button type="button" class="coach-btn" id="coachCopyNotes">Kopieer tekst</button></div></section><section class="coach-card"><div class="coach-heading"><div><span class="coach-tag">Zaalveld</span><h3>Teken de spelsituatie</h3><p>Je vinger, stylus en muis werken op hetzelfde veld. Pijlen zijn looplijnen; cirkels zijn zones. Verplaats de pionnen van de opgestelde speelsters.</p></div></div><div class="coach-board-toolbar" role="toolbar" aria-label="Tekengereedschap"><button class="coach-tool is-selected" type="button" data-coach-tool="pen" aria-pressed="true">✎ Pen</button><button class="coach-tool" type="button" data-coach-tool="arrow" aria-pressed="false">➜ Pijl</button><button class="coach-tool" type="button" data-coach-tool="circle" aria-pressed="false">◯ Cirkel</button><button class="coach-tool" type="button" data-coach-tool="move" aria-pressed="false">✥ Verplaats</button><label class="coach-colors"><input type="color" id="coachColor" value="#79283e" aria-label="Penkleur"></label></div><canvas id="coachBoard" class="coach-board-canvas" width="960" height="640" aria-label="Interactief zaalhockeyveld voor tactische tekeningen"></canvas><p class="coach-board-hint">Alles wordt per wedstrijd op dit apparaat bewaard. Kies Verplaats om speelsterpionnen over het veld te schuiven.</p><div class="coach-toolbar-split"><div class="coach-actions"><button class="coach-btn" type="button" id="coachUndo">↶ Ongedaan</button><button class="coach-btn" type="button" id="coachRedo">↷ Opnieuw</button><button class="coach-btn" type="button" id="coachClear">Wis tekening</button></div><button class="coach-btn is-primary" type="button" id="coachDownloadBoard">Download veld als PNG</button></div></section><p class="coach-footnote">Geen gegevens worden gedeeld met een externe dienst. Voor gebruik op een ander apparaat download je de PNG en je notities.</p>';
plan.parentElement.appendChild(panel);
const backups=document.createElement('section');backups.id='coachBackups';backups.className='coach-card';
backups.innerHTML='<div class="coach-heading"><div><span class="coach-tag">Bewaar je werk</span><h3>Back-up & herstel</h3><p>Exporteer je complete Zaalcoach: opstellingen, keeperkeuzes, werkelijk gespeelde minuten, notities en tactiektekeningen. Bewaar het bestand bijvoorbeeld in Bestanden of Google Drive.</p></div></div><div class="coach-actions"><button type="button" id="coachExportBackup" class="coach-btn is-primary">Download volledige back-up</button><button type="button" id="coachImportBackup" class="coach-btn">Herstel vanaf back-up</button><input type="file" id="coachBackupFile" accept="application/json,.json" hidden></div><p class="coach-footnote">De gegevens staan standaard alleen op dit apparaat. Een back-up maakt het mogelijk om ze later op een andere telefoon te herstellen.</p><p id="coachBackupFeedback" class="coach-status" role="status" aria-live="polite"></p>';
panel.appendChild(backups);

document.querySelector('#screen-more .menu-list:last-of-type')?.insertAdjacentHTML('beforeend','<button class="menu-tile" type="button" data-go="tactics" data-coach-backup><span class="menu-tile-icon coach-menu-icon">⇩</span><span><b>Back-up en herstel</b><small>Neem je opstellingen, notities en tekeningen mee</small></span><span aria-hidden="true">›</span></button>');
document.addEventListener('click',e=>{if(e.target.closest('[data-coach-backup]'))requestAnimationFrame(()=>el('coachBackups').scrollIntoView({behavior:'smooth',block:'start'}));});


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
function minuteTotals(){
 const sums=Object.fromEntries(state.roster.map(p=>[p.id,{id:p.id,name:p.name,field:0,goal:0,total:0,actual:0,actualField:0,actualGoal:0,played:0}]));
 let games=0,confirmedGames=0;
 for(let i=0;i<state.matches.length;i++){
  const p=getPlan(i),m=state.matches[i];if(p.error)continue;games++;
  const confirmed=Boolean(m.actualConfirmed&&m.actualField&&m.actualGoal);if(confirmed)confirmedGames++;
  for(const q of state.roster){
   const field=p.pool.some(x=>x.id===q.id)?(p.counts[q.id]||0)*p.step:0;
   const goal=p.keeper.id===q.id?p.total:0;
   const realField=confirmed?Number(m.actualField[q.id]||0):0;
   const realGoal=confirmed?Number(m.actualGoal[q.id]||0):0;
   sums[q.id].field+=confirmed?realField:field;
   sums[q.id].goal+=confirmed?realGoal:goal;
   sums[q.id].total+=confirmed?realField+realGoal:field+goal;
   if(confirmed){sums[q.id].actual+=realField+realGoal;sums[q.id].actualField+=realField;sums[q.id].actualGoal+=realGoal;}
   if(field+goal>0||realField+realGoal>0)sums[q.id].played++;
  }
 }
 return {games,confirmedGames,rows:Object.values(sums).sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name))};
}
function renderFair(){
 const {games,confirmedGames,rows}=minuteTotals(),used=rows.filter(q=>q.played);
 const max=Math.max(1,...used.map(x=>x.total)),min=Math.min(...used.map(x=>x.total));
 const field=used.filter(x=>x.field),range=field.length?Math.max(...field.map(x=>x.field))-Math.min(...field.map(x=>x.field)):0;
 el('coachFairSummary').textContent=games+' wedstrijden in het schema · '+confirmedGames+' werkelijk geregistreerd · verschil veldminuten '+range+' min · verschil inclusief keepen '+(max-min)+' min. '+(max===min?'Iedereen heeft in dit schema evenveel minuten.':'Exact gelijke minuten zijn met de huidige keeperkeuzes en bloklengte niet mogelijk.');
 el('coachFairRows').innerHTML=rows.map(p=>'<div class="coach-fair-row"><strong>'+safe(p.name)+'</strong><div class="coach-fair-bar" title="'+p.field+' veld + '+p.goal+' doel, waarvan '+p.actual+' min bevestigd"><div class="coach-fair-fill" style="width:'+Math.max(1,p.total/max*100).toFixed(1)+'%"></div></div><span>'+p.total+' min</span></div>').join('');
 el('coachFairRows').insertAdjacentHTML('afterend','');
}
function renderActual(){
 const m=match(),p=getPlan(state.selectedMatch),confirmed=Boolean(m.actualConfirmed);
 el('coachActualFixture').textContent='Wedstrijd '+(state.selectedMatch+1)+' · '+formatKickoff(state.selectedMatch)+' · '+(m.opponent||'Tegenstander nog invullen');
 if(p.error){el('coachActualTable').innerHTML='<p>Los eerst de selectie op om speeltijd vast te leggen.</p>';el('coachActualFeedback').textContent=p.error;return;}
 el('coachActualTable').innerHTML='<div class="coach-actual-header"><span>Speelster</span><span>Veld (min)</span><span>Doel (min)</span></div>'+state.roster.map(q=>{
  const field=confirmed?Number(m.actualField?.[q.id]||0):(p.pool.some(x=>x.id===q.id)?(p.counts[q.id]||0)*p.step:0);
  const goal=confirmed?Number(m.actualGoal?.[q.id]||0):(p.keeper.id===q.id?p.total:0);
  return '<div class="coach-actual-row"><strong>'+safe(q.name)+'</strong><label><span>Veld</span><input type="number" min="0" max="'+p.total+'" step="1" inputmode="numeric" data-actual-player="'+safe(q.id)+'" data-actual-kind="field" value="'+field+'" aria-label="Veldminuten '+safe(q.name)+'"></label><label><span>Doel</span><input type="number" min="0" max="'+p.total+'" step="1" inputmode="numeric" data-actual-player="'+safe(q.id)+'" data-actual-kind="goal" value="'+goal+'" aria-label="Keepersminuten '+safe(q.name)+'"></label></div>';
 }).join('');
 el('coachActualFeedback').textContent=confirmed?'Bevestigd: deze minuten tellen mee voor de volgende wedstrijden. Je kunt ze corrigeren en opnieuw bevestigen.':'Nog niet bevestigd: dit zijn de geplande minuten. Controleer wat er daadwerkelijk gespeeld is.';
 el('coachActualFeedback').classList.toggle('warn',!confirmed);
}
function saveActual(){
 const m=match(),p=getPlan(state.selectedMatch);if(p.error)return;
 const field={},goal={};let sumField=0,sumGoal=0;
 for(const q of state.roster){
  const read=kind=>Number(el('coachActualTable').querySelector('[data-actual-player="'+q.id+'"][data-actual-kind="'+kind+'"]')?.value);
  const f=read('field'),g=read('goal');
  if(!Number.isInteger(f)||!Number.isInteger(g)||f<0||g<0||f+g>p.total){el('coachActualFeedback').textContent='Ongeldige minuten bij '+q.name+': maximaal '+p.total+' minuten totaal per speelster.';el('coachActualFeedback').classList.add('warn');return;}
  if(m.absent.includes(q.id)&&(f+g)>0){el('coachActualFeedback').textContent=q.name+' staat als afwezig vermeld. Pas eerst de selectie aan.';el('coachActualFeedback').classList.add('warn');return;}
  field[q.id]=f;goal[q.id]=g;sumField+=f;sumGoal+=g;
 }
 if(sumField!==5*p.total||sumGoal!==p.total){el('coachActualFeedback').textContent='Controleer de optelling: '+sumField+'/'+(5*p.total)+' veldminuten en '+sumGoal+'/'+p.total+' keepersminuten. Niet opgeslagen.';el('coachActualFeedback').classList.add('warn');return;}
 m.actualField=field;m.actualGoal=goal;m.actualConfirmed=true;m.actualRecordedAt=new Date().toISOString();
 invalidate();showView('stats',false);
}
el('coachConfirmActual').addEventListener('click',saveActual);
el('coachActualReset').addEventListener('click',()=>{delete match().actualConfirmed;delete match().actualField;delete match().actualGoal;invalidate();showView('stats',false);});
el('coachRemoveActual').addEventListener('click',()=>{if(!match().actualConfirmed)return;if(!confirm('Verwijder de geregistreerde minuten van deze wedstrijd?'))return;delete match().actualConfirmed;delete match().actualField;delete match().actualGoal;delete match().actualRecordedAt;invalidate();showView('stats',false);});

function syncNotes(){const m=match();el('coachTacticFixture').textContent='Wedstrijd '+(state.selectedMatch+1)+' · '+formatKickoff(state.selectedMatch)+' · '+(m.opponent||'Tegenstander nog invullen');if(lastId!==m.fixtureId){el('coachNotes').value=m.coachNotes||'';lastId=m.fixtureId;past=[];future=[];}}
el('coachNotes').addEventListener('input',e=>{match().coachNotes=e.target.value;save();});
el('coachDownloadNotes').addEventListener('click',()=>download(new Blob([match().coachNotes||''],{type:'text/plain;charset=utf-8'}),'PW_MO14-1_notities_wedstrijd_'+(state.selectedMatch+1)+'.txt'));
el('coachCopyNotes').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(match().coachNotes||'');el('coachCopyNotes').textContent='Gekopieerd ✓';}catch(e){el('coachNotes').select();document.execCommand?.('copy');}});
let lastId=null,past=[],future=[];
/* Tactiekbord — pointer-based canvas with saved strokes and player tokens. */
const board=el('coachBoard'),ctx=board.getContext('2d'),W=960,H=640;
let tool='pen',color='#79283e',drag=null;
function boardState(){const m=match();if(!m.coachBoard)m.coachBoard={strokes:[],tokens:{}};if(!Array.isArray(m.coachBoard.strokes))m.coachBoard.strokes=[];if(!m.coachBoard.tokens)m.coachBoard.tokens={};return m.coachBoard;}
function pieces(){const p=getPlan(state.selectedMatch);if(p.error)return [];
 const pts={AL:[.31,.72],AR:[.69,.72],M:[.5,.51],VL:[.31,.27],VR:[.69,.27],K:[.5,.91]},b=boardState(),out=[];
 for(const pos of [...POS,'K']){const q=pos==='K'?p.keeper:p.blocks[0].map[pos];if(!q)continue;let xy=b.tokens[q.id]||pts[pos];out.push({id:q.id,name:q.name,pos,x:xy[0],y:xy[1]});}
 return out;
}
function xyToCanvas(p){return [p[0]*W,p[1]*H];}
function markStroke(st){
 const pts=(st.points||[]).map(xyToCanvas);if(!pts.length)return;
 ctx.save();ctx.strokeStyle=st.color||'#79283e';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=st.width||6;ctx.lineCap='round';ctx.lineJoin='round';
 if(st.tool==='circle'&&pts.length>=2){const a=pts[0],b=pts[pts.length-1];ctx.beginPath();ctx.ellipse((a[0]+b[0])/2,(a[1]+b[1])/2,Math.max(2,Math.abs(a[0]-b[0])/2),Math.max(2,Math.abs(a[1]-b[1])/2),0,0,Math.PI*2);ctx.stroke();}
 else{ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);pts.slice(1).forEach(p=>ctx.lineTo(p[0],p[1]));ctx.stroke();
 if(st.tool==='arrow'&&pts.length>=2){const a=pts[0],b=pts[pts.length-1],angle=Math.atan2(b[1]-a[1],b[0]-a[0]);ctx.beginPath();ctx.moveTo(...b);ctx.lineTo(b[0]-23*Math.cos(angle-.55),b[1]-23*Math.sin(angle-.55));ctx.lineTo(b[0]-23*Math.cos(angle+.55),b[1]-23*Math.sin(angle+.55));ctx.fill();}}
 ctx.restore();
}
function paintBoard(){
 if(!ctx)return;ctx.clearRect(0,0,W,H);ctx.fillStyle='#f4f9f5';ctx.fillRect(0,0,W,H);ctx.fillStyle='#dceee3';ctx.fillRect(52,38,856,564);
 ctx.lineWidth=6;ctx.strokeStyle='#6b9a7a';ctx.strokeRect(52,38,856,564);
 ctx.lineWidth=4;ctx.strokeStyle='white';ctx.beginPath();ctx.moveTo(52,320);ctx.lineTo(908,320);ctx.stroke();
 ctx.beginPath();ctx.ellipse(480,320,82,82,0,0,Math.PI*2);ctx.stroke();
 ctx.strokeStyle='#7bb696';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(480,90,150,108,0,0,Math.PI);ctx.stroke();ctx.beginPath();ctx.ellipse(480,550,150,108,0,Math.PI,Math.PI*2);ctx.stroke();
 ctx.fillStyle='#4c8264';ctx.font='bold 21px system-ui';ctx.fillText('AANVAL',70,75);ctx.fillText('VERDEDIGING',70,585);
 boardState().strokes.forEach(markStroke);if(drag?.draft)markStroke(drag.draft);
 for(const p of pieces()){const x=p.x*W,y=p.y*H;ctx.beginPath();ctx.arc(x,y,24,0,Math.PI*2);ctx.fillStyle=p.pos==='K'?'#202d54':'#71263d';ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=4;ctx.stroke();ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.fillStyle='white';ctx.fillText(p.pos,x,y+5);ctx.fillStyle='#26372d';ctx.fillText(p.name,x,y+44);ctx.textAlign='start';}
}
function boardXY(e){const r=board.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))];}
function remember(){past.push(JSON.stringify(boardState()));if(past.length>40)past.shift();future=[];}
board.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;e.preventDefault();const pt=boardXY(e);try{board.setPointerCapture?.(e.pointerId)}catch(err){/* Some iOS/synthetic pointer streams cannot be captured; drawing still proceeds. */}
 if(tool==='move'){const hit=pieces().find(p=>Math.hypot(p.x-pt[0],p.y-pt[1])<.06);if(!hit)return;remember();drag={id:e.pointerId,move:hit.id};}
 else{remember();drag={id:e.pointerId,draft:{tool,color,points:[pt],width:tool==='pen'?6:7}};}paintBoard();
});
board.addEventListener('pointermove',e=>{
 if(!drag||e.pointerId!==drag.id)return;e.preventDefault();const pt=boardXY(e);
 if(drag.move)boardState().tokens[drag.move]=pt;
 else if(drag.draft.tool==='pen')drag.draft.points.push(pt);
 else drag.draft.points=[drag.draft.points[0],pt];
 paintBoard();
});
function finishPointer(e){if(!drag||e.pointerId!==drag.id)return;e.preventDefault();if(drag.draft)boardState().strokes.push(drag.draft);drag=null;save();paintBoard();}
board.addEventListener('pointerup',finishPointer);board.addEventListener('pointercancel',finishPointer);
document.querySelectorAll('[data-coach-tool]').forEach(b=>b.addEventListener('click',()=>{
 tool=b.dataset.coachTool;document.querySelectorAll('[data-coach-tool]').forEach(q=>{q.classList.toggle('is-selected',q===b);q.setAttribute('aria-pressed',String(q===b));});board.style.cursor=tool==='move'?'grab':'crosshair';
}));
el('coachColor').addEventListener('input',e=>color=e.target.value);
el('coachUndo').addEventListener('click',()=>{if(!past.length)return;future.push(JSON.stringify(boardState()));match().coachBoard=JSON.parse(past.pop());save();paintBoard();});
el('coachRedo').addEventListener('click',()=>{if(!future.length)return;past.push(JSON.stringify(boardState()));match().coachBoard=JSON.parse(future.pop());save();paintBoard();});
el('coachClear').addEventListener('click',()=>{if(!confirm('Wis alle tekeningen en verplaatste speelsters voor deze wedstrijd?'))return;remember();match().coachBoard={strokes:[],tokens:{}};save();paintBoard();});
el('coachDownloadBoard').addEventListener('click',()=>{paintBoard();board.toBlob(blob=>{if(blob)download(blob,'PW_MO14-1_tactiek_wedstrijd_'+(state.selectedMatch+1)+'.png');},'image/png');});

/* Explicit portable offline backup: no external transmission and no silent overwrite. */
const BACKUP_MAGIC='PW-MO14-1-ZAALCOACH';
el('coachExportBackup').addEventListener('click',()=>{
 const data=JSON.stringify({app:BACKUP_MAGIC,version:1,exportedAt:new Date().toISOString(),state},null,2);
 download(new Blob([data],{type:'application/json'}),'PW_MO14-1_Zaalcoach_backup_'+new Date().toISOString().slice(0,10)+'.json');
 el('coachBackupFeedback').textContent='Back-up aangemaakt. Bewaar dit bestand op een veilige plek.';
});
el('coachImportBackup').addEventListener('click',()=>el('coachBackupFile').click());
el('coachBackupFile').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 const feedback=el('coachBackupFeedback');
 try{
  if(file.size>5*1024*1024)throw Error('De back-up is groter dan 5 MB.');
  const data=JSON.parse(await file.text()),next=data?.state;
  if(data.app!==BACKUP_MAGIC||data.version!==1||!next||!Array.isArray(next.roster)||!Array.isArray(next.matches))throw Error('Dit is geen geldige Zaalcoach-back-up.');
  if(next.roster.length<6||next.roster.length>12||next.matches.length<1||next.matches.length>80)throw Error('Onjuist aantal speelsters of wedstrijden.');
  const ids=new Set(next.roster.map(q=>q.id));
  if(ids.size!==next.roster.length||next.roster.some(q=>typeof q.id!=='string'||!/^[a-z0-9_-]{1,60}$/i.test(q.id)||typeof q.name!=='string'||q.name.length>40||!Array.isArray(q.roles)||q.roles.some(x=>!['A','M','V'].includes(x))))throw Error('Ongeldige speelsters of posities.');
  const fixtureIds=new Set(next.matches.map(m=>m.fixtureId));
  if(fixtureIds.size!==next.matches.length||next.matches.some(m=>!m||typeof m.fixtureId!=='string'||!ids.has(m.keeper)||!Array.isArray(m.absent)||m.absent.some(id=>!ids.has(id))||typeof m.date!=='string'||m.date.length>10||typeof m.opponent!=='string'||m.opponent.length>80))throw Error('Ongeldige wedstrijdgegevens.');
  for(const m of next.matches){
   if(m.firstLineup){const pinned=Object.values(m.firstLineup);if(pinned.some(id=>!ids.has(id))||new Set(pinned).size!==pinned.length)throw Error('Ongeldige vastgezette startopstelling.');}
   if(m.actualConfirmed){if(!m.actualField||!m.actualGoal)throw Error('Onvolledig gespeelde-minutenoverzicht.');for(const id of ids){const a=Number(m.actualField[id]||0),b=Number(m.actualGoal[id]||0);if(!Number.isFinite(a)||!Number.isFinite(b)||a<0||b<0||a+b>120)throw Error('Ongeldige gespeelde minuten.');}}
  }
  if(!confirm('Herstel '+next.matches.length+' wedstrijden en '+next.roster.length+' speelsters uit de back-up? De huidige gegevens op dit apparaat worden vervangen.')){feedback.textContent='Herstellen geannuleerd.';return;}
  state=next;state.selectedMatch=Math.max(0,Math.min(Number(state.selectedMatch)||0,state.matches.length-1));
  cache={};save();lastId=null;render();window.PWFieldComplete?.renderAll?.();showView('home',false);
  feedback.textContent='Back-up succesvol hersteld.';
 }catch(err){feedback.textContent='Herstellen geweigerd: '+err.message;feedback.classList.add('warn');}
 finally{e.target.value='';}
});

const baseRender=render;render=function(){baseRender();renderFirst();renderFair();renderActual();syncNotes();paintBoard();};
cache={};render();
window.PWCoachPlus={minuteTotals,render:()=>render(),strong:STRONG};
})();
