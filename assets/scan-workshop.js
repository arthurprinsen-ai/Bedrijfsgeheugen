
(function(){
"use strict";
var DOMAINS=[
{id:"strategie",name:"Strategie & focus",benchmark:6.0,good:"Er is richting, eigenaarschap en een duidelijk beeld van wat belangrijk is.",friction:"Doelen en prioriteiten zijn nog niet overal vertaald naar dagelijkse keuzes.",chance:"Maak strategie zichtbaar in een compacte cockpit en koppel doelen aan acties.",plan:["Leg 3 organisatiedoelen en KPI's vast","Maak eigenaarschap per doel expliciet","Koppel lopende projecten aan de doelen"]},
{id:"kennis",name:"Kennis & continuïteit",benchmark:5.5,good:"Belangrijke kennis is al deels vindbaar en wordt actief gedeeld.",friction:"Cruciale werkwijzen en uitzonderingen zitten nog te veel in hoofden.",chance:"Borg sleutelkennis per proces, rol en klant zodat uitval minder kwetsbaar maakt.",plan:["Identificeer top 10 kennisrisico's","Leg kritieke beslisregels vast","Koppel kennis aan werkstromen"]},
{id:"processen",name:"Processen & overdracht",benchmark:5.8,good:"De belangrijkste werkstromen zijn herkenbaar en teams weten elkaar te vinden.",friction:"Overdracht, wachttijd en uitzonderingen zorgen nog voor onnodige coördinatie.",chance:"Maak de kernprocessen end-to-end zichtbaar en automatiseer de grootste overdrachtsfrictie.",plan:["Teken order-to-cash of primaire flow uit","Markeer wachttijd en dubbel werk","Automatiseer één terugkerende overdracht"]},
{id:"data",name:"Data & systemen",benchmark:5.7,good:"Er is een bruikbare digitale basis en belangrijke systemen zijn bekend.",friction:"Data staat verspreid en meerdere bronnen vragen handmatige controle of dubbele invoer.",chance:"Verbind kernsystemen en bouw één bron van waarheid voor managementsturing.",plan:["Inventariseer kernsystemen en data-eigenaren","Kies één managementdataset","Realiseer eerste koppeling of cockpit"]},
{id:"mensen",name:"Mensen & uitvoering",benchmark:6.2,good:"Mensen zijn betrokken, kennen de klant en willen verbeteren.",friction:"Verbetering leunt nog op enkele trekkers en eigenaarschap is niet overal expliciet.",chance:"Maak acties, ritme en eigenaarschap zichtbaar zodat verbeteren onderdeel wordt van het werk.",plan:["Benoem eigenaar per verbeterkans","Plan tweewekelijkse voortgang","Meet blokkades en doorlooptijd"]},
{id:"ai",name:"AI & automatisering",benchmark:4.8,good:"Er is nieuwsgierigheid naar AI en een basis om slimmer te gaan werken.",friction:"AI-gebruik is nog incidenteel of zonder duidelijke use-cases, afspraken en meetbare impact.",chance:"Selecteer drie veilige AI-use-cases en meet tijdwinst, kwaliteit en adoptie.",plan:["Selecteer 3 repetitieve taken","Leg privacy- en AI-afspraken vast","Start één meetbare pilot"]}
];
var QUESTIONS=[
["strategie","Onze belangrijkste doelen en keuzes zijn voor medewerkers duidelijk."],["strategie","We sturen periodiek op een compacte set KPI's die echt iets zegt over de strategie."],["strategie","Projecten en verbeterinitiatieven zijn zichtbaar gekoppeld aan bedrijfsdoelen."],
["kennis","Kritieke werkwijzen, uitzonderingen en beslisregels zijn vindbaar en actueel."],["kennis","Bij uitval of vertrek van een sleutelpersoon kan het werk grotendeels doorgaan."],["kennis","Nieuwe medewerkers kunnen zelfstandig leren hoe belangrijke processen werken."],
["processen","Onze belangrijkste processen zijn end-to-end duidelijk, inclusief eigenaarschap."],["processen","Overdracht tussen teams of functies veroorzaakt weinig wachttijd of herstelwerk."],["processen","Terugkerend administratief of routinematig werk is zoveel mogelijk gestandaardiseerd."],
["data","Kerngegevens worden niet onnodig dubbel ingevoerd in meerdere systemen."],["data","Managementinformatie is actueel en komt uit betrouwbare, herleidbare bronnen."],["data","Onze systemen kunnen voldoende gegevens uitwisselen om processen te ondersteunen."],
["mensen","Verbeteracties hebben een duidelijke eigenaar, deadline en opvolging."],["mensen","Teams bespreken regelmatig wat werkt, wat niet werkt en wat ze gaan aanpassen."],["mensen","Veranderingen worden daadwerkelijk geadopteerd en niet alleen technisch opgeleverd."],
["ai","We weten welke taken of processen geschikt zijn voor AI of automatisering."],["ai","Er zijn duidelijke afspraken over veilig AI-gebruik, privacy en menselijke controle."],["ai","We meten bij AI/automatisering de echte impact op tijd, kwaliteit, omzet of risico."]
];
var ANSWERS=[["Helemaal niet",1],["Meestal niet",2],["Deels / wisselend",3],["Meestal wel",4],["Helemaal wel",5]];
var idx=0,answers=[],submissionKey="",clientLogoData="";
function newSubmissionKey(){try{return "workshop-"+crypto.randomUUID()}catch(e){return "workshop-"+Date.now()+"-"+Math.random().toString(36).slice(2)}}
function el(s){return document.querySelector(s)}
function queryParams(){var p=new URLSearchParams(location.search);return {workshop:p.get("workshop")||"",partner:p.get("partner")||"",event:p.get("event")||"",utm_source:p.get("utm_source")||"",utm_medium:p.get("utm_medium")||"",utm_campaign:p.get("utm_campaign")||""}}
function show(id){["#introStep","#questionStep","#loadingStep","#resultStep"].forEach(function(x){el(x).classList.add("hide")});el(id).classList.remove("hide");window.scrollTo({top:Math.max(0,el("#scanCard").offsetTop-78),behavior:"smooth"})}
function validateIntro(){var ok=el("#company").value.trim()&&el("#name").value.trim()&&/.+@.+\..+/.test(el("#email").value.trim())&&el("#employees").value&&el("#consent").checked;el("#introError").classList.toggle("hide",!!ok);return !!ok}
el("#startBtn").addEventListener("click",function(){if(!validateIntro())return;idx=0;answers=[];submissionKey=newSubmissionKey();renderQuestion()});
function renderQuestion(){if(idx>=QUESTIONS.length){finish();return}show("#questionStep");var domain=QUESTIONS[idx][0],q=QUESTIONS[idx][1],d=DOMAINS.find(function(x){return x.id===domain});el("#stepLabel").textContent="Vraag "+(idx+1)+" van "+QUESTIONS.length;el("#domainLabel").textContent=d.name;el("#progressBar").style.width=Math.round((idx+1)/QUESTIONS.length*100)+"%";el("#questionText").textContent=q;el("#domainChips").innerHTML=DOMAINS.map(function(x){return '<span class="domain-chip '+(x.id===domain?"active":"")+'">'+x.name+"</span>"}).join("");el("#answers").innerHTML="";ANSWERS.forEach(function(a){var b=document.createElement("button");b.className="answer";b.type="button";b.innerHTML='<span class="dot">'+a[1]+"</span><span>"+a[0]+"</span>";b.onclick=function(){answers[idx]={domain:domain,q:q,value:a[1],label:a[0]};idx++;renderQuestion()};el("#answers").appendChild(b)})}
el("#backBtn").addEventListener("click",function(){if(idx<=0){show("#introStep");return}idx--;answers.splice(idx,1);renderQuestion()});
function calc(){var scores={};DOMAINS.forEach(function(d){var a=answers.filter(function(x){return x.domain===d.id});var avg=a.reduce(function(s,x){return s+x.value},0)/a.length;scores[d.id]=Math.round((((avg-1)/4)*10)*10)/10});var overall=Math.round((DOMAINS.reduce(function(s,d){return s+scores[d.id]},0)/DOMAINS.length)*10)/10;var ranked=DOMAINS.slice().sort(function(a,b){return scores[a.id]-scores[b.id]});return {scores:scores,overall:overall,top:ranked.slice(0,3),best:ranked.slice().reverse()[0]}}
function status(score){return score>=7?["Sterk vertrekpunt","good"]:score>=5.5?["Aandacht","watch"]:["Prioriteit","priority"]}
function normalizeWebsite(value){
  var v=(value||"").trim();if(!v)return "";
  try{var u=new URL(/^https?:\/\//i.test(v)?v:"https://"+v);if(!/^https?:$/.test(u.protocol))return "";return u.origin+"/"}catch(e){return ""}
}
function websiteFromEmail(){
  var mail=(el("#email").value||"").trim().toLowerCase(),m=mail.match(/@([^@]+)$/);if(!m)return "";
  var d=m[1].replace(/^www\./,""),free=["gmail.com","outlook.com","hotmail.com","live.nl","live.com","icloud.com","me.com","yahoo.com","yahoo.nl","proton.me","protonmail.com","ziggo.nl","kpnmail.nl"];
  return free.indexOf(d)>=0?"":"https://"+d+"/";
}
function clearClientLogo(){
  clientLogoData="";["#reportClientLogo","#reportClientLogo2"].forEach(function(sel){var img=el(sel);if(img){img.hidden=true;img.removeAttribute("src")}});
}
async function resolveClientLogo(){
  clearClientLogo();
  var company=el("#company").value.trim();if(!company)return "";
  var site=normalizeWebsite(el("#website").value)||websiteFromEmail();if(!site)return "";
  var origin;try{origin=new URL(site).origin}catch(e){return ""}
  var sources=[origin+"/favicon.svg",origin+"/favicon.png",origin+"/favicon.ico"];
  for(var i=0;i<sources.length;i++){
    var ok=await new Promise(function(done){
      var probe=new Image();probe.referrerPolicy="no-referrer";
      probe.onload=function(){done(probe.naturalWidth>0&&probe.naturalHeight>0)};
      probe.onerror=function(){done(false)};
      probe.src=sources[i]+"?bgscan="+Date.now();
    });
    if(ok){
      clientLogoData=sources[i];
      ["#reportClientLogo","#reportClientLogo2"].forEach(function(sel){var img=el(sel);if(img){img.src=clientLogoData;img.alt="Logo van "+company;img.hidden=false}});
      return clientLogoData;
    }
  }
  return "";
}
function finish(){show("#loadingStep");setTimeout(async function(){var r=calc();await resolveClientLogo();buildResults(r);persistScan(r);submitLead(r);show("#resultStep")},350)}
function drawRadar(id,r){var c=document.getElementById(id);if(!c||!window.Chart)return;var old=Chart.getChart(c);if(old)old.destroy();new Chart(c,{type:"radar",data:{labels:DOMAINS.map(function(d){return d.name}),datasets:[{label:"Jouw score",data:DOMAINS.map(function(d){return r.scores[d.id]}),borderColor:"#f2b800",backgroundColor:"rgba(255,201,40,.24)",pointBackgroundColor:"#f2b800",borderWidth:2.5},{label:"Benchmark",data:DOMAINS.map(function(d){return d.benchmark}),borderColor:"#a8b6c8",backgroundColor:"rgba(168,182,200,.08)",pointBackgroundColor:"#a8b6c8",borderWidth:1.5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"top",labels:{boxWidth:10,font:{size:10}}}},scales:{r:{min:0,max:10,ticks:{stepSize:2,backdropColor:"transparent",font:{size:8}},pointLabels:{font:{size:9,weight:"600"},color:"#0e2148"},grid:{color:"#dce2ea"},angleLines:{color:"#dce2ea"}}}}})}
function buildResults(r){
el("#overallScore").textContent=r.overall.toFixed(1).replace(".",",")+" / 10";drawRadar("screenRadar",r);
el("#screenOpps").innerHTML=r.top.map(function(d,i){return '<div class="opp"><span class="n">'+(i+1)+'</span><h4>'+d.name+"</h4><p>"+d.chance+"</p></div>"}).join("");
var companyLine=el("#company").value.trim()+" · "+el("#employees").value+" medewerkers"+(el("#region").value.trim()?" · "+el("#region").value.trim():"");el("#reportCompanyLine").textContent=companyLine;if(el("#reportCompanyLine2"))el("#reportCompanyLine2").textContent=companyLine;
el("#rGood").textContent=r.best.good;el("#rFriction").textContent=r.top[0].friction;el("#rChance").textContent=r.top[0].chance;el("#rOverall").textContent=r.overall.toFixed(1).replace(".",",")+" / 10";if(el("#rOverall2"))el("#rOverall2").textContent=r.overall.toFixed(1).replace(".",",")+" / 10";
el("#rScoreRows").innerHTML=DOMAINS.map(function(d){var sc=r.scores[d.id],st=status(sc),bench=d.benchmark,gap=Math.round((sc-bench)*10)/10;var note=sc>=7?d.good:(sc<5.5?d.friction:d.chance);return "<tr><td><b>"+d.name+"</b></td><td><div class=\"scorecell\"><strong>"+sc.toFixed(1).replace(".",",")+"</strong><div class=\"bar\"><div class=\"fill\" style=\"width:"+sc*10+"%\"></div></div></div></td><td><div class=\"scorecell benchmark\"><strong>"+bench.toFixed(1).replace(".",",")+"</strong><div class=\"bar\"><div class=\"fill\" style=\"width:"+bench*10+"%\"></div></div></div></td><td><span class=\"status "+st[1]+"\">"+st[0]+"</span></td><td>"+note+"</td></tr>"}).join("");
el("#rOpps").innerHTML=r.top.map(function(d,i){var days=i===1?"30–90 dagen":"30–60 dagen";return '<div class="lever-card"><div class="lever-icon">'+(i===0?"▤":i===1?"▰":"◉")+"</div><h4>"+d.name+"</h4><p>"+d.chance+'</p><div class="lever-meta"><span><small>Verwachte impact</small><b>Hoge impact</b></span><span><small>Realisatie</small><b>'+days+"</b></span></div></div>"}).join("");
var plans=[[],[],[]];r.top.forEach(function(d){plans[0].push(d.plan[0]);plans[1].push(d.plan[1]);plans[2].push(d.plan[2])});["#plan1","#plan2","#plan3"].forEach(function(sel,i){el(sel).innerHTML=plans[i].map(function(x){return "<li>"+x+"</li>"}).join("")});
var maxGap=DOMAINS.reduce(function(m,d){return Math.max(m,Math.max(0,d.benchmark-r.scores[d.id]))},0);el("#rKpis").innerHTML=[["◷","Bedrijfsgezondheid",r.overall.toFixed(1).replace(".",",")+" /10","jouw huidige bedrijfsbeeld"],["↗","Grootste benchmarkgap","+"+maxGap.toFixed(1).replace(".",","),"naar gemiddeld MKB"],["◎","Prioritaire hefbomen","3","gericht verbeteren"],["▥","Verbetercyclus","90 dagen","meten en bijsturen"]].map(function(k){return '<div class="kpi-card"><div class="kpi-head"><span>'+k[0]+"</span><b>"+k[1]+'</b></div><strong>'+k[2]+'</strong><small>'+k[3]+"</small></div>"}).join("");
setTimeout(function(){drawRadar("reportRadar",r);buildQr()},80)}
function buildQr(){var url="https://www.bedrijfsgeheugen.nl/klantportaal?source=scanrapport"+(submissionKey?"&scan="+encodeURIComponent(submissionKey):"");["#reportQr","#reportQr2"].forEach(function(sel){var box=el(sel);if(!box)return;box.innerHTML="";if(window.QRCode)new QRCode(box,{text:url,width:82,height:82,colorDark:"#0e2148",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M})})}
function portalDims(r){return {sturing:1+r.scores.strategie*.4,mensen:1+((r.scores.kennis+r.scores.mensen)/2)*.4,operatie:1+r.scores.processen*.4,analytics:1+r.scores.data*.4,quality:1+r.scores.data*.4,tech:1+r.scores.ai*.4,culture:1+r.scores.mensen*.4,governance:1+((r.scores.strategie+r.scores.ai)/2)*.4}}
function persistScan(r){
  var p=queryParams(),key=submissionKey||newSubmissionKey();submissionKey=key;
  var dimAvg=portalDims(r),datum=new Date().toISOString().slice(0,10);
  var pakket={schema_version:2,soort:"workshop_scan",submission_key:key,datum:datum,score:Math.round(r.overall*10),niveau:Math.max(1,Math.min(5,Math.round((r.overall/10)*4+1))),dimAvg:dimAvg,workshopScores:r.scores,branche:el("#sector").value.trim()||null,omvang:el("#employees").value,antwoorden:answers.map(function(a){return {vraag:a.q,antwoord:a.label,dim:a.domain,ctx:"Workshopscan"}}),attribution:p,stempel:Date.now()};
  try{localStorage.setItem("bg_scan_pakket",JSON.stringify(pakket));localStorage.setItem("bg_scan_submission_key",key)}catch(e){}
  var scanPayload={submission_key:key,canonical:"https://www.bedrijfsgeheugen.nl/scan",scan:{submission_key:key,score:pakket.score,niveau:pakket.niveau,dimAvg:Object.fromEntries(DOMAINS.map(function(d){return [d.id,Math.max(0,Math.min(5,r.scores[d.id]/2))]})),antwoorden:pakket.antwoorden,branche:pakket.branche,omvang:pakket.omvang,doel:r.top.map(function(d){return d.name}).join(" | "),datum:datum,stempel:"workshop-scan-v2",source_kind:"workshop_scan",attribution:p},portal_intake:{company_name:el("#company").value.trim(),contact_name:el("#name").value.trim(),email:el("#email").value.trim(),website:normalizeWebsite(el("#website").value)||websiteFromEmail(),employees:el("#employees").value,sector:el("#sector").value.trim(),region:el("#region").value.trim(),consent:el("#consent").checked===true}};
  fetch("/api/powerhouse-scan-ingest",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(scanPayload),keepalive:true}).catch(function(){});
}
function submitLead(r){var p=queryParams(),payload={access_key:"5d2bad12-e036-4469-b83d-f6ef1ec68e07",subject:"Workshopscan: "+el("#company").value.trim()+" — "+r.overall.toFixed(1)+"/10",from_name:"Bedrijfsgeheugen workshopscan",naam:el("#name").value.trim(),email:el("#email").value.trim(),bedrijf:el("#company").value.trim(),website:normalizeWebsite(el("#website").value)||websiteFromEmail(),medewerkers:el("#employees").value,sector:el("#sector").value.trim(),regio:el("#region").value.trim(),workshop:p.workshop,partner:p.partner,event:p.event,utm_source:p.utm_source,utm_medium:p.utm_medium,utm_campaign:p.utm_campaign,overall:r.overall,top_kansen:r.top.map(function(x){return x.name}).join(" | ")};DOMAINS.forEach(function(d){payload["score_"+d.id]=r.scores[d.id]});fetch("https://api.web3forms.com/submit",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(payload)}).catch(function(){})}
async function downloadPdf(){var btn=el("#downloadBtn");btn.disabled=true;btn.textContent="PDF maken…";try{var r=calc();drawRadar("reportRadar",r);buildQr();await new Promise(function(done){setTimeout(done,250)});if(!window.html2pdf)throw new Error("html2pdf ontbreekt");var slug=(el("#company").value||"bedrijf").replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"");await html2pdf().set({margin:0,filename:"Bedrijfsgeheugen-scanrapport-"+slug+".pdf",image:{type:"jpeg",quality:.96},html2canvas:{scale:2,useCORS:true,backgroundColor:"#ffffff",logging:false},jsPDF:{unit:"px",format:[794,1123],orientation:"portrait"},pagebreak:{mode:["css","legacy"]}}).from(el("#reportRoot")).save()}catch(e){console.error(e);el("#pdfError").classList.remove("hide")}finally{btn.disabled=false;btn.textContent="Download jouw PDF"}}
el("#downloadBtn").addEventListener("click",downloadPdf);el("#restartBtn").addEventListener("click",function(){idx=0;answers=[];submissionKey="";clearClientLogo();show("#introStep")});
})();
