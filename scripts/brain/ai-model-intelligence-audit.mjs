import fs from 'node:fs';
import path from 'node:path';

const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
const now=new Date();
const verified=new Date(catalog.verified_at+'T00:00:00Z');
const ageDays=Math.max(0,Math.floor((now-verified)/86400000));
const staleAfter=14;
const providers=[...new Set(catalog.models.map(m=>m.provider))].sort();
const missingSource=catalog.models.filter(m=>!/^https:\/\//.test(String(m.source||''))).map(m=>m.id);
const missingJurisdiction=catalog.models.filter(m=>!m.jurisdiction).map(m=>m.id);
const unknownEuProcessing=catalog.models.filter(m=>m.eu_processing==null).map(m=>m.id);
const unknownEuStorage=catalog.models.filter(m=>m.eu_storage==null).map(m=>m.id);
const report={
  capability:'ai-model-intelligence-advisor-v1',
  checked_at:now.toISOString(),
  verified_at:catalog.verified_at,
  age_days:ageDays,
  stale_after_days:staleAfter,
  state:ageDays>staleAfter?'STALE_REFRESH_REQUIRED':'FRESH',
  model_count:catalog.models.length,
  provider_count:providers.length,
  providers,
  official_source_coverage:{missing:missingSource,count:catalog.models.length-missingSource.length,total:catalog.models.length},
  governance_unknowns:{jurisdiction:missingJurisdiction,eu_processing:unknownEuProcessing,eu_storage:unknownEuStorage},
  invariant:'unknown governance values remain unknown and cannot be promoted to guaranteed'
};
fs.mkdirSync(path.join('artifacts','quality'),{recursive:true});
fs.writeFileSync(path.join('artifacts','quality','ai-model-intelligence-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
if(missingSource.length||missingJurisdiction.length||ageDays>staleAfter) process.exitCode=1;
