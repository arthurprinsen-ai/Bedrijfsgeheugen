/* PW MO14 unified coach: field mode in the same PWA and navigation, no iframe. */
(function(){
'use strict';
const PLAYERS={"Jackie":7,"Coco-Mijn":10,"Isis":2,"Cato":11,"Tess":3,"Ella":5,"Bobbi":12,"Eline":9,"Steffie":6,"Lidewij":8,"Lizzy":14,"Nine":13,"Femke":1};
const LINEUPS=[{"LV":"Nine","RV":"Coco-Mijn","AM":"Lidewij","LM":"Steffie","RM":"Lizzy","VM":"Eline","LA":"Isis","LC":"Cato","RC":"Tess","RA":"Ella","K":"Jackie"},{"LV":"Nine","RV":"Femke","AM":"Lidewij","LM":"Steffie","RM":"Lizzy","VM":"Eline","LA":"Bobbi","LC":"Cato","RC":"Tess","RA":"Ella","K":"Jackie"},{"LV":"Coco-Mijn","RV":"Femke","AM":"Lidewij","LM":"Steffie","RM":"Lizzy","VM":"Eline","LA":"Isis","LC":"Bobbi","RC":"Tess","RA":"Ella","K":"Jackie"},{"LV":"Coco-Mijn","RV":"Femke","AM":"Lidewij","LM":"Lizzy","RM":"Nine","VM":"Eline","LA":"Isis","LC":"Bobbi","RC":"Cato","RA":"Ella","K":"Jackie"},{"LV":"Coco-Mijn","RV":"Femke","AM":"Lizzy","LM":"Steffie","RM":"Nine","VM":"Eline","LA":"Isis","LC":"Tess","RC":"Cato","RA":"Bobbi","K":"Jackie"},{"LV":"Coco-Mijn","RV":"Femke","AM":"Lidewij","LM":"Steffie","RM":"Nine","VM":"Bobbi","LA":"Isis","LC":"Cato","RC":"Tess","RA":"Ella","K":"Jackie"}];
const WINDOWS=[[0,12],[12,24],[24,35],[35,47],[47,59],[59,70]];

const nums=PLAYERS, lin=LINEUPS, wins=WINDOWS;
const positions={LV:[.34,.21],RV:[.72,.21],AM:[.53,.40],LM:[.21,.54],RM:[.79,.54],VM:[.53,.65],LA:[.15,.79],LC:[.38,.79],RC:[.63,.79],RA:[.87,.79],K:[.53,.91]};
const roster=Object.keys(nums);const bench=lin.map(l=>roster.filter(x=>!Object.values(l).includes(x)));let block=Number(localStorage.getItem('pw_mo14_field_block')||0);if(!Number.isInteger(block)||block<0||block>5)block=0;
function validate(){for(let i=0;i<6;i++){const l=lin[i];if(Object.values(l).length!==11||new Set(Object.values(l)).size!==11||l.K!=='Jackie'||l.LC==='Isis'||l.RC==='Isis'||['LC','RC','LA','RA','LM','RM','AM','VM','K'].some(p=>l[p]==='Coco-Mijn')||bench[i].length!==2)throw Error('Ongeldige veldopstelling op blok '+(i+1));}}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function svgMarkup(i){const l=lin[i],x=30,y=20,w=680,h=980;let out='<svg class="field-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 740 1020" role="img" aria-label="Veldhockey-opstelling blok '+(i+1)+'; Jackie in het doel, Coco-Mijn in de voorhoede"><rect width="740" height="1020" rx="18" fill="#126f4b"/>';
for(let k=0;k<7;k++)if(k%2===0)out+='<rect x="20" y="'+(k*146)+'" width="700" height="146" fill="#106340" opacity=".35"/>';
out+='<rect x="18" y="18" width="704" height="984" rx="14" fill="none" stroke="#e8fff0" stroke-width="7"/><path d="M26 510H714 M260 20 V20 M26 270H714 M26 735H714" stroke="white" stroke-width="4" opacity=".75"/><circle cx="370" cy="510" r="95" fill="none" stroke="white" stroke-width="4" opacity=".75"/><path d="M222 30 A148 148 0 0 0 518 30 M222 990 A148 148 0 0 1 518 990" fill="none" stroke="white" stroke-width="5"/><rect x="303" y="5" width="134" height="14" fill="white"/><rect x="303" y="1001" width="134" height="14" fill="white"/>';
for(const [p,name] of Object.entries(l)){const xy=positions[p],cx=Math.round(20+xy[0]*700),cy=Math.round(20+xy[1]*980),c=['LV','RV'].includes(p)?'#ee8624':p==='K'?'#59222d':['LA','LC','RC','RA'].includes(p)?'#1760b6':'#1596a0',width=Math.max(72,name.length*13+20);
out+='<circle cx="'+cx+'" cy="'+cy+'" r="29" fill="'+c+'" stroke="white" stroke-width="4"/><text x="'+cx+'" y="'+(cy+9)+'" text-anchor="middle" fill="white" font-size="28" font-weight="800" font-family="system-ui">'+nums[name]+'</text><rect x="'+(cx-width/2)+'" y="'+(cy+30)+'" width="'+width+'" height="29" rx="7" fill="#2a1822"/><text x="'+cx+'" y="'+(cy+50)+'" text-anchor="middle" fill="white" font-size="'+(name.length>9?15:19)+'" font-weight="700" font-family="system-ui">'+esc(name)+'</text>';}
return out+'</svg>';}
function sideHtml(i){const b=bench[i],l=lin[i],next=lin[i+1],out=next?Object.values(l).filter(q=>!Object.values(next).includes(q)):[],into=next?Object.values(next).filter(q=>!Object.values(l).includes(q)):[];return '<div class="aside"><section><h3>Op de bank · blok '+(i+1)+'</h3><div class="content">'+b.map(n=>'<div class="bench-name"><span class="num">'+nums[n]+'</span>'+esc(n)+'</div>').join('')+'</div></section><section><h3>'+(next?'Wissel bij '+wins[i][1]+' minuten':'Einde wedstrijd')+'</h3><div class="content">'+(next?'<div class="change"><div class="out"><strong>Eruit</strong>'+out.map(n=>'<p>'+esc(n)+'</p>').join('')+'</div><div class="in"><strong>Erin</strong>'+into.map(n=>'<p>'+esc(n)+'</p>').join('')+'</div></div>':'<p>Jackie heeft 70 minuten gekeept.</p>')+'</div></section><section class="wide"><h3>Vaste veldafspraken</h3><div class="content tips"><b>Jackie:</b> keeper (70 min).<br><b>Coco-Mijn:</b> voorhoede, nooit in doel.<br><b>Nine:</b> begint in de spits.<br><b>Isis:</b> nooit centraal achter.<br><b>Bank:</b> twee speelsters per blok; iedereen één rustblok.</div></section></div>';}
function section(i,print){return '<section class="print-page'+(print?'':' onscreen')+'"><h2 class="block-title">Blok '+(i+1)+' · '+wins[i][0]+'–'+wins[i][1]+' min · 4-4-2 ruit</h2><div class="field-layout">'+svgMarkup(i)+sideHtml(i)+'</div></section>';}


const cards=document.getElementById('fieldCards'),all=document.getElementById('fieldPrint');
const tabButtons=[...document.querySelectorAll('[data-field-block]')];
function render(){
 validate();
 cards.innerHTML=section(block,false);
 all.innerHTML=lin.map((_,i)=>section(i,true)).join('');
 for(const button of tabButtons){
  const active=Number(button.dataset.fieldBlock)===block;
  button.setAttribute('aria-pressed',String(active));
  button.toggleAttribute('aria-current',active);
 }
 document.getElementById('fieldBlockStatus').textContent='Blok '+(block+1)+' van 6 · '+wins[block].join('–')+' min · bank: '+bench[block].join(' en ');
}
function selectBlock(i){
 block=((i%6)+6)%6;
 localStorage.setItem('pw_mo14_field_block',String(block));
 render();
}
for(const button of tabButtons)button.addEventListener('click',()=>selectBlock(Number(button.dataset.fieldBlock)));
document.getElementById('fieldPrevious').addEventListener('click',()=>selectBlock(block-1));
document.getElementById('fieldNext').addEventListener('click',()=>selectBlock(block+1));
document.getElementById('fieldPdf').addEventListener('click',()=>window.print());
document.getElementById('fieldPng').addEventListener('click',()=>{
 const svg=cards.querySelector('svg'),content=new XMLSerializer().serializeToString(svg);
 const sourceBlob=new Blob([content],{type:'image/svg+xml;charset=utf-8'}),src=URL.createObjectURL(sourceBlob),img=new Image();
 img.onload=()=>{
  const canvas=document.createElement('canvas');canvas.width=1480;canvas.height=2040;
  const context=canvas.getContext('2d');context.fillStyle='white';context.fillRect(0,0,1480,2040);context.drawImage(img,0,0,1480,2040);
  canvas.toBlob(blob=>{
   if(!blob){alert('PNG kon niet worden gemaakt. Gebruik PDF.');return}
   const url=URL.createObjectURL(blob),anchor=document.createElement('a');
   anchor.href=url;anchor.download='PW_MO14-1_Veld_blok_'+(block+1)+'_Jackie_keeper.png';anchor.click();
   setTimeout(()=>URL.revokeObjectURL(url),1500);
  },'image/png');
  URL.revokeObjectURL(src);
 };
 img.onerror=()=>{URL.revokeObjectURL(src);alert('Afbeelding niet beschikbaar. Gebruik de PDF.');};
 img.src=src;
});
const modeButtons=[...document.querySelectorAll('[data-sport-choice]')];
const previousShow=showView;
showView=function(next,scrollTop=true,addHistory=true){
 previousShow(next,scrollTop,addHistory);
 const fieldMode=next==='field';
 document.body.classList.toggle('coach-field-active',fieldMode);
 document.querySelector('.matchbar')?.classList.toggle('coach-hidden',fieldMode);
 for(const button of modeButtons){
  const selected=button.dataset.sportChoice===(fieldMode?'field':'zaal');
  button.classList.toggle('is-current',selected);
  button.setAttribute('aria-pressed',String(selected));
 }
};
window.PWCoachField={selectBlock,getSelectedBlock:()=>block,validate};
render();
showView(location.hash.slice(1)==='field'?'field':activeView,false,false);
})();
