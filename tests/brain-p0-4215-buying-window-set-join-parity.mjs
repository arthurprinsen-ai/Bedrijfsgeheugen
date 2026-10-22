// Follow-up to protected #4630. Only isolated preview; NO production DDL or customer data output.
// Two separately authenticated tenant HTTP proofs and genuine positive financial provenance
// remain independent release gates. A successful synthetic preview is not production success.
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {URL} from 'node:url';
const abort=s=>{process.stderr.write('P0_4215_SETJOIN_FULL_PARITY_BLOCKED: '+s+'\n');process.exit(1);};
const ref=process.env.P0_4215_PREVIEW_PROJECT_REF;
const url=process.env.P0_4215_PREVIEW_DATABASE_URL;
if(process.env.P0_4215_PARITY_ENV!=='isolated-preview')abort('isolated preview required');
if(!ref||!(/^[a-z0-9]{15,30}$/.test(ref))||ref==='adhjwmvyoixzjtmiroln')abort('distinct preview ref required');
if(!url)abort('preview DB URL missing');
let parsed;try{parsed=new URL(url);}catch{abort('invalid URL');}
if(!['postgres:','postgresql:'].includes(parsed.protocol))abort('Postgres URL required');
if(!parsed.hostname.includes(ref)&&!decodeURIComponent(parsed.username).includes(ref))abort('URL not bound to preview ref');
const first=readFileSync('supabase/migrations/20261022120800_p0_4215_person_intelligence_once.sql','utf8');
const second=readFileSync('supabase/migrations/20261022222500_p0_4215_person_alias_set_join_fastpath.sql','utf8');
const tag='CREATE OR REPLACE VIEW public.powerhouse_buying_window_v2 WITH (security_invoker=true) AS';
function extract(s,endMarker){
 const i=s.indexOf(tag),e=s.indexOf(endMarker,i);
 if(i<0||e<=i)abort('migration/source drift');
 const body=s.slice(i+tag.length,e).trim();
 if(!body.endsWith(';'))abort('unterminated view');
 return body;
}
const mid=extract(first,'\n-- Match the existing service-role-only internal view boundary on this migration.');
const next=extract(second,'\n-- Preserve private service-side invoker semantics.');
const cte='WITH person_intelligence_cache AS MATERIALIZED (SELECT * FROM public.powerhouse_person_intelligence_v1), base AS (';
const from='FROM person_intelligence_cache p1';
if(mid.split(cte).length!==2||mid.split(from).length!==2||
   !next.includes('person_matches AS')||!next.includes('LEFT JOIN person_matches p'))abort('unexpected source rewrite');
const original=mid.replace(cte,'WITH base AS').replace(from,'FROM powerhouse_person_intelligence_v1 p1');
const sql=[
 'BEGIN ISOLATION LEVEL REPEATABLE READ;',
 "SET LOCAL statement_timeout='180s';",
 "SET LOCAL lock_timeout='2s';",
 'SET LOCAL search_path=public,pg_temp;',
 'CREATE TEMP VIEW p0_original WITH (security_invoker=true) AS '+original,
 'CREATE TEMP VIEW p0_first WITH (security_invoker=true) AS '+mid,
 'CREATE TEMP VIEW p0_fast WITH (security_invoker=true) AS '+next,
 'DO $integrity$ DECLARE h0 text;h1 text;h2 text; installed text;BEGIN',
 " SELECT md5(pg_get_viewdef('pg_temp.p0_original'::regclass,true)) INTO h0;",
 " SELECT md5(pg_get_viewdef('pg_temp.p0_first'::regclass,true)) INTO h1;",
 " SELECT md5(pg_get_viewdef('pg_temp.p0_fast'::regclass,true)) INTO h2;",
 " SELECT md5(pg_get_viewdef('public.powerhouse_buying_window_v2'::regclass,true)) INTO installed;",
 " IF h0<>'2ce1ab1122390af0f51c5aa8b318600f' OR h1<>'6a7a20df1f24b4333986ba9b2da09314' OR h2<>'dcac5a8d2543147d3d5e294cc14a599e' THEN RAISE EXCEPTION 'IMMUTABLE_VIEW_SOURCE_DRIFT'; END IF;",
 " IF installed NOT IN (h0,h1,h2) THEN RAISE EXCEPTION 'PREVIEW_INSTALLED_VIEW_DRIFT'; END IF;",
 " IF has_table_privilege('anon','public.powerhouse_buying_window_v2','SELECT') OR has_table_privilege('authenticated','public.powerhouse_buying_window_v2','SELECT') THEN RAISE EXCEPTION 'VIEW_BROWSER_ACL_DRIFT'; END IF;",
 " IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid='public.powerhouse_buying_window_v2'::regclass AND 'security_invoker=true'=ANY(reloptions)) THEN RAISE EXCEPTION 'VIEW_INVOKER_MISSING'; END IF;",
 'END $integrity$;',
 'CREATE TEMP TABLE p0_old_rows ON COMMIT DROP AS SELECT * FROM pg_temp.p0_original;',
 'CREATE TEMP TABLE p0_mid_rows ON COMMIT DROP AS SELECT * FROM pg_temp.p0_first;',
 'CREATE TEMP TABLE p0_new_rows ON COMMIT DROP AS SELECT * FROM pg_temp.p0_fast;',
 'DO $parity$ DECLARE shape0 jsonb;shape1 jsonb;shape2 jsonb;n0 bigint;n1 bigint;n2 bigint; positive0 bigint;positive2 bigint;diff bigint;BEGIN',
 " SELECT jsonb_agg(jsonb_build_array(attnum,attname,format_type(atttypid,atttypmod)) ORDER BY attnum) INTO shape0 FROM pg_attribute WHERE attrelid='pg_temp.p0_old_rows'::regclass AND attnum>0 AND NOT attisdropped;",
 " SELECT jsonb_agg(jsonb_build_array(attnum,attname,format_type(atttypid,atttypmod)) ORDER BY attnum) INTO shape1 FROM pg_attribute WHERE attrelid='pg_temp.p0_mid_rows'::regclass AND attnum>0 AND NOT attisdropped;",
 " SELECT jsonb_agg(jsonb_build_array(attnum,attname,format_type(atttypid,atttypmod)) ORDER BY attnum) INTO shape2 FROM pg_attribute WHERE attrelid='pg_temp.p0_new_rows'::regclass AND attnum>0 AND NOT attisdropped;",
 " IF shape0 IS DISTINCT FROM shape1 OR shape0 IS DISTINCT FROM shape2 OR jsonb_array_length(shape0)<>50 THEN RAISE EXCEPTION 'FULL_50_COLUMN_SCHEMA_MISMATCH'; END IF;",
 " SELECT count(*) INTO n0 FROM pg_temp.p0_old_rows;",
 " SELECT count(*) INTO n1 FROM pg_temp.p0_mid_rows;",
 " SELECT count(*) INTO n2 FROM pg_temp.p0_new_rows;",
 " IF n0=0 OR n0<>n1 OR n0<>n2 OR n0<>(SELECT count(DISTINCT opportunity_key) FROM pg_temp.p0_old_rows) OR n2<>(SELECT count(DISTINCT opportunity_key) FROM pg_temp.p0_new_rows) THEN RAISE EXCEPTION 'EMPTY_OR_DUPLICATE_OR_ROWCOUNT_DRIFT'; END IF;",
 " SELECT count(*) INTO positive0 FROM pg_temp.p0_old_rows WHERE expected_value_eur>0 AND expected_commercial_value_eur>0;",
 " SELECT count(*) INTO positive2 FROM pg_temp.p0_new_rows WHERE expected_value_eur>0 AND expected_commercial_value_eur>0;",
 " IF positive0=0 OR positive2=0 THEN RAISE EXCEPTION 'EXPECTED_POSITIVE_FINANCIAL_SCENARIO_REQUIRED'; END IF;",
 ' SELECT count(*) INTO diff FROM (',
 ' (SELECT to_jsonb(o) AS entire_row FROM pg_temp.p0_old_rows o EXCEPT ALL SELECT to_jsonb(n) FROM pg_temp.p0_new_rows n)',
 ' UNION ALL',
 ' (SELECT to_jsonb(n) FROM pg_temp.p0_new_rows n EXCEPT ALL SELECT to_jsonb(o) FROM pg_temp.p0_old_rows o)',
 ' UNION ALL',
 ' (SELECT to_jsonb(m) FROM pg_temp.p0_mid_rows m EXCEPT ALL SELECT to_jsonb(n) FROM pg_temp.p0_new_rows n)',
 ' UNION ALL',
 ' (SELECT to_jsonb(n) FROM pg_temp.p0_new_rows n EXCEPT ALL SELECT to_jsonb(m) FROM pg_temp.p0_mid_rows m)',
 ' ) discrepancies;',
 " IF diff<>0 THEN RAISE EXCEPTION 'FULL_50_COLUMN_SETJOIN_PARITY_FAILED: %',diff; END IF;",
 " IF (SELECT sum(expected_commercial_value_eur) FROM pg_temp.p0_old_rows) IS DISTINCT FROM (SELECT sum(expected_commercial_value_eur) FROM pg_temp.p0_new_rows) THEN RAISE EXCEPTION 'FINANCIAL_AGGREGATE_MISMATCH'; END IF;",
 " RAISE NOTICE 'P0_4215_SETJOIN_FULL_PARITY_PASSED: % rows, 50 fields, 0 diffs, positive scenario; tenant HTTP and scheduler still pending',n0;",
 'END $parity$;',
 'ROLLBACK;'
].join('\n');
const out=spawnSync('psql',['-X','-v','ON_ERROR_STOP=1','-q','-d',url],{
 input:sql,encoding:'utf8',timeout:900000,maxBuffer:1024*1024,
 env:{...process.env,PGCONNECT_TIMEOUT:'10',PGOPTIONS:'-c application_name=p0_4215_set_join_full_parity'}
});
if(out.error)abort(out.error.code==='ENOENT'?'psql client missing':out.error.message);
if(out.status!==0)abort((out.stderr||'SQL failed').slice(-2500));
const receipt=(out.stderr||'').split('\n').filter(x=>x.includes('P0_4215_SETJOIN_FULL_PARITY_PASSED')).join('\n');
if(!receipt)abort('missing exact success receipt');
process.stdout.write(receipt+'\n');
