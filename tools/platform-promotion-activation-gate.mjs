import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const clean=v=>String(v??'').trim().toLowerCase();
const uniq=xs=>[...new Set(xs.filter(Boolean))].sort();
const normalizePlatform=v=>clean(v).replace(/-/g,'_');

const fixed=[
 ['netlify/', 'netlify'],['netlify.toml','netlify'],['portal/','portal'],['supabase/','supabase'],
 ['platform/agents/','agent_runtime'],['.github/workflows/','github']
];

export function deriveTouchedPlatforms(changedPaths=[],registry={}){
 const known=(registry.platforms||[]).map(x=>clean(x.platform));
 const found=[];
 for(const raw of changedPaths){
  const path=clean(raw);
  for(const [prefix,platform] of fixed) if(path===prefix||path.startsWith(prefix)) found.push(platform);
  for(const platform of known){
   const dash=platform.replace(/_/g,'-');
   if(path.startsWith(`integrations/${platform}/`)||path.startsWith(`integrations/${dash}/`)||path.startsWith(`${platform}/`)||path.startsWith(`${dash}/`)) found.push(platform);
  }
 }
 return uniq(found);
}

export function evaluatePromotionActivation({changedPaths=[],registry={}}={}){
 const known=new Map((registry.platforms||[]).map(x=>[clean(x.platform),x]));
 const unknown=uniq(changedPaths.map(clean).filter(path=>path.startsWith('integrations/')).map(path=>normalizePlatform(path.split('/')[1])).filter(name=>name&&!known.has(name)));
 const touched=deriveTouchedPlatforms(changedPaths,registry);
 const platforms=touched.map(platform=>{
  const config=known.get(platform);
  return Object.freeze({
   platform,registered:Boolean(config),compatibilityMapping:Boolean(clean(config?.compatibility_mapping)),regressionContract:clean(config?.regression_contract)==='required',directPromotion:config?.direct_promotion===true,authority:clean(config?.authority).toUpperCase(),hardBoundaryPolicy:clean(config?.hard_boundary_policy)
  });
 });
 const blocked=platforms.filter(x=>!x.registered||!x.compatibilityMapping||!x.regressionContract||!x.directPromotion||x.authority!=='BG169'||!x.hardBoundaryPolicy).map(x=>x.platform);
 return Object.freeze({contract:registry.contract||null,conformanceContract:registry.conformance_contract||null,productionCandidateReady:unknown.length===0&&blocked.length===0,platforms:Object.freeze(platforms),unknown:Object.freeze(unknown),blocked:Object.freeze(uniq(blocked))});
}

function arg(args,name,fallback=''){const i=args.indexOf(name);return i>=0?args[i+1]:fallback;}
function diff(base,head){return execFileSync('git',['diff','--name-only',`${base}...${head}`],{encoding:'utf8'}).split(/\r?\n/).filter(Boolean);}

async function main(){
 const args=process.argv.slice(2);const base=arg(args,'--base');const head=arg(args,'--head');
 if(!base||!head) throw new Error('platform promotion activation gate requires --base and --head');
 const registry=JSON.parse(await readFile('config/brain-platform-adapters.json','utf8'));
 const changedPaths=diff(base,head);const result=evaluatePromotionActivation({changedPaths,registry});
 await mkdir('.artifacts',{recursive:true});
 await writeFile('.artifacts/platform-promotion-activation.json',JSON.stringify({...result,base,head,changedPaths,verifiedAt:new Date().toISOString()},null,2)+'\n');
 process.stdout.write(JSON.stringify(result)+'\n');
 if(!result.productionCandidateReady) process.exitCode=78;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) main().catch(error=>{process.stderr.write(JSON.stringify({ok:false,error:error.message})+'\n');process.exitCode=1;});
