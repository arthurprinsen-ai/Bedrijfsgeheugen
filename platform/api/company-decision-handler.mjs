import {resolveIdentityTenant} from '../read-models/portal-server-state.mjs';
import {principalFromUser} from '../../brain/operating-loop/object-access-policy.mjs';

const reply=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','vary':'authorization, cookie'}});
const text=value=>value==null?'':String(value).trim();
const list=value=>Array.isArray(value)?value.filter(Boolean).map(String):[];
const amount=value=>Number.isFinite(Number(value))?Number(value):0;
const COMMANDS=new Set(['APPROVE','REJECT','ASSIGN','START','COMPLETE','RECORD_COST','RECORD_OUTCOME']);

function eventId(command,decisionId,idempotencyKey,suffix=''){
  return `company:${command.toLowerCase()}:${decisionId}:${idempotencyKey}${suffix?`:${suffix}`:''}`;
}

function baseRecord({command,body,decision,user,tenantId,now}){
  const actor=`user:${user.id}`;
  return {
    tenantId,
    id:eventId(command,decision.id,body.idempotencyKey),
    subjectId:decision.subjectId,
    decisionId:decision.id,
    correlationId:text(body.correlationId)||`company-decision:${decision.id}`,
    actor,
    actorType:'human',
    owner:text(body.owner)||decision.owner||actor,
    observedAt:now,
    source:'portal-v2',
    evidenceIds:list(body.evidenceIds),
    currency:text(body.currency)||'EUR',
    payload:{command,rationale:text(body.rationale)||null}
  };
}

function recordForCommand(context){
  const {command,body,user,now}=context;
  const base=baseRecord(context);
  const actor=`user:${user.id}`;
  if(command==='APPROVE'||command==='REJECT'){
    const state=command==='APPROVE'?'APPROVED':'REJECTED';
    return {...base,type:'Approval',status:state,approvalState:state,approvedBy:actor,approvedAt:now,approvalRationale:text(body.rationale)||null};
  }
  if(command==='ASSIGN') return {...base,type:'Action',status:'ASSIGNED',payload:{...base.payload,assignedTo:text(body.owner)||null}};
  if(command==='START') return {...base,type:'Action',status:'IN_PROGRESS',executed:false};
  if(command==='COMPLETE') return {...base,type:'Action',status:'DONE',executed:true,result:body.result??null};
  if(command==='RECORD_COST') return {...base,type:'Execution',status:'COST_RECORDED',executed:true,costAmount:Math.max(0,amount(body.actualCost))};
  if(command==='RECORD_OUTCOME') return {...base,type:'Outcome',status:body.verified===true?'VERIFIED':'OBSERVED',executed:true,verified:body.verified===true,result:body.result??null,realizedValue:amount(body.realizedValue),payload:{...base.payload,realisedValue:amount(body.realizedValue),realised:body.verified===true,valueUnit:text(body.currency)||'EUR'}};
  throw new TypeError(`Unsupported company decision command: ${command}`);
}

export function createCompanyDecisionHandler({getUser,store,now=()=>new Date().toISOString()}={}){
  if(typeof getUser!=='function') throw new TypeError('getUser is required');
  if(!store?.append||!store?.getProjection) throw new TypeError('company decision store requires append and getProjection');
  return async function handle(request){
    if(request.method!=='POST') return new Response('Method Not Allowed',{status:405,headers:{allow:'POST'}});
    const user=await getUser(request);
    if(!user?.id) return reply({error:'UNAUTHENTICATED'},401);
    const tenantId=resolveIdentityTenant(user);
    if(!tenantId) return reply({error:'TENANT_UNRESOLVED'},403);
    let body;try{body=await request.json();}catch{return reply({error:'INVALID_JSON'},400);}
    const command=text(body?.command).toUpperCase();
    const decisionId=text(body?.decisionId);
    const idempotencyKey=text(body?.idempotencyKey);
    if(!COMMANDS.has(command)) return reply({error:'INVALID_COMMAND'},400);
    if(!decisionId) return reply({error:'DECISION_ID_REQUIRED'},400);
    if(!idempotencyKey) return reply({error:'IDEMPOTENCY_KEY_REQUIRED'},400);

    const principal=principalFromUser(user,tenantId);
    const projection=await store.getProjection(tenantId,{principal});
    const decision=(projection?.companyDecisions||[]).find(item=>item?.id===decisionId);
    if(!decision) return reply({error:'DECISION_NOT_FOUND'},404);
    if(body.expectedStatus!=null&&text(body.expectedStatus)!==text(decision.status)){
      return reply({error:'STALE_DECISION_STATE',expected:text(body.expectedStatus),actual:text(decision.status)},409);
    }

    const timestamp=now();
    const context={command,body,decision,user,tenantId,now:timestamp};
    try{
      const record=recordForCommand(context);
      const first=await store.append({...record,idempotencyKey},{principal});
      const results=[first];
      if(command==='RECORD_OUTCOME'){
        const currency=text(body.currency)||'EUR';
        const realisedValue=amount(body.realizedValue);
        const valueRecord={
          ...baseRecord(context),
          id:eventId(command,decision.id,idempotencyKey,'value'),
          type:'Value',
          status:body.verified===true?'VERIFIED':'OBSERVED',
          executed:true,
          verified:body.verified===true,
          actionId:text(body.actionId)||null,
          result:body.result??null,
          realizedValue:realisedValue,
          payload:{command,realised:body.verified===true,realisedValue,valueUnit:currency,result:body.result??null}
        };
        results.push(await store.append({...valueRecord,idempotencyKey:`${idempotencyKey}:value`},{principal}));
      }
      const duplicate=results.every(item=>item?.duplicate===true);
      return reply({ok:true,command,decisionId,duplicate,events:results.map(item=>item?.record||null)},duplicate?200:201);
    }catch(error){
      if(error?.code==='OBJECT_ACCESS_DENIED') return reply({error:error.code},403);
      if(error?.code==='BRAIN_RECORD_CONFLICT') return reply({error:error.code},409);
      if(error instanceof TypeError) return reply({error:'INVALID_COMMAND_PAYLOAD',message:error.message},400);
      throw error;
    }
  };
}

export {recordForCommand};
