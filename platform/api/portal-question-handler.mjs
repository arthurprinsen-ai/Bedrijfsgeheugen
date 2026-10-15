import {resolveIdentityTenant} from '../read-models/portal-server-state.mjs';

const reply=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});
export function createPortalQuestionHandler({getUser,store,runAnswer,runSelectedAnswer,apiKey,maxQuestion=400,maxContext=60000,system='',now=()=>new Date().toISOString()}={}){
 if(typeof getUser!=='function') throw new TypeError('getUser is required');
 if(!store?.get) throw new TypeError('store.get is required');
 if(typeof runAnswer!=='function') throw new TypeError('runAnswer is required');
 return async request=>{
   if(request.method!=='POST') return new Response('Alleen POST',{status:405,headers:{allow:'POST'}});
   const user=await getUser();
   if(!user?.id) return reply({fout:'Log in om Bedrijfsgeheugen AI te gebruiken.'},401);
   let body;try{body=await request.json()}catch{return reply({fout:'Ongeldige aanvraag.'},400)}
   let vraag=typeof body?.vraag==='string'?body.vraag.trim():'';
   if(vraag.length<3) return reply({fout:'Stel een wat langere vraag.'},400);
   vraag=vraag.slice(0,maxQuestion);
   const tenantId=resolveIdentityTenant(user);
   const record=tenantId?await store.get(tenantId):null;
   if(!record?.data) return reply({antwoord:'Ik zie nog geen bedrijfsdata in je beveiligde Bedrijfsgeheugen. Open het portaal eerst op het apparaat waar je bestaande gegevens staan.'},404);
   let projectContext='';try{projectContext=JSON.stringify({sourceUpdatedAt:record.sourceUpdatedAt||record.updatedAt||now(),...record.data}).slice(0,maxContext)}catch{projectContext=''}
   if(projectContext.length<20) return reply({antwoord:'Ik zie nog onvoldoende bedrijfsdata om deze vraag betrouwbaar te beantwoorden.'},404);
   // A customer-selected model is evaluated by the same attested runtime as
   // the standalone model test. Never fall back to the legacy Anthropic route.
   const prefs=record.data?.portal?.aiModelPreferences;
   const selected=prefs?.requestState==='review_only_not_activated'&&
     Boolean(prefs.defaultModelId||prefs.assignments?.brain);
   if(selected){
     if(typeof runSelectedAnswer!=='function')
       return reply({fout:'Het gekozen model is niet aangesloten.',code:'TENANT_MODEL_ROUTING_REQUIRED'},409);
     try{
       // The context is derived solely from the authenticated server-side
       // projection. No data from body.context, URL tenant or browser overrides it.
       const boundedContext=projectContext.slice(0,9000);
       const answer=await runSelectedAnswer({
         user,tenantId,question:vraag,projectContext:boundedContext
       });
       const result=answer?.payload||{};
       if(!answer?.ok||result.status!=='ANSWERED'||typeof result.answer!=='string')
         return reply({fout:'Het gekozen AI-model is nog niet geautoriseerd of beschikbaar.',code:'TENANT_MODEL_NOT_AVAILABLE',reason:String(result.reason||result.error||'RUNTIME_NOT_VERIFIED').slice(0,90)},answer?.status===503?503:409);
       return reply({antwoord:result.answer,bron:'Geverifieerde tenantgebonden AI-route',
         provider:result.provider,modelId:result.modelId,
         assurance:{status:'grounded',source:'Geauthenticeerde serverprojectie',sourceUpdatedAt:record.sourceUpdatedAt||record.updatedAt||null,
          evidencePolicy:'attested-tenant-model-and-route',claimVerification:'not_independently_verified',
          limitations:['Alleen antwoord op basis van beschikbare tenantgegevens, niet onafhankelijk geverifieerde financiële voorspellingen.']}}); 
     }catch{
       return reply({fout:'De beveiligde AI-koppeling is niet beschikbaar.',code:'TENANT_MODEL_RUNTIME_UNAVAILABLE'},503);
     }
   }
   if(!apiKey)return reply({fout:'De vraagfunctie is nog niet ingesteld.'},500);
   try{
     const result=await runAnswer({question:vraag,projectContext,apiKey,system,tenantId});
     if(!result?.text) throw new Error('empty answer');
     const sourceUpdatedAt=record.sourceUpdatedAt||record.updatedAt||null;
     return reply({antwoord:result.text,bron:'Bedrijfsgeheugen serverstate',bijgewerkt:sourceUpdatedAt,assurance:{status:'grounded',source:'Bedrijfsgeheugen serverstate',sourceUpdatedAt,evidencePolicy:'tenant-bound-server-context-only',claimVerification:'not_independently_verified',limitations:['Het antwoord is brongebonden aan de tenantcontext, maar afzonderlijke claims zijn niet onafhankelijk geverifieerd.','Ontbrekende of verouderde gegevens kunnen het antwoord onvolledig maken.']}});
   }catch(error){if(error?.code==='DATA_SOVEREIGNTY_AI_BLOCKED')return reply({fout:'AI-verwerking is geblokkeerd door je EU-only databeleid.',code:error.code},409);return reply({fout:'De vraagfunctie is even niet bereikbaar.'},502)}
 };
}
