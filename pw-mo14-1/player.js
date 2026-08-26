function reviewer(){return REVIEWERS.find(x=>x.id===activeReviewer)||null}
function setActiveReviewer(id){activeReviewer=id;localStorage.setItem(REVIEWER_KEY,id);renderReviewerSelector();renderPlayerPages();document.getElementById("activeReviewerPill").textContent="Beoordelaar: "+(reviewer()?.name||"niet gekozen");document.getElementById("reviewerOnPlayers").textContent=reviewer()?.name||"nog niet gekozen"}
function renderReviewerSelector(){const el=document.getElementById("reviewerSelector");el.innerHTML=REVIEWERS.map(r=>`<button class="rb ${r.id===activeReviewer?"on":""}" onclick="setActiveReviewer('${r.id}')">${r.name}</button>`).join("")}
function draftKey(playerId){return `${activeReviewer}__${playerId}`}
function scoreCount(scores){return METRICS.filter(m=>Number(scores?.[m.id])>=1&&Number(scores?.[m.id])<=5).length}
function legacyScoreCount(scores){return METRICS.slice(0,8).filter(m=>Number(scores?.[m.id])>=1&&Number(scores?.[m.id])<=5).length}
function latestCentralFor(playerId,reviewerId=activeReviewer){if(!reviewerId)return null;return centralAssessments.filter(a=>a.playerId===playerId&&a.reviewerId===reviewerId).sort((a,b)=>String(b.timestamp||"").localeCompare(String(a.timestamp||"")))[0]||null}
function getDraft(playerId){const local=drafts[draftKey(playerId)]||{scores:{},observation:"",details:{}},central=latestCentralFor(playerId);if(central&&scoreCount(central.scores)>scoreCount(local.scores)){return{scores:{...central.scores},observation:central.observation||"",details:local.details||{},updatedAt:central.timestamp||"",fromCentral:true}}return{...local,details:local.details||{}}}
function saveDraft(playerId,scores,observation,details){if(!activeReviewer)return;const old=drafts[draftKey(playerId)]||{};drafts[draftKey(playerId)]={scores,observation,details:details||old.details||{},updatedAt:new Date().toISOString()};localStorage.setItem(LS_KEY,JSON.stringify(drafts))}
function isCompleteScores(scores){return METRICS.every(m=>Number(scores?.[m.id])>=1&&Number(scores?.[m.id])<=5)}
function scoreArray(metrics){return METRICS.map(m=>Number(metrics[m.id]||0))}
function fitFor(metrics,position){return Math.round(PROFILE[position].reduce((a,w,i)=>a+w*Number(metrics[METRICS[i].id]||0),0)/5*100)}
function positionFits(metrics){return Object.keys(PROFILE).map(k=>[k,fitFor(metrics,k)]).sort((a,b)=>b[1]-a[1])}
function strongestContributors(metrics,pos){return PROFILE[pos].map((w,i)=>({label:METRICS[i].label,value:Number(metrics[METRICS[i].id]||0),impact:w*Number(metrics[METRICS[i].id]||0)})).filter(x=>x.value>0).sort((a,b)=>b.impact-a.impact).slice(0,3)}
function developmentGaps(metrics,pos){return PROFILE[pos].map((w,i)=>({label:METRICS[i].label,value:Number(metrics[METRICS[i].id]||0),gap:xGap(w,metrics[METRICS[i].id])})).filter(x=>x.value>0).sort((a,b)=>b.gap-a.gap).slice(0,2)}
function xGap(w,v){v=Number(v||0);return v>0?w*(5-v):0}
const POSITION_OPTIONS=["Nog te bepalen","Keeper","Linksachter","Centraal achter","Rechtsachter","Linksmidden","Centraal midden","Rechtsmidden","Linksvoor","Centrumspits","Rechtsvoor"];
function options(selected){return POSITION_OPTIONS.map(x=>`<option ${x===selected?"selected":""}>${x}</option>`).join("")}
function htmlText(v){return String(v||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"','&quot;')}
function getDetails(i){return{kracht:document.getElementById(`kracht${i}`)?.value||"Nog te bepalen",tweede:document.getElementById(`tweede${i}`)?.value||"Nog te bepalen",ontwikkel:document.getElementById(`ontwikkel${i}`)?.value||"Nog te bepalen",krachttekst:document.getElementById(`krachttekst${i}`)?.value||"",coachdoel:document.getElementById(`coachdoel${i}`)?.value||""}}
function metricRow(m,j,i,scores,showDesc=false){return `<tr><td><b>${m.label}</b></td><td><div class="rate">${[1,2,3,4,5].map(v=>`<input type="radio" id="r${i}_${j}_${v}" name="r${i}_${j}" value="${v}" ${Number(scores?.[m.id])===v?"checked":""}><label for="r${i}_${j}_${v}">${v}</label>`).join("")}</div></td>${showDesc?`<td>${m.desc}</td>`:""}</tr>`}
function page(name,i){
 const pid=PLAYER_IDS[name],d=getDraft(pid),filled=scoreCount(d.scores),legacy=legacyScoreCount(d.scores),det=d.details||{};
 const baseRows=METRICS.slice(0,8).map((m,j)=>metricRow(m,j,i,d.scores)).join("");
 const deepRows=METRICS.slice(8).map((m,k)=>metricRow(m,k+8,i,d.scores,true)).join("");
 const deepFilled=Math.max(0,filled-legacy),deepOpen=deepFilled>0?" open":"";
 let sourceNote="";
 if(d.fromCentral){sourceNote=legacy===8&&filled===8?`<div class="source-card complete"><b>✓ Oorspronkelijke beoordeling compleet</b><span>${reviewer()?.name||"Deze beoordelaar"} heeft alle 8 onderdelen van het oorspronkelijke formulier ingevuld.</span><small>De 6 later toegevoegde kenmerken zijn verdieping en veranderen deze status niet.</small></div>`:`<div class="source-card"><b>Bestaande beoordeling uit Notion</b><span>${filled}/14 kenmerken beschikbaar voor ${reviewer()?.name||"deze beoordelaar"}.</span></div>`}
 return `<section id="sp${i}" class="p player-page">
 <div class="player-head"><div><span class="eyebrow">Speelster</span><h2>${name}</h2><p class="lead"><b>Mijn beoordeling</b> · ${reviewer()?.name||"kies eerst een beoordelaar op de homepage"}</p></div><a class="mini-home" href="#spelers">← Alle speelsters</a></div>
 ${sourceNote}
 <div class="score-key"><b>Score</b><span>1 = ontwikkelen</span><span>3 = gemiddeld</span><span>5 = duidelijke kracht</span></div>
 <div class="section-title"><span>1</span><div><b>Basisbeoordeling</b><small>De oorspronkelijke 8 hockeykenmerken</small></div><strong>${legacy}/8</strong></div>
 <div class="table-card"><table class="score-table base-score-table"><tr><th>Kenmerk</th><th>Score 1–5</th></tr>${baseRows}</table></div>
 <div class="fit" id="myfit${i}">Positieadvies wordt berekend…</div>
 <div class="section-title"><span>2</span><div><b>Coachbeeld & ontwikkeling</b><small>Van score naar concrete positie en coachfocus</small></div></div>
 <div class="coach-fields">
  <div class="fillrow"><strong>Krachtpositie</strong><select id="kracht${i}">${options(det.kracht||"Nog te bepalen")}</select></div>
  <div class="fillrow"><strong>Tweede positie</strong><select id="tweede${i}">${options(det.tweede||"Nog te bepalen")}</select></div>
  <div class="fillrow"><strong>Ontwikkelpositie</strong><select id="ontwikkel${i}">${options(det.ontwikkel||"Nog te bepalen")}</select></div>
  <div class="fillrow"><strong>Belangrijkste kracht</strong><input id="krachttekst${i}" value="${htmlText(det.krachttekst)}" placeholder="Bijv. snelheid, overzicht, duel..."></div>
  <div class="fillrow"><strong>Coachdoel</strong><textarea id="coachdoel${i}" placeholder="Bijv. vóór balaanname over schouder kijken">${htmlText(det.coachdoel)}</textarea></div>
  <div class="fillrow"><strong>Observatie</strong><textarea id="obs${i}" placeholder="Wat zagen we in training/wedstrijd?">${htmlText(d.observation)}</textarea></div>
 </div>
 <details class="deep-review"${deepOpen}><summary><span><b>Verdiepende beoordeling</b><small>6 nieuwere kenmerken voor een nauwkeuriger team- en positieadvies</small></span><strong>${deepFilled}/6</strong></summary><div class="deep-body"><table class="score-table"><tr><th>Kenmerk</th><th>Score 1–5</th><th>Waar kijken we naar?</th></tr>${deepRows}</table></div></details>
 <div class="sync assessment-actions"><button class="b" id="save${i}" onclick="saveAssessment(${i})">Uitgebreide beoordeling opslaan</button><span id="ss${i}">${d.fromCentral?"Centrale beoordeling geladen":"Lokale draft wordt automatisch bewaard"}</span></div>
 <div class="teamview"><div class="section-title"><span>3</span><div><b>Teambeeld</b><small>Gecombineerde beoordeling van alle begeleiders</small></div></div><div id="tv${i}">Nog geen centrale beoordelingen geladen.</div></div>
 <div class="bottom-nav"><a href="#spelers">← Alle speelsters</a><a href="#home">⌂ Hoofdmenu</a></div>
 </section>`;
}
function renderPlayerPages(){playerList.innerHTML=PLAYERS.map((n,i)=>`<a href="#sp${i+1}">${n}</a>`).join("");playerPages.innerHTML=PLAYERS.map((n,i)=>page(n,i+1)).join("");PLAYERS.forEach((n,idx)=>wirePlayer(idx+1,n));renderAllTeamViews()}
function collectScores(i){const s={};METRICS.forEach((m,j)=>{const q=document.querySelector(`[name="r${i}_${j}"]:checked`);if(q)s[m.id]=Number(q.value)});return s}
function saveCurrentDraft(i,name){const pid=PLAYER_IDS[name],scores=collectScores(i),obs=document.getElementById(`obs${i}`)?.value||"";saveDraft(pid,scores,obs,getDetails(i));renderMyFit(i,scores)}
function wirePlayer(i,name){
 document.querySelectorAll(`[name^="r${i}_"]`).forEach(e=>e.addEventListener("change",()=>saveCurrentDraft(i,name)));
 [`obs${i}`,`kracht${i}`,`tweede${i}`,`ontwikkel${i}`,`krachttekst${i}`,`coachdoel${i}`].forEach(id=>document.getElementById(id)?.addEventListener("input",()=>saveCurrentDraft(i,name)));
 [`kracht${i}`,`tweede${i}`,`ontwikkel${i}`].forEach(id=>document.getElementById(id)?.addEventListener("change",()=>saveCurrentDraft(i,name)));
 renderMyFit(i,getDraft(PLAYER_IDS[name]).scores||{});
}
function renderMyFit(i,scores){
 const e=document.getElementById(`myfit${i}`);if(!e)return;const legacy=legacyScoreCount(scores),filled=scoreCount(scores);
 if(legacy<8){e.innerHTML=`<div class="fit-title"><span>⚡</span><div><h3>Automatisch positieadvies</h3><small>Vul de 8 basisscores in</small></div></div><div class="why">Nog <b>${8-legacy}</b> basisscore(s) te gaan. Daarna verschijnt direct het eerste positieadvies.</div>`;return}
 const definitive=isCompleteScores(scores),f=definitive?positionFits(scores):partialPositionFits(scores),best=f[0][0],str=strongestContributors(scores,best).map(x=>x.label).join(", "),gaps=developmentGaps(scores,best).map(x=>x.label).join(", ");
 e.innerHTML=`<div class="fit-title"><span>⚡</span><div><h3>Automatisch positieadvies</h3><small>${definitive?"Uitgebreid profiel 14/14":"Oorspronkelijke beoordeling 8/8"}</small></div><em>${definitive?"DEFINITIEF":"VOORLOPIG"}</em></div><div class="best-position"><small>Beste fit</small><b>${POSITION_LABEL[best]}</b><strong>${f[0][1]}%</strong></div><div>${f.slice(0,5).map(x=>`<div class="fitrow"><span>${POSITION_LABEL[x[0]]}</span><div class="track"><div class="fill" style="width:${x[1]}%"></div></div><b>${x[1]}%</b></div>`).join("")}</div><div class="why"><b>Waarom:</b> ${str||"op basis van de beschikbare scores"}.${gaps?` <b>Ontwikkelpunten:</b> ${gaps}.`:""}</div><div class="note">${definitive?"Alle 14 kenmerken zijn meegenomen.":`${filled}/14 kenmerken beschikbaar. De oorspronkelijke 8/8-beoordeling is compleet; de 6 verdiepende kenmerken kunnen het advies later verfijnen.`}</div>`;
}
