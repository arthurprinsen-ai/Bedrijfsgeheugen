const CANONICAL_BRAIN_SERVICE_INGEST='canonical-supabase-authority-only';
export default async request=>{
  if(request.method!=='POST') return new Response('Method Not Allowed',{status:405,headers:{allow:'POST'}});
  return Response.json({error:'LEGACY_BRAIN_INGEST_RETIRED',authority:CANONICAL_BRAIN_SERVICE_INGEST,action:'use canonical Brain producer/BG168 path'},{status:410,headers:{'cache-control':'no-store'}});
};
export const config={path:'/api/brain-operating-ingest'};
