/** Living Business Interface: one progressive readout for existing SVG marks.
 * Original InsightLens owns action navigation; this module performs NO data writes.
 */
const DATA_POINT='.v2-data-point[tabindex],.v2-data-bar[tabindex],.v2-data-segment[tabindex]';
const readMark=target=>target?.closest?.(DATA_POINT);
function describeMark(mark){
 const title=mark?.querySelector('title')?.textContent?.trim()||mark?.getAttribute('aria-label')||'';
 return title.slice(0,320);
}
function reveal(mark){
 const figure=mark?.closest('figure.v2visual');
 if(!figure||figure.closest('[data-portal-sample-only="true"],[hidden],[aria-hidden="true"]'))return;
 const value=describeMark(mark);
 if(!value)return;
 let readout=figure.querySelector('.bg-li-chart-readout');
 if(!readout){
  readout=document.createElement('p');readout.className='bg-li-chart-readout';
  readout.setAttribute('role','status');readout.setAttribute('aria-live','polite');
  const label=document.createElement('strong');label.textContent='Geselecteerd';
  const content=document.createElement('span');content.className='bg-li-chart-value';
  readout.append(label,content);figure.append(readout);
 }
 readout.querySelector('.bg-li-chart-value').textContent=value;
}
function moveWithinChart(event,mark){
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
 const figure=mark.closest('figure.v2visual');if(!figure)return;
 const marks=[...figure.querySelectorAll(DATA_POINT)].filter(item=>item.getClientRects().length);
 const current=marks.indexOf(mark);if(current<0)return;
 const next=event.key==='Home'?0:event.key==='End'?marks.length-1:
   (current+(event.key==='ArrowRight'?1:-1)+marks.length)%marks.length;
 event.preventDefault();marks[next].focus();reveal(marks[next]);
}
function init(){
 document.documentElement.classList.add('portal-living');
 document.addEventListener('focusin',event=>{const mark=readMark(event.target);if(mark)reveal(mark)});
 document.addEventListener('keydown',event=>{const mark=readMark(event.target);if(mark)moveWithinChart(event,mark)});
 document.addEventListener('pointerdown',event=>{const mark=readMark(event.target);if(mark)reveal(mark)},{passive:true});
}
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
}
