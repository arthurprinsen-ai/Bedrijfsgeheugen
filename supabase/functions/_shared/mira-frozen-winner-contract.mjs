// One frozen winner governs Instagram media and caption lineage. Never replace
// an externally sourced daily problem with an unrelated modulo PH-P rotation.
import {MIRA_CASES,selectMiraProblem} from './mira-entrepreneur-caption.mjs';

const clean = value => String(value ?? '').trim();
const blocked = (code,winnerId='') => ({ok:false,code,winner_recommendation_id:winnerId||null});

export function resolveMiraFrozenWinner(runDate,{winner=null,lineage=null,recommendation=null,job=null}={}){
  const fallback=selectMiraProblem(runDate);
  const claimed=clean(job?.asset_manifest?.daily_winner_recommendation_id||job?.asset_manifest?.recommendation_id);
  if(!winner){
    if(claimed||lineage) return blocked('INSTAGRAM_FROZEN_WINNER_MISSING',claimed);
    return {ok:true,problem:fallback,kind:'pre_freeze_legacy',winner_recommendation_id:null};
  }
  const id=clean(winner.recommendation_id);
  if(!id||!lineage||clean(lineage.run_date)!==runDate||
    !['WINNER_FROZEN','LIVE_PROVEN'].includes(clean(lineage.state))||
    clean(lineage.winner_recommendation_id)!==id||
    clean(recommendation?.recommendation_id)!==id||
    (claimed&&claimed!==id)) return blocked('INSTAGRAM_FROZEN_WINNER_LINEAGE_CONFLICT',id);
  const evidence=recommendation?.evidence||{};
  const source=lineage.source_evidence||{};
  if(clean(recommendation?.status)!=='accepted'||
    evidence.source_backed!==true||
    !clean(source.source_hash)||
    !clean(source.source_url).startsWith('https://')||
    clean(source.source_url)!==clean(evidence.source_url)||
    !clean(evidence.source_title))return blocked('INSTAGRAM_FROZEN_SOURCE_PROVENANCE_UNVERIFIED',id);
  // This source explicitly prohibits converting a private daily-life problem
  // into an invented business/portal problem. A distinct, approved source-led
  // creative/caption contract must exist before it can be released.
  if(evidence.forced_business_bridge_forbidden===true||
    evidence.office_problem_attribution_forbidden===true)
    return blocked('SOURCE_BACKED_MIRA_SCENE_ROUTE_REQUIRED',id);
  const approvedId=clean(evidence.approved_canonical_problem_id);
  const approvedScene=clean(evidence.approved_mira_scene);
  const problem=MIRA_CASES.find(candidate=>candidate.id===approvedId);
  if(!problem)return blocked('CANONICAL_WINNER_NOT_LIBRARY_MAPPED',id);
  if(!approvedScene||approvedScene!==problem.scene)
    return blocked('WINNER_SCENE_UNVERIFIED',id);
  return {ok:true,kind:'approved_frozen_library_mapping',problem,
    winner_recommendation_id:id,source_url:source.source_url,source_hash:source.source_hash};
}
