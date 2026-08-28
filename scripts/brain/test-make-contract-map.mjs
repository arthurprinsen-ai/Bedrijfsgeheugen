import fs from 'node:fs';
const m=JSON.parse(fs.readFileSync('brain/adapters/make-contract-map.json','utf8'));
for(const key of ['BG156','BG166','BG167','BG168','BG169','BG09','BG14','BG24','BG25','BG180']){
 const x=m.components[key]; if(!x) throw new Error(`missing ${key}`); if(!Array.isArray(x.reads)||!Array.isArray(x.writes)||!x.authority) throw new Error(`incomplete ${key}`);
 if(x.writes.includes('CurrentState')&&!['current_state_projection','production_authority','verified_research_projection','audience_projection'].includes(x.authority)) throw new Error(`${key} unauthorized CurrentState writer`);
 if(x.writes.includes('Outcome')&&!x.requires_trace_lineage) throw new Error(`${key} Outcome lacks lineage requirement`);
}
console.log('make contract map tests passed');
