import { spawn } from 'node:child_process';
const statements = new Set([
  'select token, valid_until from writer_control.acquire($1,$2,$3,$4,$5,$6)',
  'select writer_control.verify($1,$2,$3,$4,$5,$6) as verified',
  'select writer_control.release($1,$2,$3) as released',
]);
export function authorizedPgQuery(sql, params) {
  if (!process.env.DATABASE_URL || !statements.has(sql) || !Array.isArray(params)) throw Error('UNAUTHORIZED_SQL');
  const code = `import json,os,sys,psycopg
p=json.loads(sys.stdin.read())
with psycopg.connect(os.environ['DATABASE_URL'], connect_timeout=10) as c:
 with c.cursor() as q:
  q.execute(p['sql'].replace('$1','%s').replace('$2','%s').replace('$3','%s').replace('$4','%s').replace('$5','%s').replace('$6','%s'),p['params'])
  print(json.dumps([dict(zip([x.name for x in q.description],row)) for row in q.fetchall()], default=str))`;
  return new Promise((resolve,reject) => {
    const child=spawn('python3',['-c',code],{env:process.env,stdio:['pipe','pipe','pipe']});
    let out='';
    const timer=setTimeout(()=>child.kill('SIGKILL'),15000);
    child.stdout.on('data',b=>{out+=b;if(out.length>100000)child.kill('SIGKILL');});
    child.stderr.on('data',b=>{if(b.length>100000)child.kill('SIGKILL');});
    child.on('error',reject);
    child.on('close',status=>{clearTimeout(timer);if(status!==0)return reject(Error('POSTGRES_QUERY_FAILED'));try{resolve(JSON.parse(out))}catch{reject(Error('POSTGRES_RESPONSE_INVALID'))}});
    child.stdin.end(JSON.stringify({sql,params}));
  });
}
