import {createConnectorDraft,normalizeConnectorDraft} from './connector-model.js';

const clone=value=>structuredClone(value);
async function readJson(response){const data=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(new Error(data?.error||`HTTP_${response.status}`),{status:response.status,data});return data;}

export function createConnectorBuilderStore({fetchFn=globalThis.fetch}={}){
  if(typeof fetchFn!=='function')throw new TypeError('fetchFn required');
  const state={connectors:[],readiness:null,draft:null,testResult:null,executions:[],reviewQueue:[],status:'idle',error:null};
  const api=async(path,options={})=>readJson(await fetchFn(path,{credentials:'include',headers:{'content-type':'application/json',...(options.headers||{})},...options}));
  const replaceConnector=saved=>{const index=state.connectors.findIndex(c=>c.id===saved.id);if(index>=0)state.connectors[index]=saved;else if(saved?.id)state.connectors.unshift(saved);};
  return {
    getState:()=>state,
    async load(){state.status='loading';try{state.connectors=await api('/api/connectors');state.status='ready';state.error=null;return state.connectors;}catch(error){state.status='error';state.error=error;throw error;}},
    async loadReadiness(){try{state.readiness=await api('/api/connectors/readiness');return state.readiness;}catch(error){state.readiness=null;throw error;}},
    startTemplate(templateId){state.draft=createConnectorDraft(templateId);state.testResult=null;state.executions=[];state.error=null;return state.draft;},
    updateDraft(mutator){if(!state.draft)throw new Error('DRAFT_REQUIRED');const working=clone(state.draft);const result=mutator(working);state.draft=normalizeConnectorDraft(result||working);state.testResult=null;return state.draft;},
    setSource(source){return this.updateDraft(d=>{d.source={...(d.source||{}),...clone(source),config:{...(d.source?.config||{}),...(source?.config||{})}};return d;});},
    setTarget(target){return this.updateDraft(d=>{d.target={...(d.target||{}),...clone(target),config:{...(d.target?.config||{}),...(target?.config||{})}};return d;});},
    async openConnector(id){const record=await api(`/api/connectors/${encodeURIComponent(id)}`);state.draft=normalizeConnectorDraft(record);state.testResult=null;state.executions=[];state.error=null;return state.draft;},
    async saveDraft(){if(!state.draft)throw new Error('DRAFT_REQUIRED');const id=state.draft.id;const path=id?`/api/connectors/${encodeURIComponent(id)}/draft`:'/api/connectors';const method=id?'PUT':'POST';const saved=await api(path,{method,body:JSON.stringify(state.draft)});state.draft=normalizeConnectorDraft(saved);replaceConnector(saved);return state.draft;},
    async runTest(sample){if(!state.draft?.id)throw new Error('SAVED_DRAFT_REQUIRED');const result=await api(`/api/connectors/${encodeURIComponent(state.draft.id)}/test`,{method:'POST',body:JSON.stringify({sample})});state.testResult=result;return result;},
    async activate(){if(!state.draft?.id)throw new Error('SAVED_DRAFT_REQUIRED');const testExecutionId=state.testResult?.evidence?.testExecutionId;if(!testExecutionId)throw Object.assign(new Error('TEST_EVIDENCE_REQUIRED'),{data:{error:'TEST_EVIDENCE_REQUIRED'}});const result=await api(`/api/connectors/${encodeURIComponent(state.draft.id)}/activate`,{method:'POST',body:JSON.stringify({testExecutionId})});state.draft=normalizeConnectorDraft(result);replaceConnector(result);return state.draft;},
    async pause(reason='MANUAL_PAUSE'){if(!state.draft?.id)throw new Error('SAVED_DRAFT_REQUIRED');const result=await api(`/api/connectors/${encodeURIComponent(state.draft.id)}/pause`,{method:'POST',body:JSON.stringify({reason})});state.draft=normalizeConnectorDraft(result);replaceConnector(result);return state.draft;},
    async loadExecutions(){if(!state.draft?.id)return[];state.executions=await api(`/api/connectors/${encodeURIComponent(state.draft.id)}/executions`);return state.executions;},
    async loadReviewQueue(){state.reviewQueue=await api('/api/connectors/review-queue');return state.reviewQueue;},
    async decideReview(reviewId,decision){const result=await api(`/api/connectors/reviews/${encodeURIComponent(reviewId)}/decision`,{method:'POST',body:JSON.stringify(decision||{})});await this.loadReviewQueue().catch(()=>{});return result;}
  };
}
