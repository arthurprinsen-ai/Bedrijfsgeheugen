/* Bedrijfsgeheugen — mobile-first, accessible, evidence-aware chart explorers.
 * This is a presentation layer over the existing S/DIM/B model, not a new data source.
 * No illustrative percentages are presented as actual market measurements.
 */
(function () {
  'use strict';
  var stages = {
    state: [
      ['Handwerk','Losse bestanden en kennis in hoofden.','Documenteer een kritiek proces en wijs één eigenaar aan.'],
      ['Geordend','Afspraken bestaan, maar versies en definities lopen uiteen.','Leg één bron van waarheid en uniforme definities vast.'],
      ['Ingericht','Systemen ondersteunen het werk; overdrachten vragen nog handwerk.','Breng dubbele invoer in kaart en prioriteer een koppeling.'],
      ['Verbonden','Gegevens stromen tussen systemen en processen.','Monitor doorlooptijd, kwaliteit en eigenaarschap.'],
      ['Sturend','Signalen leiden gericht tot acties en bijsturing.','Leg signalen, besluiten en gerealiseerde effecten vast.']
    ],
    cmmi: [
      ['Initieel','Het proces is afhankelijk van individuele kennis.','Leg werkwijzen en verantwoordelijkheden vast.'],
      ['Beheerst','Afspraken zijn aanwezig, nog niet overal gelijk.','Maak afspraken herhaalbaar en toets naleving.'],
      ['Gedefinieerd','Eenduidige processen zijn beschreven.','Koppel procesdefinities aan meetpunten en brondata.'],
      ['Gemeten','Prestatie en afwijking zijn meetbaar.','Gebruik brongebonden KPI’s voor gerichte bijsturing.'],
      ['Optimaliserend','Verbeteringen worden structureel onderzocht.','Meet het effect van wijzigingen en stuur bij.']
    ],
    adoption: [
      ['Achterblijvers','Veel handwerk en weinig gedeelde data.','Maak één bron en een duidelijk verbeterdoel.'],
      ['Late majority','Reactief rapporteren en beperkte verbinding.','Bouw betrouwbare definities en elimineer kopieën.'],
      ['Early majority','BI wordt gebruikt voor terugkijken en besluiten.','Maak de stap van rapportage naar signalering.'],
      ['Early adopters','Processturing en voorspelling in praktijk.','Valideer voorspellingen met actuele uitkomsten.'],
      ['Innovators','Datagedreven sturing met actief leren.','Borg explainability, menselijke controle en effectmeting.']
    ]
  };
  var captions = {
    state:'Vijf ontwikkelfasen',
    cmmi:'Vijf indicatieve procesniveaus',
    adoption:'Illustratieve adoptiefasen'
  };
  var selections={state:null,cmmi:null,adoption:null};
  var previews={state:null,cmmi:null,adoption:null};
  var initialised=false;

  function clamp(n){return Math.max(1,Math.min(5,n));}
  function score() {
    if(typeof S==='undefined'||!S||!S.niveaus||typeof DIM==='undefined'||!Array.isArray(DIM)) return null;
    var values=DIM.map(function(d){return Number(S.niveaus[d.k]);}).filter(function(v){return Number.isFinite(v)&&v>=1&&v<=5;});
    if(!values.length) return null;
    var avg=values.reduce(function(a,b){return a+b;},0)/values.length;
    var branch=null;
    try {if(typeof B==='function'){var b=B();var v=Number(b&&b.dig);if(Number.isFinite(v)&&v>=1&&v<=5)branch=v;}} catch(ignore){}
    return {average:avg,current:clamp(Math.round(avg)),branch:branch,confirmed:!!S.scanStempel,count:values.length};
  }
  function makeButton(kind,n,info) {
    return '<button type="button" class="bgv3-stage" data-bgv3-kind="'+kind+'" data-bgv3-level="'+n+'" aria-pressed="false"'
      +' title="Niveau '+n+': '+info[1]+'">'
      +'<span class="bgv3-level" aria-hidden="true">'+n+'</span>'
      +'<span class="bgv3-stage-copy"><strong>'+info[0]+'</strong><small>Niveau '+n+'</small></span>'
      +'<span class="bgv3-indicator" aria-hidden="true"></span></button>';
  }
  function mount(svgId,kind) {
    var svg=document.getElementById(svgId);
    if(!svg) return null;
    var card=svg.closest('.kaart');
    if(!card) return null;
    var host=card.querySelector('.bgv3-host[data-bgv3-host="'+kind+'"]');
    if(!host){
      host=document.createElement('div');
      host.className='bgv3-host';
      host.setAttribute('data-bgv3-host',kind);
      svg.insertAdjacentElement('afterend',host);
    }
    card.classList.add('bgv3-card');
    svg.setAttribute('aria-hidden','true');
    svg.setAttribute('focusable','false');
    return host;
  }
  function render(kind,svgId,d) {
    var host=mount(svgId,kind);
    if(!host) return;
    var n=selections[kind];
    if(n===null)n=d.current;
    selections[kind]=clamp(n);
    var html='<div class="bgv3-summary" aria-label="Huidige score en modelcontext">'
     +'<span><b>Jij</b><strong>'+d.average.toFixed(1)+'/5</strong></span>'
     +(kind==='state'&&d.branch!==null?'<span><b>Branche-indicatie</b><strong>'+d.branch.toFixed(1)+'/5</strong></span>':'')
     +'<span><b>Streefwaarde</b><strong>4/5</strong></span></div>'
     +'<p class="bgv3-source">'+(d.confirmed?'Berekend uit de beschikbare scan-/profielwaarden.':'Voorlopige stand uit ingevulde of standaardprofielwaarden; valideer de gegevens.')
     +(kind==='adoption'?' Dit model bevat geen gemeten marktpercentages.':'')
     +(kind==='cmmi'?' Dit is geen formele CMMI-audit.':'')
     +(kind==='state'&&d.branch!==null?' De branche-indicatie is geen geverifieerd percentiel.':'')
     +'</p>'
     +'<div class="bgv3-track" role="group" aria-label="'+captions[kind]+'">'
     +stages[kind].map(function(info,i){return makeButton(kind,i+1,info);}).join('')
     +'</div>'
     +'<div class="bgv3-detail" id="bgv3-'+kind+'-detail" role="status" aria-live="polite">'
     +'<div class="bgv3-detail-head"></div><p class="bgv3-explanation"></p>'
     +'<p class="bgv3-next"></p></div>'
     +'<p class="bgv3-instruction">Beweeg met de muis over een fase, of tik op een fase om uitleg en een volgende stap te zien. Gebruik Tab en Enter op het toetsenbord.</p>';
    host.innerHTML=html;
    update(kind);
  }
  function update(kind) {
    var host=document.querySelector('.bgv3-host[data-bgv3-host="'+kind+'"]');
    if(!host)return;
    var d=score();if(!d)return;
    var selected=selections[kind]===null?d.current:selections[kind];
    var shown=previews[kind]===null?selected:previews[kind];
    var info=stages[kind][shown-1];
    host.querySelectorAll('.bgv3-stage').forEach(function(button){
      var n=Number(button.getAttribute('data-bgv3-level'));
      button.setAttribute('aria-pressed',n===selected?'true':'false');
      button.classList.toggle('bgv3-current',n===d.current);
      button.classList.toggle('bgv3-highlight',n===shown);
      var note=button.querySelector('.bgv3-indicator');
      if(note) note.textContent=n===d.current?'Jij':'';
    });
    host.querySelector('.bgv3-detail-head').textContent='Niveau '+shown+' · '+info[0]+(shown===d.current?' · jouw huidige positie':' · verkenning');
    host.querySelector('.bgv3-explanation').textContent=info[1];
    host.querySelector('.bgv3-next').textContent='Volgende stap: '+info[2];
  }
  function paint() {
    var d=score();if(!d)return;
    render('state','staat',d);
    render('cmmi','ovCmmiGraf',d);
    render('adoption','curveMini',d);
  }
  function buttonFrom(event) {
    var t=event.target;
    var b=t&&t.closest?t.closest('.bgv3-stage[data-bgv3-kind]'):null;
    return b&&b.closest('#p-overzicht')?b:null;
  }
  function buttonData(b) {
    return {kind:b.getAttribute('data-bgv3-kind'),level:clamp(Number(b.getAttribute('data-bgv3-level')))};
  }
  function events() {
    if(initialised)return;initialised=true;
    document.addEventListener('click',function(e){
      var b=buttonFrom(e);if(!b)return;
      var v=buttonData(b);selections[v.kind]=v.level;previews[v.kind]=null;update(v.kind);
    });
    document.addEventListener('pointerover',function(e){
      if(e.pointerType==='touch')return;
      var b=buttonFrom(e);if(!b)return;
      var v=buttonData(b);previews[v.kind]=v.level;update(v.kind);
    });
    document.addEventListener('pointerout',function(e){
      if(e.pointerType==='touch')return;
      var b=buttonFrom(e);if(!b||b.contains(e.relatedTarget))return;
      var v=buttonData(b);previews[v.kind]=null;update(v.kind);
    });
    document.addEventListener('focusin',function(e){
      var b=buttonFrom(e);if(!b)return;
      var v=buttonData(b);previews[v.kind]=v.level;update(v.kind);
    });
    document.addEventListener('focusout',function(e){
      var b=buttonFrom(e);if(!b||b.contains(e.relatedTarget))return;
      var v=buttonData(b);previews[v.kind]=null;update(v.kind);
    });
  }
  function start() {
    events();
    if(typeof teken==='function'&&!teken.__bgv3){
      var old=teken;
      var wrapped=function(){
        var out=old.apply(this,arguments);
        queueMicrotask(paint);
        return out;
      };
      wrapped.__bgv3=true;
      teken=wrapped;
    }
    paint();
  }
  window.BGPortalChartsV3={refresh:paint};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
  else start();
})();