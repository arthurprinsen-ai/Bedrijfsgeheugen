import {resolveIdentityTenant} from '../read-models/portal-server-state.mjs';

const reply=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});
export function createPortalQuestionHandler({getUser,store,runAnswer,apiKey,maxQuestion=400,maxContext=60000,system='',now=()=>new Date().toISOString()}={}){
 if(typeof getUser!=='function') throw new TypeError('getUser is required');
 if(!store?.get) throw new TypeError('store.get is required');
 if(typeof runAnswer!=='function') throw new TypeError('runAnswer is required');
 return async request=>{
   if(request.method!=='POST') return new Response('Alleen POST',{status:405,headers:{allow:'POST'}});
   const user=await getUser();
   if(!user?.id) return reply({fout:'Log in om Bedrijfsgeheugen AI te gebruiken.'},401);
   if(!apiKey) return reply({fout:'De vraagfunctie is nog niet ingesteld.'},500);
   let body;try{body=await request.json()}catch{return reply({fout:'Ongeldige aanvraag.'},400)}
   let vraag=typeof body?.vraag==='string'?body.vraag.trim():'';
   if(vraag.length<3) return reply({fout:'Stel een wat langere vraag.'},400);
   vraag=vraag.slice(0,maxQuestion);
   const tenantId=resolveIdentityTenant(user);
   const record=tenantId?await store.get(tenantId):null;
   if(!record?.data) return reply({antwoord:'Ik zie nog geen bedrijfsdata in je beveiligde Bedrijfsgeheugen. Open het portaal eerst op het apparaat waar je bestaande gegevens staan.'},404);
   // A tenant-wide AI default must never silently send its data to the legacy
   // Anthropic-only service. The attested tenant AI gateway is separate.
   // No externally supplied model or tenant ID can override this guard.
   const modelPreferences=record.data?.portal?.aiModelPreferences;
   if(modelPreferences?.requestState==='review_only_not_activated'&&
      (modelPreferences.defaultModelId||modelPreferences.assignments?.brain)){
    return reply({fout:'Je organisatie heeft een eigen AI-model gekozen. Deze bestaande vraagfunctie is nog niet gekoppeld aan de goedgekeurde modelroute. Open AI-modellen kiezen om het gekozen Bedrijfsbrein-model te testen.',code:'TENANT_MODEL_ROUTING_REQUIRED'},409);
   }
   let projectContext='';try{projectContext=JSON.stringify({sourceUpdatedAt:record.sourceUpdatedAt||record.updatedAt||now(),...record.data}).slice(0,maxContext)}catch{projectContext=''}
   if(projectContext.length<20) return reply({antwoord:'Ik zie nog onvoldoende bedrijfsdata om deze vraag betrouwbaar te beantwoorden.'},404);
   try{
     const result=await runAnswer({question:vraag,projectContext,apiKey,system,tenantId});
     if(!result?.text) throw new Error('empty answer');
     const sourceUpdatedAt=record.sourceUpdatedAt||record.updatedAt||null;
     return reply({antwoord:result.text,bron:'Bedrijfsgeheugen serverstate',bijgewerkt:sourceUpdatedAt,assurance:{status:'grounded',source:'Bedrijfsgeheugen serverstate',sourceUpdatedAt,evidencePolicy:'tenant-bound-server-context-only',claimVerification:'not_independently_verified',limitations:['Het antwoord is brongebonden aan de tenantcontext, maar afzonderlijke claims zijn niet onafhankelijk geverifieerd.','Ontbrekende of verouderde gegevens kunnen het antwoord onvolledig maken.']}});
   }catch(error){if(error?.code==='DATA_SOVEREIGNTY_AI_BLOCKED')return reply({fout:'AI-verwerking is geblokkeerd door je EU-only databeleid.',code:error.code},409);return reply({fout:'De vraagfunctie is even niet bereikbaar.'},502)}
 };
}
