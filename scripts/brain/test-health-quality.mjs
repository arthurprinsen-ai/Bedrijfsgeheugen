import {assessRecord,resolveIdentity} from '../../brain/health/quality.mjs';
import {quarantine} from '../../brain/health/quarantine.mjs';
const malformed=assessRecord({schema_valid:false}); if(malformed.action!=='QUARANTINE') throw new Error('malformed not quarantined');
const stale=assessRecord({schema_valid:true,source_state:'STALE',confidence:.9}); if(!(stale.confidence<.9)) throw new Error('stale confidence unchanged');
const contested=assessRecord({schema_valid:true,source_state:'CONTRADICTED',confidence:.9}); if(contested.truth_status!=='CONTESTED') throw new Error('contradiction not contested');
const unavailable=assessRecord({schema_valid:true,source_state:'UNAVAILABLE',confidence:.8,last_known_good:{value:'x'},age_hours:12}); if(unavailable.action!=='USE_LKG') throw new Error('LKG not used');
const id=resolveIdentity({deterministic_match:false,fuzzy_score:.61}); if(id.status!=='POSSIBLE_MATCH'||id.auto_merge) throw new Error('low confidence identity auto-merged');
const q=quarantine({id:'x'},'schema'); if(!q.replayable||q.active_for_decisions) throw new Error('quarantine semantics wrong');
console.log('health quality tests passed');
