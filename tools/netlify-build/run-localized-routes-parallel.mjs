import { spawn } from 'node:child_process';

const requested=Math.max(1,Math.min(4,Number(process.env.STATIC_I18N_BUILD_SHARDS||2)||2));
const networkAllowed=String(process.env.STATIC_I18N_NETWORK||'').trim()==='1';
const shardCount=networkAllowed?1:requested;
const script=new URL('../site-shell/build-localized-routes.mjs',import.meta.url);

function run(args){
  return new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[script.pathname,...args],{stdio:'inherit',env:process.env});
    child.on('error',reject);
    child.on('exit',(code,signal)=>{
      if(code===0) resolve();
      else reject(new Error(`STATIC_I18N_SHARD_FAILED args=${args.join(' ')} code=${code} signal=${signal||''}`));
    });
  });
}

if(shardCount===1){
  await run([]);
}else{
  console.log('STATIC_I18N_PARALLEL_START',JSON.stringify({shards:shardCount}));
  await Promise.all(Array.from({length:shardCount},(_,index)=>
    run([`--shard-index=${index}`,`--shard-count=${shardCount}`])
  ));
  console.log('STATIC_I18N_PARALLEL_DONE',JSON.stringify({shards:shardCount}));
}
