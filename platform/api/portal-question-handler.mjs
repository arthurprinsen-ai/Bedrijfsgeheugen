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
   let projectContext='';try{projectContext=JSON.stringify({sourceUpdatedAt:record.sourceUpdatedAt||record.updatedAt||now(),...record.data}).slice(0,maxContext)}catch{projectContext=''}
   if(projectContext.length<20) return reply({antwoord:'Ik zie nog onvoldoende bedrijfsdata om deze vraag betrouwbaar te beantwoorden.'},404);
   try{
     const result=await runAnswer({question:vraag,projectContext,apiKey,system});
     if(!result?.text) throw new Error('empty answer');
     return reply({antwoord:result.text,bron:'Bedrijfsgeheugen serverstate',bijgewerkt:record.sourceUpdatedAt||record.updatedAt||null});
   }catch{return reply({fout:'De vraagfunctie is even niet bereikbaar.'},502)}
 };
}
