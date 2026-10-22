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
const begin=source.indexOf(startTag),end=source.indexOf('\nDO $readback$',begin);
if(begin<0||end<begin)abort('candidate view cannot be parsed');
const candidateSql=source.slice(begin,end).trim().replace(startTag,
 'CREATE TEMP VIEW p0_4215_buying_candidate WITH (security_invoker=true) AS');
if(!candidateSql.endsWith(';'))abort('candidate view definition must terminate in semicolon');

const sql=[
 'BEGIN ISOLATION LEVEL REPEATABLE READ;',
 "SET LOCAL statement_timeout='180s';",
 "SET LOCAL lock_timeout='2s';",
 "SET LOCAL search_path=public,pg_temp;",
 "DO $baseline$ BEGIN IF md5(pg_get_viewdef('public.powerhouse_buying_window_v2'::regclass,true))",
 " <> '2ce1ab1122390af0f51c5aa8b318600f' THEN",
 " RAISE EXCEPTION 'BUYING_BASELINE_DRIFT'; END IF; END $baseline$;",
 'CREATE TEMP TABLE p0_old ON COMMIT DROP AS SELECT * FROM public.powerhouse_buying_window_v2;',
 candidateSql,
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
const process=spawnSync('psql',['-X','-v','ON_ERROR_STOP=1','-q','-d',previewUrl],{
 input:sql,encoding:'utf8',timeout:900000,maxBuffer:1024*1024,
 env:{...globalThis.process?.env,PGCONNECT_TIMEOUT:'10',PGOPTIONS:'-c application_name=p0_4215_buying_full_parity'}
});
if(process.error)abort(process.error.code==='ENOENT'?'psql client unavailable':process.error.message);
if(process.status!==0)abort((process.stderr||'SQL failed').slice(-2500));
const receipt=(process.stderr||'').split('\n').filter(x=>x.includes('P0_4215_BUYING_FULL_PARITY_PASSED')).join('\n');
if(!receipt)abort('exact parity success receipt missing');
process.stdout.write(receipt+'\n');
