const PHASES=Object.freeze(['source','selection','information','target','schedule','test']);

const cloneAnswers=answers=>({...answers});

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
  return Object.freeze({
    templateId:template.id,
    source:Object.freeze({type:template.source.type,connectionId:answers.connection||null,filters:template.filters||{}}),
    extraction:Object.freeze({documentType:template.documentType||'custom',fields:[...(template.fields||[])]}),
    documentType:template.documentType||'custom',
    target:Object.freeze({type:target}),
    schedule:answers.schedule||template.defaultSchedule||'handmatig',
    fallback:template.fallback||'review',
    activation:'test-required'
  });
}

export {PHASES};
