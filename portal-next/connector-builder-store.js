import {createConnectorDraft,normalizeConnectorDraft} from './connector-model.js';

const clone=value=>structuredClone(value);
async function readJson(response){const data=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(new Error(data?.error||`HTTP_${response.status}`),{status:response.status,data});return data;}

export function createConnectorBuilderStore({fetchFn=globalThis.fetch}={}){
  if(typeof fetchFn!=='function')throw new TypeError('fetchFn required');
  const state={connectors:[],draft:null,testResult:null,executions:[],reviewQueue:[],status:'idle',error:null};
  const api=async(path,options={})=>readJson(await fetchFn(path,{credentials:'include',headers:{'content-type':'application/json',...(options.headers||{})},...options}));
  return {
    getState:()=>state,
    async load(){state.status='loading';try{state.connectors=await api('/api/connectors');state.status='ready';state.error=null;return state.connectors;}catch(error){state.status='error';state.error=error;throw error;}},
    startTemplate(templateId){state.draft=createConnectorDraft(templateId);state.testResult=null;state.error=null;return state.draft;},
    updateDraft(mutator){if(!state.draft)throw new Error('DRAFT_REQUIRED');const working=clone(state.draft);const result=mutator(working);state.draft=normalizeConnectorDraft(result||working);state.testResult=null;return state.draft;},
    async saveDraft(){if(!state.draft)throw new Error('DRAFT_REQUIRED');const id=state.draft.id;const path=id?`/api/connectors/${encodeURIComponent(id)}/draft`:'/api/connectors';const method=id?'PUT':'POST';const saved=await api(path,{method,body:JSON.stringify(state.draft)});state.draft=normalizeConnectorDraft(saved);const index=state.connectors.findIndex(c=>c.id===saved.id);if(index>=0)state.connectors[index]=saved;else state.connectors.unshift(saved);return state.draft;},
    async runTest(sample){if(!state.draft?.id)throw new Error('SAVED_DRAFT_REQUIRED');const result=await api(`/api/connectors/${encodeURIComponent(state.draft.id)}/test`,{method:'POST',body:JSON.stringify({sample})});state.testResult=result;return result;},
    async activate(){if(!state.draft?.id)throw new Error('SAVED_DRAFT_REQUIRED');const result=await api(`/api/connectors/${encodeURIComponent(state.draft.id)}/activate`,{method:'POST',body:JSON.stringify({testExecutionId:state.testResult?.evidence?.testExecutionId||null})});state.draft=normalizeConnectorDraft(result);return state.draft;},
    async loadExecutions(){if(!state.draft?.id)return[];state.executions=await api(`/api/connectors/${encodeURIComponent(state.draft.id)}/executions`);return state.executions;},
    async loadReviewQueue(){state.reviewQueue=await api('/api/connectors/review-queue');return state.reviewQueue;}
  };
}
