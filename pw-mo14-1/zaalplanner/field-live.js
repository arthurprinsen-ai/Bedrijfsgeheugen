/* PW MO14-1: matchday substitutions, playing time and auditable corrections. */
(function(){
'use strict';
const C=window.PWFieldComplete,E=window.PWFieldEngine,L=window.PWFieldLiveEngine;
if(!C||!E||!L)throw Error('Veldcoach is niet volledig geladen');
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[c]));
const field=$('screen-field');
const card=document.createElement('section');card.className='fc-newcard fc-live-card';card.id='fieldLiveCoach';
card.innerHTML='<div class="fc-live-head"><div><span class="fc-live-eyebrow">Tijdens de wedstrijd</span><h3>Live wisselen & minuten</h3><p>Het oorspronkelijke wisselschema blijft bewaard. Registreer wat er echt gebeurt, ook als je anders wisselt.</p></div><span id="flBadge" class="fc-live-badge">Nog niet gestart</span></div>'+
'<div class="fc-quick"><button class="fc-action" type="button" id="flStart">Start deze veldwedstrijd</button><button class="fc-action muted" type="button" id="flReset" hidden>Wis live registratie</button></div>'+
'<div id="flRunning" hidden><div class="fc-live-clock"><label for="flMinute">Wedstrijdminuut</label><div class="fc-live-time"><button id="flMinus" type="button" aria-label="Eén minuut terug">−</button><input id="flMinute" type="number" min="0" max="70" step="1" inputmode="numeric" aria-label="Huidige wedstrijdminuut"><button id="flPlus" type="button" aria-label="Eén minuut verder">+</button><span>van 70</span></div><small>Geef de gespeelde minuut aan; er loopt geen automatische klok op de achtergrond.</small></div>'+
'<div class="fc-live-grid"><div><h4>Op het veld · 10 + keeper</h4><div id="flPitch" class="fc-live-pitch"></div></div><div><h4>Op de bank</h4><div id="flBench" class="fc-live-bench"></div><p id="flAdvice" class="fc-live-advice"></p></div></div>'+
'<div class="fc-live-form"><label for="flOut">Speelster eruit / positie<select id="flOut"></select></label><label for="flIn">Speelster erin vanaf bank<select id="flIn"></select></label></div>'+
'<div class="fc-quick"><button class="fc-action" type="button" id="flSwap">Registreer wissel</button><button class="fc-action muted" type="button" id="flUndo">Laatste wissel corrigeren</button><button class="fc-action muted" type="button" id="flFinish">Bevestig eindstand · 70 min</button></div>'+
'<h4>Speelminuten & wisselteller</h4><div class="fc-live-table-wrap"><table class="fc-live-table"><thead><tr><th>Speelster</th><th>Min</th><th>Erin</th><th>Eruit</th><th>Wissels</th></tr></thead><tbody id="flCounts"></tbody></table></div>'+
'<h4>Live wissellogboek</h4><ol id="flLog" class="fc-live-log"></ol>'+
'<div class="fc-quick"><button class="fc-action muted" id="flCsv" type="button">Download wissellogboek (CSV)</button></div></div>'+
'<p id="flMessage" class="fc-live-message" role="status" aria-live="polite"></p>';
const quick=field.querySelector('.fc-newcard');
if(!quick)throw Error('Live coach kan niet aan de veldpagina worden toegevoegd');
quick.insertAdjacentElement('afterend',card);
let selectedFixture=null,feedback='';
const all=()=>C.model(),match=()=>all().matches[all().selectedMatch];
function store(){
 const model=all();state.fieldCoachV2=E.sanitize(model);save();
}
function error(message){feedback=message;const p=$('flMessage');p.textContent=message;p.classList.add('fc-live-error');}
function clearMessage(){feedback='';$('flMessage').textContent='';$('flMessage').classList.remove('fc-live-error');}
function panel(){
 const m=match(),p=C.plan(),live=m.live,active=live&&live.version===1;
 const finished=active&&live.finished;
 $('flStart').hidden=active;$('flReset').hidden=!active;$('flRunning').hidden=!active;
 $('flBadge').textContent=finished?'Afgerond':active?'Live · minuut '+live.minute:'Nog niet gestart';
 $('flBadge').className='fc-live-badge'+(finished?' complete':active?' running':'');
 const id=m.fixtureId;
 if(selectedFixture!==id){selectedFixture=id;clearMessage();}
 if(!active){$('flMessage').textContent=feedback||'Start met de eerste veldopstelling. De zes geplande blokken blijven ongewijzigd.';return;}
 const v=L.replay(live,m.absent);
 if(v.error){error(v.error);return;}
 $('flMinute').value=v.minute;$('flMinute').disabled=finished;$('flMinus').disabled=finished||v.minute===0;$('flPlus').disabled=finished||v.minute===70;
 $('flSwap').disabled=finished||v.minute>=70||!v.bench.length;$('flUndo').disabled=finished||!v.events.length;$('flFinish').disabled=finished||v.minute!==70;
 $('flOut').disabled=finished;$('flIn').disabled=finished;
 const rows=[['Aanval',['LV','RV']],['Midden',['AM','LM','VM','RM']],['Verdediging',['LA','LC','RC','RA']]];
 $('flPitch').innerHTML=rows.map(([title,slots])=>'<div class="fc-live-row"><strong>'+title+'</strong><div>'+slots.map(pos=>'<span class="fc-live-token"><small>'+E.LABEL[pos]+'</small>'+esc(v.map[pos])+'</span>').join('')+'</div></div>').join('')+'<div class="fc-live-goalie">Keeper: '+esc(v.keeper)+'</div>';
 $('flBench').innerHTML=v.bench.length?v.bench.map(name=>'<span>'+esc(name)+'</span>').join(''):'<span>Geen bankspelers beschikbaar</span>';
 const suggested=L.advice(live,m.absent);
 $('flAdvice').textContent=suggested&&suggested.imbalance>0?'Wisseladvies op basis van minuten: '+suggested.out+' eruit, '+suggested.in+' erin op '+E.LABEL[suggested.position]+'.':'Minutenadvies: registreer de volgende wissel op het gewenste moment.';
 const out=$('flOut'),selection=out.value;
 out.innerHTML=E.POS.map(pos=>'<option value="'+pos+'">'+E.LABEL[pos]+' · '+esc(v.map[pos])+'</option>').join('');
 if(E.POS.includes(selection))out.value=selection;
 updateIncoming(v);
 const goalMinutes=v.goal[v.keeper]||0;
 $('flCounts').innerHTML=E.players().map(name=>{
 const total=v.field[name]+v.goal[name],inside=E.POS.some(pos=>v.map[pos]===name),goalie=v.keeper===name;
 return '<tr'+(inside||goalie?' class="fc-live-in"':'')+'><th scope="row">'+esc(name)+(goalie?' · K':'')+'</th><td>'+total+'</td><td>'+v.entered[name]+'</td><td>'+v.exited[name]+'</td><td>'+(v.entered[name]+v.exited[name])+'</td></tr>';
 }).join('');
 $('flLog').innerHTML=v.events.length?v.events.map((event,i)=>'<li>Min '+event.minute+' · '+esc(event.out)+' eruit, '+esc(event.in)+' erin ('+E.LABEL[event.position]+')</li>').join(''):'<li>Nog geen wissels. Het eerste elftal staat in het veld.</li>';
 $('flMessage').textContent=feedback||(finished?'Wedstrijd afgerond. De gespeelde minuten zijn opgenomen in het seizoensoverzicht.':'Minuut '+v.minute+' · '+v.events.length+' wissels geregistreerd · '+goalMinutes+' keepersminuten');
}
function updateIncoming(snapshot){
 const p=snapshot||L.replay(match().live,match().absent);
 if(p.error)return;
 const pos=$('flOut').value,old=$('flIn').value;
 const allowed=p.bench.filter(name=>E.hardAllowed(name,pos));
 $('flIn').innerHTML=allowed.map(name=>'<option value="'+esc(name)+'">'+esc(name)+'</option>').join('');
 if(allowed.includes(old))$('flIn').value=old;
 $('flSwap').disabled=match().live.finished||p.minute>=70||!allowed.length;
}
function update(fn){
 const m=match(),next=fn(m);
 if(next?.error){error(next.error);return;}
 clearMessage();store();C.renderAll();panel();
}
$('flStart').addEventListener('click',()=>{
 const p=C.plan(),m=match();if(p.error){error(p.error);return;}
 const next=L.start(p);if(next.error){error(next.error);return;}
 if(m.actual?.confirmed&&!confirm('Voor deze wedstrijd bestaan al bevestigde minuten. Start de live registratie? De oude minuten blijven staan totdat je de wedstrijd opnieuw afrondt.'))return;
 update(x=>{x.live=next;return next;});
});
$('flMinute').addEventListener('change',e=>{
 const n=Number(e.target.value);update(x=>{const result=L.clock(x.live,n,x.absent);if(!result.error)x.live=result;return result;});
});
for(const [id,diff] of [['flMinus',-1],['flPlus',1]])$(id).addEventListener('click',()=>{update(x=>{const r=L.clock(x.live,x.live.minute+diff,x.absent);if(!r.error)x.live=r;return r;});});
$('flOut').addEventListener('change',()=>updateIncoming());
$('flSwap').addEventListener('click',()=>{
 const pos=$('flOut').value,name=$('flIn').value;
 update(x=>{const r=L.substitute(x.live,pos,name,x.absent);if(!r.error)x.live=r;return r;});
});
$('flUndo').addEventListener('click',()=>update(x=>{const r=L.undo(x.live,x.absent);if(!r.error)x.live=r;return r;}));
$('flReset').addEventListener('click',()=>{
 if(!confirm('Alle live wissels en de wedstrijdklok van deze wedstrijd wissen? Je oorspronkelijke zesblokkenplan blijft bewaard.'))return;
 const m=match();if(m.live?.finished)m.actual=null;delete m.live;clearMessage();store();C.renderAll();panel();
});
$('flFinish').addEventListener('click',()=>{
 const m=match(),r=L.finalize(m.live,m.absent);if(r.error){error(r.error);return;}
 if(!confirm('Bevestig 70 gespeelde minuten en '+m.live.events.length+' uitgevoerde wissels? Hiermee worden de werkelijke minuten in het seizoensoverzicht vastgelegd.'))return;
 m.live=r.live;m.actual=r.actual;clearMessage();store();C.renderAll();panel();
});
$('flCsv').addEventListener('click',()=>{
 const m=match(),r=L.replay(m.live,m.absent);if(r.error){error(r.error);return;}
 const rows=['Speelster;Totaal minuten;Veldminuten;Keepersminuten;Ingewisseld;Uitgewisseld;Totaal wisselingen'];
 for(const name of E.players())rows.push([name,r.field[name]+r.goal[name],r.field[name],r.goal[name],r.entered[name],r.exited[name],r.entered[name]+r.exited[name]].join(';'));
 rows.push('');rows.push('Minuut;Uit;In;Positie');
 for(const e of r.events)rows.push([e.minute,e.out,e.in,e.position].join(';'));
 const blob=new Blob(['\ufeff'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='PW_MO14-1_veld_live_wissels_wedstrijd_'+(all().selectedMatch+1)+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
});
document.addEventListener('click',event=>{if(event.target.closest('[data-field-block], #fieldPrevious, #fieldNext, #fieldAddGame, [data-fnav], [data-sport-choice]'))queueMicrotask(panel);});
document.addEventListener('change',event=>{if(event.target.closest('#fieldMatchSelect, #fieldKeeper, #fieldAttendance, #fieldFirstPositions'))queueMicrotask(panel);});
const tabs=document.querySelectorAll('.navtab');for(const tab of tabs)tab.addEventListener('click',()=>queueMicrotask(panel));
window.PWFieldLive={render:panel,current:()=>match().live?L.replay(match().live,match().absent):null};
panel();
})();