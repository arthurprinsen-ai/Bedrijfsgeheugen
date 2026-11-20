// Server-to-server authorization for a privileged database maintenance function.
// Never accept the public anon/publishable key, user JWT, query token or caller-controlled
// tenant identity. This guard MUST run before reading DB credentials or issuing SQL.
function secretDefault(env) {
  try {
    const raw=env.get('SUPABASE_SECRET_KEYS') || '{}';
    const parsed=JSON.parse(raw);
    return typeof parsed?.default==='string' ? parsed.default : '';
  } catch { return ''; }
}
export async function sameSecret(presented,expected) {
  if(typeof presented!=='string'||typeof expected!=='string'||
     !presented||presented.length>512||expected.length<32)return false;
  const encoder=new TextEncoder();
  const [a,b]=await Promise.all([
    crypto.subtle.digest('SHA-256',encoder.encode(presented)),
    crypto.subtle.digest('SHA-256',encoder.encode(expected))
  ]);
  const aa=new Uint8Array(a),bb=new Uint8Array(b);
  let mismatch=presented.length===expected.length?0:1;
  for(let i=0;i<aa.length;i++)mismatch|=aa[i]^bb[i];
  return mismatch===0;
}
export async function isAuthorizedRepairRequest(req,env) {
  if(req.method!=='POST')return false;
  const authorization=req.headers.get('authorization')||'';
  const legacyBearer=authorization.startsWith('Bearer ')?authorization.slice(7):'';
  const apikey=req.headers.get('apikey')||'';
  const legacyServiceRole=env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  const modernDefaultSecret=secretDefault(env);
  // Legacy service-role Bearer or modern secret API key; both are server-only credentials.
  // A publishable key, anon key or normal authenticated user token never authorizes a repair.
  const [legacyAllowed,newAllowed]=await Promise.all([
    sameSecret(legacyBearer,legacyServiceRole),
    modernDefaultSecret.startsWith('sb_secret_')?sameSecret(apikey,modernDefaultSecret):false
  ]);
  return legacyAllowed||newAllowed;
}

// Named legacy recovery tokens are accepted ONLY when a server-side value was
// explicitly provisioned. Missing env+missing header must never compare equal.
export async function matchesPrivateRecoveryToken(presented,env){
 const expected=env.get('DB_RECOVERY_INSPECT_TOKEN')||'';
 if(typeof presented!=='string'||typeof expected!=='string'||expected.length<32)return false;
 return sameSecret(presented,expected);
}
