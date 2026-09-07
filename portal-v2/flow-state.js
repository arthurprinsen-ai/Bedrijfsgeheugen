const ACTIVE = new Set(['running','verified']);
const STOPPED = new Set(['blocked','failed']);

export function deriveFlowState({ source=null, module=null, runtime=null, preview=false }={}) {
  if (!source) return { sourceFlow:false, processingFlow:false, outputFlow:false, status:'idle', reason:'no-source' };

  // A user selection is focus only. It does not claim a live runtime flow.
  if (!runtime && !preview) {
    return { sourceFlow:false, processingFlow:false, outputFlow:false, status:'selected', reason:'no-runtime-evidence' };
  }

  const state = preview ? 'running' : String(runtime?.status || 'idle');
  if (STOPPED.has(state)) {
    return { sourceFlow:true, processingFlow:false, outputFlow:false, status:state, reason:runtime?.reason || state };
  }
  if (!ACTIVE.has(state)) {
    return { sourceFlow:false, processingFlow:false, outputFlow:false, status:state, reason:runtime?.reason || 'not-active' };
  }

  return {
    sourceFlow:true,
    processingFlow:true,
    outputFlow:Boolean(module),
    status:preview ? 'preview' : state,
    reason:preview ? 'explicit-preview' : 'runtime-evidence'
  };
}

export function statusLabel(state) {
  return ({ idle:'Geen stroom', selected:'Geselecteerd', preview:'Voorbeeldflow', running:'Actief', verified:'Geverifieerd', blocked:'Geblokkeerd', failed:'Fout' })[state] || state;
}
