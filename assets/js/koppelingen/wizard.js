const PHASES=Object.freeze(['source','selection','information','target','schedule','test']);

const cloneAnswers=answers=>({...answers});
const DEFAULT_CONFIDENCE=.8;

const toFieldSpec=field=>{
  if(typeof field==='string')return Object.freeze({key:field,required:false,confidenceThreshold:DEFAULT_CONFIDENCE});
  if(!field||typeof field!=='object'||!field.key)throw new TypeError('Invalid connector field');
  return Object.freeze({
    key:String(field.key),
    required:Boolean(field.required),
    confidenceThreshold:Number.isFinite(field.confidenceThreshold)?Number(field.confidenceThreshold):DEFAULT_CONFIDENCE
  });
};

export function createWizardState(template=null){
  if(!template)throw new TypeError('A connector template is required');
  return Object.freeze({
    template,
    phase:'source',
    answers:Object.freeze({
      target:template.targets?.length===1?template.targets[0]:null,
      schedule:template.defaultSchedule||null
    })
  });
}

export function applyAnswer(state,key,value){
  if(!state?.template)throw new TypeError('Invalid wizard state');
  return Object.freeze({...state,answers:Object.freeze({...cloneAnswers(state.answers),[key]:value})});
}

export function nextQuestion(state){
  const {template,answers}=state;
  if(!answers.connection){
    return Object.freeze({phase:'source',key:'connection',label:'Welke verbinding wil je gebruiken?',options:template.connections||[]});
  }
  if(template.questions?.length){
    const unanswered=template.questions.find(question=>!Object.hasOwn(answers,question.key));
    if(unanswered)return Object.freeze({phase:unanswered.phase||'selection',...unanswered});
  }
  if((template.targets?.length||0)>1&&!answers.target){
    return Object.freeze({phase:'target',key:'target',label:'Waar moet de informatie naartoe?',options:template.targets});
  }
  if(!Object.hasOwn(answers,'confirmSchedule')){
    return Object.freeze({phase:'schedule',key:'confirmSchedule',label:`Uitvoeren: ${answers.schedule||template.defaultSchedule||'handmatig'}?`,defaultValue:true});
  }
  return Object.freeze({phase:'test',key:'safeTest',label:'Voer een veilige test uit voordat je activeert.'});
}

export function toConnectorDefinition(state){
  if(!state?.template)throw new TypeError('Invalid wizard state');
  const {template,answers}=state;
  const target=answers.target||(template.targets?.length===1?template.targets[0]:null);
  const fields=Object.freeze((template.fields||[]).map(toFieldSpec));
  const mappings=Object.freeze(fields.map(field=>Object.freeze({
    sourceField:field.key,
    targetField:field.key,
    transformation:Object.freeze({type:'none'})
  })));
  return Object.freeze({
    templateId:template.id,
    source:Object.freeze({type:template.source.type,connectionId:answers.connection||null,filters:template.filters||{}}),
    documentSchema:Object.freeze({type:template.documentType||'custom',fields}),
    mappings,
    reviewPolicy:Object.freeze({requiredBelowConfidence:DEFAULT_CONFIDENCE}),
    target:Object.freeze({type:target}),
    schedule:answers.schedule||template.defaultSchedule||'handmatig',
    fallback:template.fallback||'review',
    activation:'test-required'
  });
}

export {PHASES};
