// Review-only exact ruleset proposal. No provider IO or authority.
const NAME='powerhouse-exclusive-promotion';
const canonical=()=>({name:NAME,target:'branch',enforcement:'active',bypass_actors:[{actor_id:5916428,actor_type:'Integration',bypass_mode:'pull_request'}],conditions:{ref_name:{include:['refs/heads/main'],exclude:[]}},rules:[{type:'update',parameters:{update_allows_fetch_and_merge:false}}]});
const equal=(a,b)=>{
 if(a===b)return true;
 if(a===null||b===null||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
 const ak=Object.keys(a).sort(),bk=Object.keys(b).sort();
 return ak.length===bk.length&&ak.every((k,i)=>k===bk[i]&&equal(a[k],b[k]));
};
export function reviewExclusiveRulesetProposal(json){
 const result=(state)=>Object.freeze({state,mutationAuthority:false,providerEnforced:false,activationAuthorized:false});
 if(typeof json!=='string'||json.length>8192)return result('PROPOSAL_INPUT_INVALID');
 let candidate;try{candidate=JSON.parse(json)}catch{return result('PROPOSAL_INPUT_INVALID')}
 if(!equal(candidate,canonical()))return result('PROPOSAL_SHAPE_DENIED');
 return result('EXACT_PROPOSAL_SHAPE_REVIEW_ONLY');
}
// Return canonical bytes, not caller-provided bytes. Never submit to an API.
export function exclusiveRulesetProposalBytes(){return JSON.stringify(canonical());}
