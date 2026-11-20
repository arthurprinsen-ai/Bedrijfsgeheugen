/**
 * Original Portal V2 voice access policy. One deterministic control resolver
 * covering the currently rendered native controls. Voice never grants consent,
 * submits a form, sends a message or invokes a privileged action.
 */
export const normalizeVoiceText=value=>String(value??'').toLocaleLowerCase('nl-NL').normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();

export function parsePortalVoiceControl(raw){
  const text=String(raw||'').trim();
  const n=normalizeVoiceText(text);
  if(!n||n.length>500)return null;
  let match=n.match(/^(?:focus op|ga naar veld|zoek veld|selecteer veld|toon veld) (.+)$/);
  if(match)return {kind:'focus',label:match[1]};
  match=n.match(/^(?:klik op|druk op|activeer|gebruik knop|selecteer knop) (.+)$/);
  if(match)return {kind:'activate',label:match[1]};
  match=n.match(/^(?:vul|schrijf in|zet in|stel in) (?:veld |het veld )?(.+?) (?:in met|op|met|naar) (.+)$/);
  if(match){const original=text.match(/^(?:vul|schrijf in|zet in|stel in)\s+(?:veld\s+|het veld\s+)?(.+?)\s+(?:in met|op|met|naar)\s+(.+)$/i);return {kind:'fill',label:match[1],value:original?.[2]?.trim()||match[2]};}
  match=n.match(/^(?:kies|selecteer) (.+?) (?:bij|in) (.+)$/);
  if(match)return {kind:'choose',label:match[2],value:match[1]};
  return null;
}

const isFormField=control=>['INPUT','TEXTAREA','SELECT'].includes(String(control?.tagName||'').toUpperCase());
const SENSITIVE=/\b(?:password|wachtwoord|token|api.?key|secret|geheim|oauth|autorisatiecode|machtiging|consent|toestemming|verwijder|delete|betaling|betaal|afrekenen)\b/i;
export function eligibleVoiceField(control){
  if(!isFormField(control)||control.disabled||control.readOnly)return false;
  const type=String(control.type||'text').toLowerCase();
  if(['password','file','hidden','checkbox','radio','submit','reset','button'].includes(type))return false;
  const name=[control.name,control.id,control.autocomplete,control.getAttribute?.('aria-label'),...([...control.labels||[]].map(label=>label.textContent))].filter(Boolean).join(' ');
  return !SENSITIVE.test(name);
}
export function visibleVoiceControl(control){
  if(!control?.isConnected||control.disabled)return false;
  if(control.closest?.('[hidden],[inert],[aria-hidden="true"],[data-voice-signal-root],.vs-dialog'))return false;
  if(typeof control.getClientRects==='function'&&control.getClientRects().length===0)return false;
  return true;
}
export function voiceControlLabel(control){
  const labeled=control?.labels?.length?[...control.labels].map(label=>label.textContent).join(' '):'';
  const text=[control?.getAttribute?.('aria-label'),labeled,control?.getAttribute?.('placeholder'),control?.getAttribute?.('title'),
    control?.tagName==='BUTTON'||control?.tagName==='A'?control?.textContent:'',
    control?.id&&control.id.replace(/[-_]/g,' ')].filter(Boolean);
  return normalizeVoiceText(text.join(' ')).slice(0,300);
}

export function resolveVoiceControl(candidates,label){
  const query=normalizeVoiceText(label).replace(/^(?:het |de |mijn |knop |veld )+/,'');
  if(!query||query.length>150)return {status:'invalid',control:null};
  const hits=candidates.filter(item=>item?.label&&normalizeVoiceText(item.label)===query);
  if(hits.length===1)return {status:'found',control:hits[0].control};
  if(hits.length>1)return {status:'ambiguous',control:null};
  const partial=candidates.filter(item=>item?.label&&normalizeVoiceText(item.label).includes(query));
  if(partial.length===1)return {status:'found',control:partial[0].control};
  return {status:partial.length?'ambiguous':'missing',control:null};
}

export function stageVoiceFieldValue(control,value){
  if(!eligibleVoiceField(control))return {ok:false,reason:'BEVEILIGD_OF_NIET_BEVRAAGBAAR_VELD'};
  const clean=String(value??'').trim().slice(0,500);
  if(!clean)return {ok:false,reason:'LEGE_WAARDE'};
  if(control.tagName==='SELECT'){
    const options=[...(control.options||[])].filter(opt=>!opt.disabled);
    const exact=options.filter(opt=>normalizeVoiceText(opt.textContent)===normalizeVoiceText(clean)
      ||normalizeVoiceText(opt.value)===normalizeVoiceText(clean));
    if(exact.length!==1)return {ok:false,reason:'OPTIE_NIET_EENDUIDIG'};
    control.value=exact[0].value;
  }else if(control.type==='number'){
    const num=Number(clean.replace(',','.'));
    if(!Number.isFinite(num))return {ok:false,reason:'ONGELDIG_GETAL'};
    control.value=String(num);
  }else{
    control.value=clean;
  }
  control.dispatchEvent(new Event('input',{bubbles:true}));
  control.dispatchEvent(new Event('change',{bubbles:true}));
  return {ok:true,reason:'ALLEEN_LOKALE_INVOER_NOG_NIET_OPGESLAGEN'};
}
