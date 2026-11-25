import {runGovernedProductionAI} from '../../platform/brain/production-ai.mjs';
import {createProviderRegistry} from '../../platform/intelligence/provider-registry.mjs';
import {ACTIONS,DECISIONS} from '../../platform/policy/policy-engine.mjs';
import {createAIUseCase,AI_RISK_CLASSES,AI_USE_CASE_STATES} from '../../platform/policy/ai-register.mjs';
import {normalizeProviderTokenUsage} from '../../platform/cost/ai-token-usage.mjs';
import {createAiUsageStore} from './_ai-usage-store.mjs';
import {createDataSovereigntyClient} from './_data-sovereignty-client.mjs';

const MODEL_ID='OPENAI-GPT-5-MINI-CONNECTOR';
const MODEL='gpt-5-mini';
const PURPOSE='connector-configuration-guidance';

const providerRegistry=createProviderRegistry([{
  id:MODEL_ID,provider:'OpenAI',model:MODEL,status:'Approved',
  allowedDataClasses:['Confidential'],allowedPurposes:[PURPOSE],
  trainingAllowed:false,persistentProviderMemory:false
}]);

const aiUseCases=[createAIUseCase({
  id:'AI-CONNECTOR-GUIDE',tenantId:'REQUEST_SCOPED',purpose:PURPOSE,ownerId:'Bedrijfsgeheugen',legalRole:'Deployer',
  riskClass:AI_RISK_CLASSES.TRANSPARENCY,providerModelId:MODEL_ID,dataClasses:['Confidential'],
  humanOversight:'User confirms configuration and must complete a safe-test before activation',autonomy:'L1',
  controls:['REQUEST_SCOPED_CONTEXT','NO_PERSISTENCE','NO_PROVIDER_HEALTH_CLAIMS','NO_CREDENTIALS'],
  evidence:['CONNECTOR-SAFE-TEST'],state:AI_USE_CASE_STATES.ACTIVE
})];

const policies=[{
  id:'PORTAL-CONNECTOR-GUIDE',subjectId:'portal-requester',action:ACTIONS.AI_PROCESS,resourceType:'ConnectorIntent',purpose:PURPOSE,
  dataClass:'Confidential',tenantId:'REQUEST_SCOPED',decision:DECISIONS.ALLOW
}];

const SYSTEM=`Je helpt een niet-technische gebruiker een Bedrijfsgeheugen-koppeling configureren.
Geef uitsluitend JSON met de sleutels summary, suggestions, missingQuestions en proposedDefinition.
Vertaal gewone taal naar bron, selectie, documentinformatie, doel en planning. Gebruik veilige defaults.
Verzin nooit credentials, tokens, secrets, providerbereikbaarheid, readiness, health of execution evidence.
AFAS en Exact mogen alleen als gewenste bron of doel worden voorgesteld; configuratie en werking worden elders server-side bewezen.
Activering is nooit jouw beslissing: een echte safe-test is verplicht.`;

const parseJson=text=>{
  const cleaned=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  const parsed=JSON.parse(cleaned);
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('Connector guide returned invalid JSON');
  return parsed;
};

export async function proposeConnectorConfiguration({intent,currentState,userId,tenantId,apiKey=process.env.OPENAI_API_KEY,fetchImpl=fetch,usageStore,requestId=crypto.randomUUID()}={}){
  if(!apiKey)throw new Error('OpenAI API key missing');
  if(!tenantId)throw Object.assign(new Error('DATA_SOVEREIGNTY_TENANT_REQUIRED'),{code:'DATA_SOVEREIGNTY_TENANT_REQUIRED'});
  await createDataSovereigntyClient().assertAiAllowed(tenantId);
  const result=await runGovernedProductionAI({
    request:{requestId,tenantId:'REQUEST_SCOPED',requesterId:'portal-requester',aiUseCaseId:'AI-CONNECTOR-GUIDE',purpose:PURPOSE,resourceType:'ConnectorIntent',resourceId:requestId,providerModelId:MODEL_ID,dataClass:'Confidential',context:{intent,currentState,userId}},
    policies,providerRegistry,aiUseCases,
    contextPolicy:{allowedFields:['intent','currentState','userId'],pseudonymizeFields:['userId']},
    invokeModel:async authorized=>{
      const response=await fetchImpl('https://api.openai.com/v1/chat/completions',{
        method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+apiKey},
        body:JSON.stringify({
          model:MODEL,max_completion_tokens:2600,
          messages:[
            {role:'system',content:SYSTEM},
            {role:'user',content:`WENS:\\n${authorized.context.intent}\\n\\nHUIDIGE CONFIGURATIE:\\n${JSON.stringify(authorized.context.currentState||{})}`}
          ],
          response_format:{type:'json_object'}
        })
      });
      if(!response.ok)throw new Error(`OPENAI_CONNECTOR_GUIDE_${response.status}`);
      const data=await response.json();
      if(data?.choices?.[0]?.message?.refusal)throw new Error('OPENAI_REFUSAL');
      const text=String(data?.choices?.[0]?.message?.content||'').trim();
      if(!text)throw new Error('OPENAI_CONNECTOR_GUIDE_EMPTY');
      return {type:'Observation',text,provenance:{source:'connector-guide',providerModelId:MODEL_ID},confidence:.7,containsRestrictedData:false,containsUnexpectedPII:false,providerUsage:data.usage??null};
    }
  });
  const proposal=parseJson(result.text);
  if(result.providerUsage){
    const usage=normalizeProviderTokenUsage({provider:'OpenAI',providerModelId:MODEL_ID,componentKey:'agent:connector-guide',requestId,usage:result.providerUsage,at:new Date().toISOString()});
    try{await (usageStore??createAiUsageStore()).record(usage);}catch{}
  }
  return proposal;
}
