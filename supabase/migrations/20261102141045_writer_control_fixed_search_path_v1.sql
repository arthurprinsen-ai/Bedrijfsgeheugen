-- Prevent schema resolution drift in the exclusive-writer lease functions.
-- These are SECURITY INVOKER functions: keep their owner, grants, body and lease semantics unchanged.
-- Every table reference is already schema-qualified; built-ins resolve through pg_catalog.
do $hardening$
declare
 v_functions text[] := array[
  'writer_control.acquire(text,text,text,text,text,integer)',
  'writer_control.verify(text,text,bigint,text,text,text)',
  'writer_control.release(text,text,bigint)'
 ];
 v_identity text;
begin
 foreach v_identity in array v_functions loop
  if to_regprocedure(v_identity) is null then
   raise exception 'WRITER_CONTROL_FUNCTION_MISSING:%',v_identity;
  end if;
  if exists (
   select 1 from pg_proc
   where oid=to_regprocedure(v_identity) and prosecdef
  ) then
   raise exception 'WRITER_CONTROL_INVOKER_CONTRACT_VIOLATION:%',v_identity;
  end if;
 end loop;
end
$hardening$;

alter function writer_control.acquire(text,text,text,text,text,integer)
 set search_path = pg_catalog, writer_control;
alter function writer_control.verify(text,text,bigint,text,text,text)
 set search_path = pg_catalog, writer_control;
alter function writer_control.release(text,text,bigint)
 set search_path = pg_catalog, writer_control;

do $assert$
declare v_count integer;
begin
 select count(*) into v_count
 from pg_proc
 where oid = any(array[
  to_regprocedure('writer_control.acquire(text,text,text,text,text,integer)'),
  to_regprocedure('writer_control.verify(text,text,bigint,text,text,text)'),
  to_regprocedure('writer_control.release(text,text,bigint)')
 ])
 and not prosecdef
 and exists(
  select 1 from unnest(coalesce(proconfig,array[]::text[])) setting
  where setting = 'search_path=pg_catalog, writer_control'
 );
 if v_count<>3 then
  raise exception 'WRITER_CONTROL_FIXED_SEARCH_PATH_READBACK_FAILED:%',v_count;
 end if;
end
$assert$;
