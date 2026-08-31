import { assertClosedBrainLoop } from './loop-integrity.mjs';

const present=value=>value!==undefined&&value!==null&&value!=='';
const add=(missing,key,condition)=>{if(!condition&&!missing.includes(key)) missing.push(key);};

export function certifyWholeBrainRuntime({records,correlationId,platform,adapterContract,runtimeEvidence}={}){
  const missing=[];
  const evidence=runtimeEvidence||{};
  const source=String(platform||'').trim();
  const adapter=(adapterContract?.platforms||[]).find(item=>item?.platform===source);

  add(missing,'platform_adapter',Boolean(adapter));

  let closure=null;
  try{closure=assertClosedBrainLoop(records,{correlationId});}
  catch(error){add(missing,'whole_brain_lineage_verified',false);closure={complete:false,error:error.message};}

  if(adapter?.capacity_gate==='required') add(missing,'capacity_available',evidence.capacity==='available');

  const executionProof=present(evidence.executionId)
    && evidence.executed===true
    && present(evidence.authority)
    && (!adapter?.authority||evidence.authority===adapter.authority)
    && present(evidence.candidateRevision)
    && present(evidence.verifiedAt);
  add(missing,'execution_proof',executionProof);

  const exactRevision=present(evidence.candidateRevision)
    && present(evidence.activeRevision)
    && evidence.candidateRevision===evidence.activeRevision;
  add(missing,'exact_revision_evidence',exactRevision);

  const readback=evidence.readback||{};
  const exactReadback=readback.verified===true
    && present(readback.executionId)
    && readback.executionId===evidence.executionId
    && present(readback.revision)
    && readback.revision===evidence.candidateRevision
    && readback.revision===evidence.activeRevision;
  add(missing,'exact_runtime_readback',exactReadback);

  const scoped=(Array.isArray(records)?records:[]).filter(record=>record?.correlationId===correlationId);
  const executionRecord=scoped.find(record=>record?.kind==='execution'&&record?.payload?.runtimeExecutionId===evidence.executionId);
  add(missing,'execution_record_evidence',Boolean(executionRecord&&executionRecord.executed===true&&present(executionRecord.result)));

  const verificationRecord=scoped.find(record=>record?.kind==='verification'&&record?.payload?.runtimeExecutionId===evidence.executionId);
  add(missing,'verification_record_evidence',Boolean(verificationRecord&&verificationRecord.verified===true&&verificationRecord.payload?.readbackVerified===true&&verificationRecord.payload?.verifiedRevision===evidence.candidateRevision));

  const realisedValue=scoped.some(record=>record?.kind==='value'&&record.executed===true&&record.verified===true&&record.payload?.realised===true&&Array.isArray(record.evidenceIds)&&record.evidenceIds.length>0);
  add(missing,'verified_value_evidence',realisedValue);

  const green=missing.length===0;
  return Object.freeze({
    status:green?'PROVEN':'NOT_PROVEN',
    green,
    platform:source||null,
    correlationId:correlationId||null,
    missing:Object.freeze(missing),
    evidence:Object.freeze({
      closureComplete:closure?.complete===true,
      executionId:evidence.executionId||null,
      candidateRevision:evidence.candidateRevision||null,
      activeRevision:evidence.activeRevision||null,
      authority:evidence.authority||null,
      readbackVerified:exactReadback,
      verifiedAt:evidence.verifiedAt||null,
    }),
  });
}
