const terminal=new Set(['LEARNING_WRITTEN','SUPERSEDED_DEDUPED','ROLLED_BACK_GREEN','BLOCKED_HARD_BOUNDARY']);
const conflictStates=new Set(['RECONCILE_REQUIRED','MERGE_CONFLICT','CONTRACT_OVERLAP','HARD_BOUNDARY']);
const promotionStates=new Set(['MERGED','PRODUCTION_PROMOTING','PRODUCTION_GREEN']);
const clean=v=>String(v??'').trim();

export function projectDeliveryState({changes=[]}={}){
  const rows=(Array.isArray(changes)?changes:[]).map(change=>Object.freeze({
    changeId:clean(change.changeId),owner:clean(change.owner),platform:clean(change.platform).toLowerCase(),state:clean(change.state),
    contractKeys:Object.freeze([...(change.contractKeys||[])].map(clean).filter(Boolean)),
    dependsOn:Object.freeze([...(change.dependsOn||[])].map(clean).filter(Boolean))
  })).filter(change=>change.changeId);
  return Object.freeze({
    active_changes:Object.freeze(rows.filter(change=>!terminal.has(change.state))),
    change_dependencies:Object.freeze(rows.filter(change=>change.dependsOn.length).map(change=>Object.freeze({changeId:change.changeId,dependsOn:change.dependsOn}))),
    conflict_states:Object.freeze(rows.filter(change=>conflictStates.has(change.state)).map(change=>Object.freeze({changeId:change.changeId,state:change.state}))),
    production_promotions:Object.freeze(rows.filter(change=>promotionStates.has(change.state)).map(change=>Object.freeze({changeId:change.changeId,platform:change.platform,state:change.state})))
  });
}
