import {resolveIdentityTenant,sanitizePortalProjection} from '../read-models/portal-server-state.mjs';

const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});
const RITMES=Object.freeze(['kwartier','uur','dag','week','maand','hand']);
const slug=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48);
const tekst=(v,max=160)=>typeof v==='string'?v.trim().slice(0,max):'';

function lijstUit(status){
  if(Array.isArray(status)) return status;
  if(status&&Array.isArray(status.koppelingen)) return status.koppelingen;
  return [];
}
function statusMet(huidig,koppelingen){
  if(Array.isArray(huidig)||huidig==null) return koppelingen;
  return {...huidig,koppelingen};
}

export function createKoppelingenHandler({getUser,store,now=()=>new Date().toISOString(),maxBytes=200_000}={}){
  if(typeof getUser!=='function') throw new TypeError('getUser is required');
  if(!store?.get||!store?.put) throw new TypeError('store get/put are required');

  return async function handle(request){
    if(!['GET','POST'].includes(request.method))
      return new Response('Method Not Allowed',{status:405,headers:{allow:'GET, POST'}});

    const user=await getUser();
    if(!user?.id) return json({error:'UNAUTHORIZED'},401);
    const tenantId=resolveIdentityTenant(user);
    if(!tenantId) return json({error:'FORBIDDEN'},403);

    const record=await store.get(tenantId);
    if(!record?.data) return json({error:'NOT_FOUND'},404);
    const koppelingen=lijstUit(record.data.integrationStatus);

    if(request.method==='GET')
      return json({tenantId,koppelingen,updatedAt:record.sourceUpdatedAt||record.updatedAt||''});

    if(Number(request.headers.get('content-length')||0)>maxBytes)
      return json({error:'PAYLOAD_TOO_LARGE'},413);
    let body;
    try{body=await request.json()}catch{return json({error:'INVALID_JSON'},400)}
    if(new TextEncoder().encode(JSON.stringify(body)).byteLength>maxBytes)
      return json({error:'PAYLOAD_TOO_LARGE'},413);

    const actie=tekst(body?.actie,24);
    if(!['aanzetten','bijwerken','ronde'].includes(actie)) return json({error:'UNKNOWN_ACTION'},400);

    const sleutel=slug(body?.sleutel||body?.naam);
    if(!sleutel) return json({error:'MISSING_KEY'},400);
    const ritme=RITMES.includes(body?.ritme)?body.ritme:'dag';
    const tijdstip=new Date().toISOString();

    const volgende=koppelingen.filter(k=>slug(k?.sleutel||k?.naam)!==sleutel);
    const bestaand=koppelingen.find(k=>slug(k?.sleutel||k?.naam)===sleutel)||{};

    let kop;
    if(actie==='ronde'){
      const aantal=Number.isFinite(body?.aantal)?Math.max(0,Math.trunc(body.aantal)):0;
      const mislukt=Number.isFinite(body?.mislukt)?Math.max(0,Math.trunc(body.mislukt)):0;
      kop={...bestaand,sleutel,naam:tekst(bestaand.naam||body?.naam)||sleutel,ritme:bestaand.ritme||ritme,
        status:'draait',laatsteRonde:tijdstip,verwerkt:(Number(bestaand.verwerkt)||0)+aantal,laatsteMislukt:mislukt};
    }else{
      kop={...bestaand,sleutel,naam:tekst(body?.naam)||bestaand.naam||sleutel,
        bron:tekst(body?.bron,48)||bestaand.bron||'',omschrijving:tekst(body?.omschrijving)||bestaand.omschrijving||'',
        ritme,status:actie==='aanzetten'?'draait':(bestaand.status||'open'),
        verwerkt:Number(bestaand.verwerkt)||0,laatsteRonde:bestaand.laatsteRonde||'',aangemaakt:bestaand.aangemaakt||tijdstip};
    }
    volgende.push(kop);

    const bestaandeActiviteit=Array.isArray(record.data.activities)?record.data.activities:[];
    const regel={id:`koppeling-${sleutel}-${tijdstip}`,titel:kop.naam,
      omschrijving:actie==='ronde'?`Ronde klaar · ${kop.verwerkt} regels totaal`:`Koppeling ${actie} · ${ritme}`,
      soort:'koppeling',wanneer:tijdstip};
    const activities=[regel,...bestaandeActiviteit].slice(0,200);

    const projection=sanitizePortalProjection(
      {...record.data,integrationStatus:statusMet(record.data.integrationStatus,volgende),activities},
      {tenantId,userId:user.id,now}
    );
    const result=await store.put(tenantId,projection);

    return json({stored:Boolean(result?.stored),stale:Boolean(result?.stale),koppeling:kop,koppelingen:volgende});
  };
}
