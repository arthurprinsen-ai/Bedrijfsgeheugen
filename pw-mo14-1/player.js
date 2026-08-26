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
function getDetails(i){return{kracht:document.getElementById(`kracht${i}`)?.value||"Nog te bepalen",tweede:document.getElementById(`tweede${i}`)?.value||"Nog te bepalen",ontwikkel:document.getElementById(`ontwikkel${i}`)?.value||"Nog te bepalen",krachttekst:document.getElementById(`krachttekst${i}`)?.value||"",coachdoel:document.getElementById(`coachdoel${i}`)?.value||""}}
function page(name,i){
 const pid=PLAYER_IDS[name], d=getDraft(pid),filled=scoreCount(d.scores),legacy=legacyScoreCount(d.scores),det=d.details||{};
 const rows=METRICS.map((m,j)=>`<tr><td><b>${m.label}</b></td><td><div class="rate">${[1,2,3,4,5].map(v=>`<input type="radio" id="r${i}_${j}_${v}" name="r${i}_${j}" value="${v}" ${Number(d.scores?.[m.id])===v?"checked":""}><label for="r${i}_${j}_${v}">${v}</label>`).join("")}</div></td><td>${m.desc}</td></tr>`).join("");
 let sourceNote="";if(d.fromCentral){sourceNote=legacy===8&&filled===8?`<div class="box ok"><b>✓ Oorspronkelijke beoordeling compleet.</b> ${reviewer()?.name||"Deze beoordelaar"} heeft alle 8 onderdelen van het oorspronkelijke formulier ingevuld. De 6 later toegevoegde kenmerken zijn optionele verdieping voor het nieuwe model.</div>`:`<div class="box"><b>Bestaande beoordeling geladen uit Notion.</b> ${filled}/14 kenmerken beschikbaar voor ${reviewer()?.name||"deze beoordelaar"}.</div>`}
 return `<section id="sp${i}" class="p"><h2>${name}</h2><p class="lead"><b>Mijn beoordeling</b> — ${reviewer()?.name||"kies eerst een beoordelaar op de homepage"}.</p>${sourceNote}
 <div class="box"><b>Score:</b> 1 = nog ontwikkelen · 3 = gemiddeld · 5 = duidelijke kracht</div>
 <table class="score-table"><tr><th>Kenmerk</th><th>Score 1–5</th><th>Waar kijken we naar?</th></tr>${rows}</table>
 <h3>Coachbeeld & ontwikkeling</h3>
 <div class="fillrow"><strong>Krachtpositie</strong><select id="kracht${i}">${options(det.kracht||"Nog te bepalen")}</select></div>
 <div class="fillrow"><strong>Tweede positie</strong><select id="tweede${i}">${options(det.tweede||"Nog te bepalen")}</select></div>
 <div class="fillrow"><strong>Ontwikkelpositie</strong><select id="ontwikkel${i}">${options(det.ontwikkel||"Nog te bepalen")}</select></div>
 <div class="fillrow"><strong>Belangrijkste kracht</strong><input id="krachttekst${i}" value="${(det.krachttekst||"").replaceAll('"','&quot;')}" placeholder="Bijv. snelheid, overzicht, duel..."></div>
 <div class="fillrow"><strong>Coachdoel</strong><textarea id="coachdoel${i}" placeholder="Bijv. vóór balaanname over schouder kijken">${det.coachdoel||""}</textarea></div>
 <div class="fillrow"><strong>Observatie</strong><textarea id="obs${i}" placeholder="Wat zagen we in training/wedstrijd?">${d.observation||""}</textarea></div>
 <div class="fit" id="myfit${i}">Positieadvies wordt berekend…</div>
 <div class="sync"><button class="b" id="save${i}" onclick="saveAssessment(${i})">Mijn beoordeling opslaan</button><span id="ss${i}">${d.fromCentral?"Centrale beoordeling geladen":"Lokale draft wordt automatisch bewaard"}</span></div>
 <div class="teamview"><h3>Teambeeld</h3><div id="tv${i}">Nog geen centrale beoordelingen geladen.</div></div>
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
 if(legacy<8){e.innerHTML=`<h3>Automatisch positieadvies</h3><div class="why">Vul eerst de oorspronkelijke 8 basisscores in. Nog ${8-legacy} basisscore(s) te gaan.</div>`;return}
 const definitive=isCompleteScores(scores),f=definitive?positionFits(scores):partialPositionFits(scores),best=f[0][0],str=strongestContributors(scores,best).map(x=>x.label).join(", "),gaps=developmentGaps(scores,best).map(x=>x.label).join(", ");
 e.innerHTML=`<h3>Automatisch positieadvies</h3><div class="why"><b>${definitive?"Definitief uitgebreid advies":"Voorlopig advies op oorspronkelijke 8/8"}:</b> ${POSITION_LABEL[best]} ${f[0][1]}% · 2e ${POSITION_LABEL[f[1][0]]} ${f[1][1]}% · 3e ${POSITION_LABEL[f[2][0]]} ${f[2][1]}%</div><div>${f.slice(0,5).map(x=>`<div class="fitrow"><span>${POSITION_LABEL[x[0]]}</span><div class="track"><div class="fill" style="width:${x[1]}%"></div></div><b>${x[1]}%</b></div>`).join("")}</div><div class="why"><b>Waarom:</b> ${str||"op basis van de beschikbare scores"}.${gaps?` <b>Ontwikkelpunten:</b> ${gaps}.`:""}</div><div class="note">${definitive?"Alle 14 kenmerken zijn meegenomen.":`${filled}/14 kenmerken beschikbaar. Floris' oorspronkelijke 8/8 blijft compleet; de 6 nieuwe kenmerken kunnen het advies later verfijnen.`}</div>`;
}
