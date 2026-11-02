import {createConnectorDraft,validateConnectorDraft} from './connector-model.js';
import {SOURCE_ADAPTERS,TARGET_ADAPTERS} from './connector-templates.js';

const sources=new Set(SOURCE_ADAPTERS.map(item=>item.id));
const targets=new Set(TARGET_ADAPTERS.map(item=>item.id));
const fieldTypes=new Set(['string','number','currency','date','boolean','array']);
const clean=(value,max=120)=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);
const escapeHtml=value=>clean(value,2000).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const isRecord=value=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
const EXAMPLES=Object.freeze([
  'Verbind mijn boekhouding met mijn webshop en laat dagelijks mijn omzet zien.',
  'Lees facturen uit mijn zakelijke mailbox en zet ze na controle in mijn administratie.',
  'Combineer klantgegevens en verkoopcijfers in één betrouwbaar dashboard.'
]);

// AI describes a draft, it does not authenticate to external software or confer execution authority.
export function buildAiConnectorDraft(proposal){
  if(!isRecord(proposal))throw new Error('AI_PROPOSAL_REQUIRED');
  const definition=isRecord(proposal.proposedDefinition)?proposal.proposedDefinition:{};
  const draft=createConnectorDraft('blank');
  const warnings=[];
  draft.name=clean(definition.name||proposal.summary||'Nieuwe koppeling',100)||'Nieuwe koppeling';
  const source=isRecord(definition.source)?definition.source:{};
  const target=isRecord(definition.target)?definition.target:{};
  const requestedSource=clean(source.type,40).toLowerCase();
  const requestedTarget=clean(target.type,40).toLowerCase();
  if(sources.has(requestedSource))draft.source.type=requestedSource;
  else if(requestedSource){
    draft.source.type='api';
    warnings.push('De bronsoftware heeft nog geen bewezen native adapter. Een beveiligde API-configuratie is nodig.');
  }
  if(targets.has(requestedTarget))draft.target.type=requestedTarget;
  else if(requestedTarget){
    draft.target.type='rest';
    warnings.push('De doelsoftware heeft nog geen bewezen native adapter. Een beveiligde API-configuratie is nodig.');
  }
  draft.source.config={};
  draft.target.config={};
  const schema=isRecord(definition.documentSchema)?definition.documentSchema:{};
  draft.documentSchema.name=clean(schema.name||'Bedrijfsgegevens',100);
  const seen=new Set();
  draft.documentSchema.fields=(Array.isArray(schema.fields)?schema.fields:[]).slice(0,40).flatMap(item=>{
    if(!isRecord(item))return [];
    const key=clean(item.key,64);
    if(!/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(key)||seen.has(key))return [];
    seen.add(key);
    return [{key,label:clean(item.label||key,80),type:fieldTypes.has(item.type)?item.type:'string',
      required:item.required===true,confidenceThreshold:.8}];
  });
  draft.mappings=(Array.isArray(definition.mappings)?definition.mappings:[]).slice(0,40).flatMap(item=>{
    const sourceField=clean(item?.sourceField,64),targetField=clean(item?.targetField,64);
    if(!seen.has(sourceField)||!/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(targetField))return [];
    return [{sourceField,targetField,required:false,transformation:{type:'none'}}];
  });
  // Do not trust AI output for credentials, schedules, approvals, tenant IDs, run state or runtime evidence.
  const checked=validateConnectorDraft(draft);
  if(!checked.valid)throw new Error('AI_PROPOSAL_INVALID');
  warnings.unshift('Dit is een concept. De koppeling is nog niet geautoriseerd, getest of actief.');
  return {draft:checked.draft,warnings};
}

export function renderAiConnectStudio({intent='',status='idle',proposal=null,error=null}={}){
  const pending=status==='loading';
  const answer=isRecord(proposal)?proposal:null;
  const questions=Array.isArray(answer?.missingQuestions)?answer.missingQuestions.slice(0,4):[];
  const tips=Array.isArray(answer?.suggestions)?answer.suggestions.slice(0,4):[];
  return '<section class="ai-connect" aria-labelledby="ai-connect-heading" data-ai-connect-studio>'+
    '<div class="ai-connect__glow" aria-hidden="true"></div>'+
    '<div class="ai-connect__main"><div class="ai-connect__label"><span class="ai-connect__spark" aria-hidden="true">✦</span> AI CONNECT STUDIO <span class="ai-connect__badge">Bèta</span></div>'+
    '<h3 id="ai-connect-heading">Vertel wat je wilt verbinden.<br><em>Wij helpen je op weg.</em></h3>'+
    '<p class="ai-connect__intro">Beschrijf je software en het resultaat in je eigen woorden. De AI maakt een voorstel. Jij houdt de controle over toegang, test en activatie.</p>'+
    '<label class="ai-connect__prompt-label" for="ai-connect-intent">Wat wil je koppelen?</label>'+
    '<div class="ai-connect__compose"><textarea id="ai-connect-intent" data-ai-intent maxlength="2000" rows="3" placeholder="Bijvoorbeeld: verbind Exact met Shopify en toon dagelijks mijn omzet..." aria-describedby="ai-connect-privacy">'+escapeHtml(intent)+'</textarea>'+
    '<button type="button" data-ai-connect class="ai-connect__submit" '+(pending?'disabled':'')+'>'+(pending?'AI onderzoekt…':'Maak mijn koppelplan →')+'</button></div>'+
    '<p id="ai-connect-privacy" class="ai-connect__privacy">🔒 Voer hier nooit wachtwoorden of API-sleutels in. Je verleent toegang pas later via een beveiligde provider.</p>'+
    '<div class="ai-connect__examples"><span>Probeer bijvoorbeeld</span>'+EXAMPLES.map((example,index)=>'<button type="button" data-ai-example="'+index+'">'+escapeHtml(example)+'</button>').join('')+'</div>'+
    '</div><aside class="ai-connect__journey" aria-label="Zo werkt koppelen"><div class="ai-connect__orbit" aria-hidden="true">✳</div>'+
    '<div class="ai-connect__step"><b>01</b><div><strong>Vertel je wens</strong><span>Gewone taal, geen jargon</span></div></div>'+
    '<div class="ai-connect__step"><b>02</b><div><strong>Controleer het voorstel</strong><span>Bron, doel, rechten en gegevens</span></div></div>'+
    '<div class="ai-connect__step"><b>03</b><div><strong>Test vóór activeren</strong><span>Alleen echt bewijs telt</span></div></div>'+
    '<p class="ai-connect__proof">Een voorstel is nooit automatisch een actieve koppeling.</p></aside>'+
    '<div class="ai-connect__feedback" role="status" aria-live="polite">'+
    (pending?'<p>AI stelt een veilig koppelplan voor. Er worden nog geen externe gegevens opgehaald.</p>':'')+
    (error?'<p class="ai-connect__error">'+escapeHtml(error)+'</p>':'')+
    (answer?'<section class="ai-connect__result" aria-label="AI-voorstel"><div><span class="ai-connect__draft-tag">VOORSTEL · NOG NIET VERBONDEN</span>'+
      '<h4>'+escapeHtml(answer.summary||'Voorstel voor je koppeling')+'</h4>'+
      (tips.length?'<div class="ai-connect__notes">'+tips.map(item=>'<p>✓ '+escapeHtml(typeof item==='string'?item:item?.description||item?.text||'')+'</p>').join('')+'</div>':'')+
      (questions.length?'<p><strong>Nog te verduidelijken:</strong> '+questions.map(q=>escapeHtml(typeof q==='string'?q:q?.question||'')).join(' · ')+'</p>':'')+
      '<p class="ai-connect__truth">De daadwerkelijke bron- en doelverbinding moet afzonderlijk worden geautoriseerd en met echte providergegevens getest.</p></div>'+
      '<button type="button" class="ai-connect__apply" data-ai-apply>Controleer dit voorstel →</button></section>':'')+
    '</div></section>';
}

export const AI_CONNECT_EXAMPLES=EXAMPLES;
