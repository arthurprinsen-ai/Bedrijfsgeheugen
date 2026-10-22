// Full non-destructive 50-column semantic parity on a DISTINCT isolated Supabase preview.
// This script never deploys, overwrites production views, publishes content or exposes PII.
// Precondition: preview restored with representative authorized data from >=2 tenants.
// Actual two authenticated customer HTTP isolation proofs are an additional separate gate.
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {URL} from 'node:url';

const migrationFile='supabase/migrations/20261022120800_p0_4215_person_intelligence_once.sql';
const previewRef=process.env.P0_4215_PREVIEW_PROJECT_REF;
const previewUrl=process.env.P0_4215_PREVIEW_DATABASE_URL;
const productionRef='adhjwmvyoixzjtmiroln';
const abort=(why)=>{process.stderr.write('P0_4215_BUYING_FULL_PARITY_BLOCKED: '+why+'\n');process.exit(1);};
if(process.env.P0_4215_PARITY_ENV!=='isolated-preview')abort('explicit isolated-preview environment required');
if(!previewRef||!/^[a-z0-9]{15,30}$/.test(previewRef)||previewRef===productionRef)abort('independent preview ref required');
if(!previewUrl)abort('preview connection URL missing');
let url;try{url=new URL(previewUrl);}catch{abort('invalid preview DB URL');}
if(!['postgres:','postgresql:'].includes(url.protocol))abort('postgres connection required');
if(!url.hostname.includes(previewRef)&&!decodeURIComponent(url.username).includes(previewRef))
 abort('URL not scoped to exact isolated preview ref');
const source=readFileSync(migrationFile,'utf8');
const startTag='CREATE OR REPLACE VIEW public.powerhouse_buying_window_v2 WITH (security_invoker=true) AS';
const endMarker='\n-- Match the existing service-role-only internal view boundary on this migration.';
const begin=source.indexOf(startTag),end=source.indexOf(endMarker,begin);
if(begin<0||end<begin)abort('candidate view cannot be parsed separately from the REVOKE/DO migration statements');
const candidateBody=source.slice(begin+startTag.length,end).trim();
const cacheCte='WITH person_intelligence_cache AS MATERIALIZED (SELECT * FROM public.powerhouse_person_intelligence_v1), base AS';
const cacheSource='FROM person_intelligence_cache p1';
if(!candidateBody.endsWith(';')||candidateBody.split(cacheCte).length!==2||
   candidateBody.split(cacheSource).length!==2)
 abort('candidate person-cache rewrite cannot be reconstructed safely');
const baselineBody=candidateBody.replace(cacheCte,'WITH base AS')
  .replace(cacheSource,'FROM powerhouse_person_intelligence_v1 p1');
if(/\b(REVOKE|GRANT|ALTER|DROP|DO)\b/i.test(candidateBody))
 abort('view extraction included a non-view statement');
const baselineHash='2ce1ab1122390af0f51c5aa8b318600f';
const candidateHash='6a7a20df1f24b4333986ba9b2da09314';
// The provider can already have applied the migration. In that case reconstruct the
// immutable ORIGINAL view as a transaction-scoped temp view, never overwrite public.
// Both temp view definitions are canonical-hash checked before comparing actual rows.
const baselineSql='CREATE TEMP VIEW p0_4215_buying_baseline WITH (security_invoker=true) AS\n'+baselineBody;
const candidateSql='CREATE TEMP VIEW p0_4215_buying_candidate WITH (security_invoker=true) AS\n'+candidateBody;
const sql=[
 'BEGIN ISOLATION LEVEL REPEATABLE READ;',
 "SET LOCAL statement_timeout='180s';",
 "SET LOCAL lock_timeout='2s';",
 "SET LOCAL search_path=public,pg_temp;",
 baselineSql,
 candidateSql,
 'DO $integrity$',
 'DECLARE installed_hash text; old_hash text; new_hash text;',
 'BEGIN',
 " SELECT md5(pg_get_viewdef('public.powerhouse_buying_window_v2'::regclass,true)) INTO installed_hash;",
 " SELECT md5(pg_get_viewdef('pg_temp.p0_4215_buying_baseline'::regclass,true)) INTO old_hash;",
 " SELECT md5(pg_get_viewdef('pg_temp.p0_4215_buying_candidate'::regclass,true)) INTO new_hash;",
 " IF old_hash<>'2ce1ab1122390af0f51c5aa8b318600f' OR new_hash<>'6a7a20df1f24b4333986ba9b2da09314' THEN",
 " RAISE EXCEPTION 'BUYING_RECONSTRUCTED_SOURCE_HASH_MISMATCH'; END IF;",
 " IF installed_hash NOT IN (old_hash,new_hash) THEN",
 " RAISE EXCEPTION 'BUYING_DEPLOYED_SOURCE_DRIFT'; END IF;",
 " IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid='public.powerhouse_buying_window_v2'::regclass AND 'security_invoker=true'=ANY(reloptions)) THEN",
 " RAISE EXCEPTION 'BUYING_SECURITY_INVOKER_MISSING'; END IF;",
 " IF has_table_privilege('anon','public.powerhouse_buying_window_v2','SELECT') OR has_table_privilege('authenticated','public.powerhouse_buying_window_v2','SELECT') THEN",
 " RAISE EXCEPTION 'BUYING_BROWSER_READ_BOUNDARY_DRIFT'; END IF;",
 'END $integrity$;',
'CREATE TEMP TABLE p0_old ON COMMIT DROP AS SELECT * FROM pg_temp.p0_4215_buying_baseline;',
 'CREATE TEMP TABLE p0_new ON COMMIT DROP AS SELECT * FROM pg_temp.p0_4215_buying_candidate;',
 'DO $parity$',
 'DECLARE old_shape jsonb; new_shape jsonb; old_rows bigint; new_rows bigint;',
 ' difference_count bigint; distinct_old bigint; distinct_new bigint;',
 'BEGIN',
 " SELECT jsonb_agg(jsonb_build_array(attnum,attname,format_type(atttypid,atttypmod)) ORDER BY attnum)",
 " INTO old_shape FROM pg_attribute WHERE attrelid='pg_temp.p0_old'::regclass AND attnum>0 AND NOT attisdropped;",
 " SELECT jsonb_agg(jsonb_build_array(attnum,attname,format_type(atttypid,atttypmod)) ORDER BY attnum)",
 " INTO new_shape FROM pg_attribute WHERE attrelid='pg_temp.p0_new'::regclass AND attnum>0 AND NOT attisdropped;",
 " IF old_shape IS DISTINCT FROM new_shape OR jsonb_array_length(old_shape)<>50 THEN",
 " RAISE EXCEPTION 'ALL_50_COLUMN_SCHEMA_PARITY_FAILED'; END IF;",
 " SELECT count(*),count(DISTINCT opportunity_key) INTO old_rows,distinct_old FROM pg_temp.p0_old;",
 " SELECT count(*),count(DISTINCT opportunity_key) INTO new_rows,distinct_new FROM pg_temp.p0_new;",
 " IF old_rows=0 OR old_rows<>new_rows OR old_rows<>distinct_old OR new_rows<>distinct_new THEN",
 " RAISE EXCEPTION 'BUYING_EMPTY_OR_DUPLICATE_OR_ROWCOUNT_DRIFT'; END IF;",
 ' SELECT count(*) INTO difference_count FROM (',
 ' (SELECT to_jsonb(o) AS row_value FROM pg_temp.p0_old o',
 '  EXCEPT ALL SELECT to_jsonb(n) FROM pg_temp.p0_new n)',
 ' UNION ALL',
 ' (SELECT to_jsonb(n) FROM pg_temp.p0_new n',
 '  EXCEPT ALL SELECT to_jsonb(o) FROM pg_temp.p0_old o)',
 ' ) diffs;',
 " IF difference_count<>0 THEN RAISE EXCEPTION 'BUYING_ALL_50_COLUMN_BIDIRECTIONAL_PARITY_FAILED: %',difference_count; END IF;",
 ' SELECT count(*) INTO difference_count FROM (',
 ' SELECT status,buying_window_state,count(*) AS rows_count,',
 ' sum(expected_commercial_value_eur) AS forecast_eur,',
 ' sum(commercial_progression_probability) AS progression,',
 ' sum(buying_window_score) AS buying_score,',
 ' sum(buying_window_confidence) AS confidence',
 ' FROM pg_temp.p0_old GROUP BY status,buying_window_state',
 ' EXCEPT ALL',
 ' SELECT status,buying_window_state,count(*),',
 ' sum(expected_commercial_value_eur),sum(commercial_progression_probability),',
 ' sum(buying_window_score),sum(buying_window_confidence)',
 ' FROM pg_temp.p0_new GROUP BY status,buying_window_state',
 ' ) aggregate_diff;',
 " IF difference_count<>0 THEN RAISE EXCEPTION 'BUYING_FINANCIAL_AGGREGATE_PARITY_FAILED'; END IF;",
 " RAISE NOTICE 'P0_4215_BUYING_FULL_PARITY_PASSED: % rows, 50 columns, zero mismatches; independent tenant HTTP gates not covered',old_rows;",
 'END $parity$;',
 'ROLLBACK;'
].join('\n');
const childResult=spawnSync('psql',['-X','-v','ON_ERROR_STOP=1','-q','-d',previewUrl],{
 input:sql,encoding:'utf8',timeout:900000,maxBuffer:1024*1024,
 env:{...globalThis.process?.env,PGCONNECT_TIMEOUT:'10',PGOPTIONS:'-c application_name=p0_4215_buying_full_parity'}
});
if(childResult.error)abort(childResult.error.code==='ENOENT'?'psql client unavailable':childResult.error.message);
if(childResult.status!==0)abort((childResult.stderr||'SQL failed').slice(-2500));
const receipt=(childResult.stderr||'').split('\n').filter(x=>x.includes('P0_4215_BUYING_FULL_PARITY_PASSED')).join('\n');
if(!receipt)abort('exact parity success receipt missing');
process.stdout.write(receipt+'\n');
