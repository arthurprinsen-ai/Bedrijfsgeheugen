/**
 * Visuele modellen van Portal V2.
 *
 * Het vorige portaal tekende 57 SVG's. Die zijn hier teruggebracht als
 * herbruikbare, thema-volgende componenten. Elke functie krijgt uitsluitend
 * doorgerekende klantdata en geeft SVG-markup terug; er wordt hier niets
 * verzonnen en niets afgerond dat de betekenis verandert.
 */

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const num=(value,digits=0)=>new Intl.NumberFormat('nl-NL',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(Number(value)||0);
const n=value=>Number.isFinite(Number(value))?Number(value):0;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,n(value)));

const ACCENT='var(--saas-accent,#4f46e5)';
const SOFT='var(--saas-accent-2,#0ea5e9)';
const MINT='var(--saas-mint,#10b981)';
const AMBER='var(--saas-amber,#f59e0b)';
const LINE='var(--saas-line,#e7e9f6)';

function frame(viewBox,title,body){
  return `<figure class="v2visual"><figcaption>${esc(title)}</figcaption><svg viewBox="${viewBox}" role="img" aria-label="${esc(title)}" preserveAspectRatio="xMidYMid meet">${body}</svg></figure>`;
}

/** Radarprofiel over de bedrijfsonderdelen, schaal 1–5. */
export function radar(items=[],{title='Profiel per onderdeel',max=5}={}){
  const points=items.filter(item=>item&&item.label!=null);
  if(points.length<3)return '';
  const cx=150,cy=150,r=110;
  const angle=index=>(Math.PI*2*index)/points.length-Math.PI/2;
  const coord=(index,value)=>{const rad=r*clamp(value,0,max)/max;return [cx+Math.cos(angle(index))*rad,cy+Math.sin(angle(index))*rad];};
  const rings=[1,2,3,4,5].slice(0,max).map(step=>`<circle cx="${cx}" cy="${cy}" r="${r*step/max}" fill="none" stroke="${LINE}" stroke-width="1"/>`).join('');
  const spokes=points.map((_,index)=>{const [x,y]=coord(index,max);return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${LINE}" stroke-width="1"/>`;}).join('');
  const path=points.map((item,index)=>{const [x,y]=coord(index,item.value);return `${index?'L':'M'}${x.toFixed(1)} ${y.toFixed(1)}`;}).join(' ')+' Z';
  const dots=points.map((item,index)=>{const [x,y]=coord(index,item.value);return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${ACCENT}"><title>${esc(item.label)}: ${num(item.value,1)}/${max}</title></circle>`;}).join('');
  const labels=points.map((item,index)=>{const [x,y]=coord(index,max*1.16);return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="8" text-anchor="middle" dominant-baseline="middle" fill="currentColor" opacity=".72">${esc(String(item.label).slice(0,14))}</text>`;}).join('');
  return frame('0 0 300 300',title,`${rings}${spokes}<path d="${path}" fill="${ACCENT}" fill-opacity=".16" stroke="${ACCENT}" stroke-width="2" stroke-linejoin="round"/>${dots}${labels}`);
}

/** Twaalfmaands gantt voor de roadmap. */
export function gantt(items=[],{title='Roadmap over twaalf maanden',months=12}={}){
  const rows=items.filter(item=>item&&n(item.duration)>0).slice(0,12);
  if(!rows.length)return '';
  const left=118,right=8,top=26,rowHeight=22,width=560;
  const track=width-left-right;
  const height=top+rows.length*rowHeight+10;
  const grid=Array.from({length:months+1},(_,index)=>{
    const x=left+track*index/months;
    return `<line x1="${x.toFixed(1)}" y1="${top-8}" x2="${x.toFixed(1)}" y2="${height-8}" stroke="${LINE}" stroke-width="1"/>`
      +(index<months?`<text x="${(x+track/months/2).toFixed(1)}" y="${top-12}" font-size="8" text-anchor="middle" fill="currentColor" opacity=".6">${index+1}</text>`:'');
  }).join('');
  const bars=rows.map((item,index)=>{
    const start=clamp(item.start||1,1,months);
    const span=clamp(item.duration,1,months-start+1);
    const x=left+track*(start-1)/months;
    const barWidth=track*span/months;
    const y=top+index*rowHeight;
    const progress=clamp(item.progress,0,100);
    const done=item.done===true;
    const fill=done?MINT:progress>0?ACCENT:SOFT;
    return `<text x="0" y="${(y+11).toFixed(1)}" font-size="9" fill="currentColor" opacity=".82">${esc(String(item.title||'Item').slice(0,20))}</text>`
      +`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="14" rx="7" fill="${fill}" fill-opacity=".22"/>`
      +`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(barWidth*(done?100:progress)/100).toFixed(1)}" height="14" rx="7" fill="${fill}"><title>${esc(item.title||'Item')}: ${done?'afgerond':`${num(progress)}%`}</title></rect>`;
  }).join('');
  return frame(`0 0 ${width} ${height}`,title,`${grid}${bars}`);
}

/** Lijn met gevulde vlak: adoptiecurve, cumulatief resultaat, meting over tijd. */
export function curve(points=[],{title='Verloop',valueLabel=''}={}){
  const series=points.filter(point=>point&&Number.isFinite(Number(point.value)));
  if(series.length<2)return '';
  const width=560,height=200,left=44,bottom=28,top=14,right=10;
  const values=series.map(point=>n(point.value));
  const min=Math.min(0,...values),max=Math.max(...values,1);
  const x=index=>left+(width-left-right)*index/(series.length-1);
  const y=value=>height-bottom-(height-bottom-top)*((n(value)-min)/(max-min||1));
  const line=series.map((point,index)=>`${index?'L':'M'}${x(index).toFixed(1)} ${y(point.value).toFixed(1)}`).join(' ');
  const area=`${line} L${x(series.length-1).toFixed(1)} ${(height-bottom).toFixed(1)} L${x(0).toFixed(1)} ${(height-bottom).toFixed(1)} Z`;
  const zero=min<0?`<line x1="${left}" y1="${y(0).toFixed(1)}" x2="${width-right}" y2="${y(0).toFixed(1)}" stroke="${LINE}" stroke-width="1" stroke-dasharray="3 3"/>`:'';
  const dots=series.map((point,index)=>`<circle cx="${x(index).toFixed(1)}" cy="${y(point.value).toFixed(1)}" r="3" fill="${ACCENT}"><title>${esc(point.label??index+1)}: ${num(point.value)} ${esc(valueLabel)}</title></circle>`).join('');
  const ticks=series.map((point,index)=>index%Math.ceil(series.length/6)?'':`<text x="${x(index).toFixed(1)}" y="${height-10}" font-size="8" text-anchor="middle" fill="currentColor" opacity=".6">${esc(point.label??index+1)}</text>`).join('');
  return frame(`0 0 ${width} ${height}`,title,
    `<line x1="${left}" y1="${top}" x2="${left}" y2="${height-bottom}" stroke="${LINE}"/><line x1="${left}" y1="${height-bottom}" x2="${width-right}" y2="${height-bottom}" stroke="${LINE}"/>${zero}`
    +`<path d="${area}" fill="${ACCENT}" fill-opacity=".12"/><path d="${line}" fill="none" stroke="${ACCENT}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>${dots}${ticks}`
    +`<text x="2" y="${(top+6)}" font-size="8" fill="currentColor" opacity=".6">${esc(num(max))}</text><text x="2" y="${(height-bottom).toFixed(1)}" font-size="8" fill="currentColor" opacity=".6">${esc(num(min))}</text>`);
}

/** Vierkwadrantenmatrix: waarde tegen doorlooptijd, volwassenheid tegen kosten. */
export function quadrant(points=[],{title='Waarde tegen inspanning',xLabel='Inspanning',yLabel='Waarde'}={}){
  const items=points.filter(point=>point&&Number.isFinite(Number(point.x))&&Number.isFinite(Number(point.y)));
  if(!items.length)return '';
  const width=440,height=300,pad=36;
  const xs=items.map(item=>n(item.x)),ys=items.map(item=>n(item.y));
  const xMax=Math.max(...xs,1),yMax=Math.max(...ys,1);
  const px=value=>pad+(width-pad*2)*clamp(value,0,xMax)/xMax;
  const py=value=>height-pad-(height-pad*2)*clamp(value,0,yMax)/yMax;
  const midX=pad+(width-pad*2)/2,midY=height-pad-(height-pad*2)/2;
  const dots=items.slice(0,24).map(item=>`<g><circle cx="${px(item.x).toFixed(1)}" cy="${py(item.y).toFixed(1)}" r="6" fill="${n(item.y)>=yMax/2&&n(item.x)<=xMax/2?MINT:ACCENT}" fill-opacity=".78"><title>${esc(item.label||'')}: ${num(item.y)} / ${num(item.x)}</title></circle></g>`).join('');
  return frame(`0 0 ${width} ${height}`,title,
    `<rect x="${pad}" y="${pad}" width="${width-pad*2}" height="${height-pad*2}" fill="none" stroke="${LINE}"/>`
    +`<line x1="${midX}" y1="${pad}" x2="${midX}" y2="${height-pad}" stroke="${LINE}" stroke-dasharray="4 4"/>`
    +`<line x1="${pad}" y1="${midY}" x2="${width-pad}" y2="${midY}" stroke="${LINE}" stroke-dasharray="4 4"/>`
    +`<text x="${pad+6}" y="${pad+14}" font-size="8" fill="${MINT}" opacity=".9">nu doen</text>`
    +`<text x="${width-pad-6}" y="${height-pad-6}" font-size="8" text-anchor="end" fill="currentColor" opacity=".5">later</text>`
    +`<text x="${width/2}" y="${height-8}" font-size="9" text-anchor="middle" fill="currentColor" opacity=".7">${esc(xLabel)}</text>`
    +`<text x="10" y="${height/2}" font-size="9" text-anchor="middle" fill="currentColor" opacity=".7" transform="rotate(-90 10 ${height/2})">${esc(yLabel)}</text>${dots}`);
}

/** Staafvergelijking eigen waarde tegen benchmark. */
export function benchmarkBars(rows=[],{title='Vergelijking met de benchmark'}={}){
  const items=rows.filter(row=>row&&row.label!=null).slice(0,8);
  if(!items.length)return '';
  const width=560,rowHeight=32,top=16,left=132;
  const height=top+items.length*rowHeight+8;
  const max=Math.max(...items.flatMap(item=>[Math.abs(n(item.value)),Math.abs(n(item.benchmark))]),1);
  const scale=value=>(width-left-16)*Math.abs(n(value))/max;
  const bars=items.map((item,index)=>{
    const y=top+index*rowHeight;
    const better=n(item.value)>=n(item.benchmark);
    return `<text x="0" y="${y+12}" font-size="9" fill="currentColor" opacity=".82">${esc(String(item.label).slice(0,22))}</text>`
      +`<rect x="${left}" y="${y+2}" width="${scale(item.value).toFixed(1)}" height="10" rx="5" fill="${better?MINT:AMBER}"><title>Eigen waarde: ${num(item.value,1)}</title></rect>`
      +`<rect x="${left}" y="${y+15}" width="${scale(item.benchmark).toFixed(1)}" height="6" rx="3" fill="${LINE}"><title>Benchmark: ${num(item.benchmark,1)}</title></rect>`
      +`<text x="${(left+Math.max(scale(item.value),scale(item.benchmark))+6).toFixed(1)}" y="${y+13}" font-size="8" fill="currentColor" opacity=".65">${num(item.value,1)} · benchmark ${num(item.benchmark,1)}</text>`;
  }).join('');
  return frame(`0 0 ${width} ${height}`,title,bars);
}

/** Ring voor een percentage, met het getal in het midden. */
export function ring(value,{title='Volledigheid',caption=''}={}){
  const percentage=clamp(value,0,100);
  const radius=52,circumference=2*Math.PI*radius;
  return frame('0 0 140 140',title,
    `<circle cx="70" cy="70" r="${radius}" fill="none" stroke="${LINE}" stroke-width="12"/>`
    +`<circle cx="70" cy="70" r="${radius}" fill="none" stroke="${ACCENT}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(circumference*percentage/100).toFixed(1)} ${circumference.toFixed(1)}" transform="rotate(-90 70 70)"/>`
    +`<text x="70" y="72" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="currentColor" font-weight="700">${num(percentage)}%</text>`
    +(caption?`<text x="70" y="98" font-size="8" text-anchor="middle" fill="currentColor" opacity=".62">${esc(caption)}</text>`:''));
}

/** Gestapelde balk voor de lekkage van tijd en geld. */
export function leakage(segments=[],{title='Waar tijd en geld weglekken'}={}){
  const items=segments.filter(item=>item&&n(item.value)>0).slice(0,6);
  if(!items.length)return '';
  const total=items.reduce((sum,item)=>sum+n(item.value),0)||1;
  const width=560,barY=30,barHeight=26;
  let offset=0;
  const palette=[ACCENT,SOFT,'var(--saas-violet,#7c3aed)',AMBER,MINT,'var(--saas-cyan,#22d3ee)'];
  const bars=items.map((item,index)=>{
    const segmentWidth=(width-8)*n(item.value)/total;
    const x=offset;offset+=segmentWidth;
    return `<rect x="${x.toFixed(1)}" y="${barY}" width="${Math.max(0,segmentWidth-2).toFixed(1)}" height="${barHeight}" rx="6" fill="${palette[index%palette.length]}" fill-opacity=".85"><title>${esc(item.label)}: ${num(item.value)}</title></rect>`;
  }).join('');
  const legend=items.map((item,index)=>`<g transform="translate(${(index%3)*186} ${74+Math.floor(index/3)*18})"><rect width="9" height="9" rx="2" fill="${palette[index%palette.length]}"/><text x="14" y="8" font-size="9" fill="currentColor" opacity=".76">${esc(String(item.label).slice(0,24))}</text></g>`).join('');
  const height=74+Math.ceil(items.length/3)*18+8;
  return frame(`0 0 ${width} ${height}`,title,`<text x="0" y="18" font-size="9" fill="currentColor" opacity=".6">totaal ${num(total)}</text>${bars}${legend}`);
}

export const VISUALS_VERSION='2026-09-09-v1';
