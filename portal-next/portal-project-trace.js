const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const verified=node=>node?.status==='verified'&&(Array.isArray(node.evidence)?node.evidence.filter(Boolean).length>0:true);

export function renderProjectTrace({flow={}}={}){
  const stages=[
    ['Offerte',{status:'verified',evidence:['source']}],
    ['Datahub',flow.datahub],
    ['AI Brain',flow.brain],
    ['Powerhouse',(flow.powerhouse||[]).find(item=>verified(item))||null],
    ['Module',flow.module],
    ['Actie',flow.action],
    ['Outcome',flow.outcome],
    ['Evidence',flow.outcome?.evidence?.length?{status:'verified',evidence:flow.outcome.evidence}:null],
    ['Learning',flow.learning]
  ];
  return `<section class="project-trace" aria-label="Project trace"><div class="project-trace-chain">${stages.map(([label,node])=>`<span class="${verified(node)?'is-active':'is-idle'}"><b>${esc(label)}</b><small>${verified(node)?'Geverifieerd':'Waiting'}</small></span>`).join('<i>→</i>')}</div></section>`;
}
