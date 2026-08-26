function reviewer(){return REVIEWERS.find(x=>x.id===activeReviewer)||null}
function setActiveReviewer(id){activeReviewer=id;localStorage.setItem(REVIEWER_KEY,id);renderReviewerSelector();renderPlayerPages();document.getElementById("activeReviewerPill").textContent="Beoordelaar: "+(reviewer()?.name||"niet gekozen");document.getElementById("reviewerOnPlayers").textContent=reviewer()?.name||"nog niet gekozen"}
function renderReviewerSelector(){const el=document.getElementById("reviewerSelector");el.innerHTML=REVIEWERS.map(r=>`<button class="rb ${r.id===activeReviewer?"on":""}" onclick="setActiveReviewer('${r.id}')">${r.name}</button>`).join("")}
function draftKey(playerId){return `${activeReviewer}__${playerId}`}
function scoreCount(scores){return METRICS.filter(m=>Number(scores?.[m.id])>=1&&Number(scores?.[m.id])<=5).length}
function latestCentralFor(playerId,reviewerId=activeReviewer){if(!reviewerId)return null;return centralAssessments.filter(a=>a.playerId===playerId&&a.reviewerId===reviewerId).sort((a,b)=>String(b.timestamp||"").localeCompare(String(a.timestamp||"")))[0]||null}
function getDraft(playerId){const local=drafts[draftKey(playerId)]||{scores:{},observation:""},central=latestCentralFor(playerId);if(central&&scoreCount(central.scores)>scoreCount(local.scores)){return{scores:{...central.scores},observation:central.observation||"",updatedAt:central.timestamp||"",fromCentral:true}}return local}
function saveDraft(playerId,scores,observation){if(!activeReviewer)return;drafts[draftKey(playerId)]={scores,observation,updatedAt:new Date().toISOString()};localStorage.setItem(LS_KEY,JSON.stringify(drafts))}
function isCompleteScores(scores){return METRICS.every(m=>Number(scores?.[m.id])>=1&&Number(scores?.[m.id])<=5)}
function scoreArray(metrics){return METRICS.map(m=>Number(metrics[m.id]||0))}
function fitFor(metrics,position){return Math.round(PROFILE[position].reduce((a,w,i)=>a+w*Number(metrics[METRICS[i].id]||0),0)/5*100)}
function positionFits(metrics){return Object.keys(PROFILE).map(k=>[k,fitFor(metrics,k)]).sort((a,b)=>b[1]-a[1])}
function strongestContributors(metrics,pos){return PROFILE[pos].map((w,i)=>({label:METRICS[i].label,value:Number(metrics[METRICS[i].id]||0),impact:w*Number(metrics[METRICS[i].id]||0)})).sort((a,b)=>b.impact-a.impact).slice(0,3)}
function developmentGaps(metrics,pos){return PROFILE[pos].map((w,i)=>({label:METRICS[i].label,value:Number(metrics[METRICS[i].id]||0),gap:w*(5-Number(metrics[METRICS[i].id]||0))})).sort((a,b)=>b.gap-a.gap).slice(0,2)}
function page(name,i){
 const pid=PLAYER_IDS[name], d=getDraft(pid),filled=scoreCount(d.scores);
 const rows=METRICS.map((m,j)=>`<tr><td><b>${m.label}</b></td><td><div class="rate">${[1,2,3,4,5].map(v=>`<input type="radio" id="r${i}_${j}_${v}" name="r${i}_${j}" value="${v}" ${Number(d.scores?.[m.id])===v?"checked":""}><label for="r${i}_${j}_${v}">${v}</label>`).join("")}</div></td><td>${m.desc}</td></tr>`).join("");
 const sourceNote=d.fromCentral?`<div class="box"><b>Bestaande beoordeling geladen uit Notion.</b> ${filled}/14 kenmerken ingevuld voor ${reviewer()?.name||"deze beoordelaar"}. Vul ontbrekende kenmerken aan en sla opnieuw op.</div>`:"";
 return `<section id="sp${i}" class="p"><h2>${name}</h2><p class="lead"><b>Mijn beoordeling</b> — ${reviewer()?.name||"kies eerst een beoordelaar op de homepage"}.</p>${sourceNote}
 <table class="score-table"><tr><th>Kenmerk</th><th>Score 1–5</th><th>Waar kijken we naar?</th></tr>${rows}</table>
 <h3>Observatie</h3><textarea id="obs${i}" placeholder="Wat zag je in training of wedstrijd?">${d.observation||""}</textarea>
 <div class="fit" id="myfit${i}">Vul alle 14 scores in.</div>
 <div class="sync"><button class="b" id="save${i}" onclick="saveAssessment(${i})">Mijn beoordeling opslaan</button><span id="ss${i}">${d.fromCentral?"Centrale beoordeling geladen":"Lokale draft wordt automatisch bewaard"}</span></div>
 <div class="teamview"><h3>Teambeeld</h3><div id="tv${i}">Nog geen centrale beoordelingen geladen.</div></div>
 </section>`;
}
function renderPlayerPages(){
 playerList.innerHTML=PLAYERS.map((n,i)=>`<a href="#sp${i+1}">${n}</a>`).join("");
 playerPages.innerHTML=PLAYERS.map((n,i)=>page(n,i+1)).join("");
 PLAYERS.forEach((n,idx)=>wirePlayer(idx+1,n));
 renderAllTeamViews();
}
function collectScores(i){const s={};METRICS.forEach((m,j)=>{const q=document.querySelector(`[name="r${i}_${j}"]:checked`);if(q)s[m.id]=Number(q.value)});return s}
function wirePlayer(i,name){
 const pid=PLAYER_IDS[name];
 document.querySelectorAll(`[name^="r${i}_"]`).forEach(e=>e.addEventListener("change",()=>{const scores=collectScores(i),obs=document.getElementById(`obs${i}`).value;saveDraft(pid,scores,obs);renderMyFit(i,scores)}));
 document.getElementById(`obs${i}`)?.addEventListener("input",e=>saveDraft(pid,collectScores(i),e.target.value));
 renderMyFit(i,getDraft(pid).scores||{});
}
function renderMyFit(i,scores){
 const e=document.getElementById(`myfit${i}`);if(!e)return;
 if(!isCompleteScores(scores)){e.innerHTML=`${scoreCount(scores)}/14 ingevuld · nog ${METRICS.length-scoreCount(scores)} score(s) invullen voor het volledige nieuwe positieadvies.`;return}
 const f=positionFits(scores),best=f[0][0],str=strongestContributors(scores,best).map(x=>x.label).join(", "),gaps=developmentGaps(scores,best).map(x=>x.label).join(", ");
 e.innerHTML=`<b>Mijn positieadvies:</b> ${POSITION_LABEL[best]} ${f[0][1]}% · 2e ${POSITION_LABEL[f[1][0]]} ${f[1][1]}%<div>${f.slice(0,5).map(x=>`<div class="fitrow"><span>${POSITION_LABEL[x[0]]}</span><div class="track"><div class="fill" style="width:${x[1]}%"></div></div><b>${x[1]}%</b></div>`).join("")}</div><div class="why"><b>Waarom:</b> ${str}. <b>Ontwikkelgaten voor deze positie:</b> ${gaps}.</div>`;
}
