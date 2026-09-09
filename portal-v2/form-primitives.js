const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const optionMarkup=(options,value,multiple=false)=>(options||[]).map(option=>{const item=typeof option==='object'?option:{value:option,label:option};const selected=multiple?Array.isArray(value)&&value.includes(item.value):String(value??'')===String(item.value);return `<option value="${esc(item.value)}"${selected?' selected':''}>${esc(item.label)}</option>`}).join('');

export function normalizeFieldValue(field={},raw){
 const type=field.type||'text';
 if(['number','currency','percentage','range'].includes(type)){
  let value=Number(raw);
  if(!Number.isFinite(value))value=0;
  if(type==='range'){
   if(Number.isFinite(Number(field.min)))value=Math.max(Number(field.min),value);
   if(Number.isFinite(Number(field.max)))value=Math.min(Number(field.max),value);
  }
  return value;
 }
 if(type==='multiselect')return Array.isArray(raw)?raw:[...raw||[]].map(item=>item.value);
 if(type==='triState')return raw===''?null:raw==='true'||raw===true?true:raw==='false'||raw===false?false:null;
 return String(raw??'');
}

export function fieldMarkup(field={},value=''){
 const id=esc(field.id||field.path||'field');const label=esc(field.label||field.id||'Veld');const type=field.type||'text';const common=`id="${id}" data-field-id="${id}" data-field-type="${esc(type)}"`;
 let control='';
 if(type==='textarea')control=`<textarea ${common} rows="4">${esc(value)}</textarea>`;
 else if(type==='select')control=`<select ${common}>${optionMarkup(field.options,value)}</select>`;
 else if(type==='multiselect')control=`<select ${common} multiple>${optionMarkup(field.options,value,true)}</select>`;
 else if(type==='triState')control=`<select ${common}><option value="">Nog niet beoordeeld</option><option value="true"${value===true?' selected':''}>Ja</option><option value="false"${value===false?' selected':''}>Nee</option></select>`;
 else if(type==='ranked')control=`<select ${common}>${optionMarkup(field.options||[1,2,3,4,5],value)}</select>`;
 else if(type==='repeatable')control=`<div ${common} class="v2repeatable" role="group"><button type="button" data-repeatable-add>+ Toevoegen</button></div>`;
 else if(type==='evidence')control=`<input ${common} type="url" value="${esc(value)}" placeholder="Link naar bewijs">`;
 else if(type==='owner')control=`<input ${common} type="text" value="${esc(value)}" autocomplete="name">`;
 else {
  const inputType=type==='date'?'date':['number','currency','percentage'].includes(type)?'number':type==='range'?'range':'text';
  const step=type==='currency'||type==='percentage'?' step="0.1"':'';
  const min=field.min!=null?` min="${esc(field.min)}"`:'';const max=field.max!=null?` max="${esc(field.max)}"`:'';
  control=`<input ${common} type="${inputType}" value="${esc(value)}"${step}${min}${max}>`;
 }
 return `<label class="v2field" data-field-wrap="${id}"><span class="v2fieldlabel">${label}${field.required?' <i>*</i>':''}</span>${control}${field.help?`<small>${esc(field.help)}</small>`:''}<span class="v2fielderror" data-field-error hidden></span></label>`;
}

export function bindFields(root,schema,{getValue=()=>undefined,onChange=()=>{}}={}){
 if(!root?.querySelectorAll)return()=>{};
 const listeners=[];
 for(const field of schema||[]){
  const node=root.querySelector(`[data-field-id="${CSS.escape(field.id)}"]`);if(!node)continue;
  const handler=()=>{const raw=node.multiple?[...node.selectedOptions].map(option=>option.value):node.value;onChange(field,normalizeFieldValue(field,raw),node);};
  node.addEventListener('input',handler);node.addEventListener('change',handler);listeners.push(()=>{node.removeEventListener('input',handler);node.removeEventListener('change',handler)});
 }
 return()=>listeners.forEach(fn=>fn());
}
