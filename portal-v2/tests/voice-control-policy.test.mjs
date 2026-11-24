import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePortalVoiceControl,resolveVoiceControl,eligibleVoiceField,
  stageVoiceFieldValue,normalizeVoiceText} from '../voice-control-policy.js';
import {normalizeRule} from '../signal-detection.js';

test('every portal page can address visible native fields and controls without autonomous click',()=>{
  assert.deepEqual(parsePortalVoiceControl('Focus op veld omzet'),{kind:'focus',label:'veld omzet'});
  assert.deepEqual(parsePortalVoiceControl('Klik op Opslaan'),{kind:'activate',label:'opslaan'});
  assert.deepEqual(parsePortalVoiceControl('Vul veld klantnaam met Jansen'),{kind:'fill',label:'klantnaam',value:'Jansen'});
  assert.deepEqual(parsePortalVoiceControl('Kies Ja in Privacy'),{kind:'choose',label:'privacy',value:'ja'});
  assert.equal(parsePortalVoiceControl(''),null);
  assert.equal(normalizeVoiceText('FINANCIËN'),'financien');
});
test('ambiguous and missing controls never trigger guessed actions',()=>{
  const controls=[{label:'Omzet',control:{id:'a'}},{label:'Omzet',control:{id:'b'}},{label:'Brutomarge',control:{id:'c'}}];
  assert.equal(resolveVoiceControl(controls,'omzet').status,'ambiguous');
  assert.equal(resolveVoiceControl(controls,'winst').status,'missing');
  assert.equal(resolveVoiceControl(controls,'brutomarge').control.id,'c');
});
test('native consent, passwords and tokens cannot be populated by spoken commands',()=>{
  const base={tagName:'INPUT',type:'text',disabled:false,readOnly:false,name:'organisatie',
    id:'bedrijf',getAttribute(){return ''}};
  assert.equal(eligibleVoiceField(base),true);
  assert.equal(eligibleVoiceField({...base,type:'password'}),false);
  assert.equal(eligibleVoiceField({...base,type:'checkbox'}),false);
  assert.equal(eligibleVoiceField({...base,name:'api_key'}),false);
  assert.equal(eligibleVoiceField({...base,name:'consent'}),false);
});
test('spoken edits change only local form inputs and require original save',()=>{
  const events=[];
  const field={tagName:'INPUT',type:'number',value:'',name:'percentage',id:'',
    getAttribute(){return ''},dispatchEvent(e){events.push(e.type)}};
  const changed=stageVoiceFieldValue(field,'7,5');
  assert.deepEqual(changed,{ok:true,reason:'ALLEEN_LOKALE_INVOER_NOG_NIET_OPGESLAGEN'});
  assert.equal(field.value,'7.5');
  assert.deepEqual(events,['input','change']);
  assert.equal(stageVoiceFieldValue({...field,name:'password'},'123').ok,false);
});
test('signal monitoring consent is explicit and delivery flags are not proof',()=>{
  const rule={id:'test',metricId:'revenue',operator:'below',threshold:100,
    channels:{email:true,push:true}};
  assert.deepEqual(normalizeRule(rule).channels,{portal:true,email:false,push:false});
  const opted=normalizeRule({...rule,monitoring:true});
  assert.equal(opted.monitoring,true);
  assert.equal(opted.channels.email,true);
  assert.equal(opted.channels.push,true);
});
