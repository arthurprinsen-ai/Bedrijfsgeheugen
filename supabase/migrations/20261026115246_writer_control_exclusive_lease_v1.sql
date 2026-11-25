CREATE SCHEMA IF NOT EXISTS writer_control;
REVOKE ALL ON SCHEMA writer_control FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS writer_control.authority (
 obligation text PRIMARY KEY,
 generation bigint NOT NULL DEFAULT 0 CHECK (generation >= 0),
 holder text,
 branch text,
 branch_sha text,
 main_sha text,
 expires_at timestamptz NOT NULL DEFAULT '-infinity',
 CHECK (branch_sha IS NULL OR branch_sha ~ '^[0-9a-f]{40}$'),
 CHECK (main_sha IS NULL OR main_sha ~ '^[0-9a-f]{40}$')
);
REVOKE ALL ON writer_control.authority FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION writer_control.acquire(p_obligation text,p_holder text,p_branch text,p_head text,p_main text,p_ttl_seconds integer)
RETURNS TABLE(token bigint, valid_until timestamptz) LANGUAGE plpgsql SECURITY INVOKER AS $func$
BEGIN
 IF p_obligation IS NULL OR length(p_obligation)<1 OR p_holder IS NULL OR length(p_holder)<1
 OR p_branch IS NULL OR length(p_branch)<1 OR p_head !~ '^[0-9a-f]{40}$'
 OR p_main !~ '^[0-9a-f]{40}$' OR p_ttl_seconds NOT BETWEEN 1 AND 300 THEN
  RAISE EXCEPTION 'INVALID_LEASE_REQUEST';
 END IF;
 INSERT INTO writer_control.authority(obligation) VALUES(p_obligation) ON CONFLICT (obligation) DO NOTHING;
 UPDATE writer_control.authority a SET generation=a.generation+1, holder=p_holder, branch=p_branch,
 branch_sha=p_head, main_sha=p_main, expires_at=clock_timestamp()+make_interval(secs=>p_ttl_seconds)
 WHERE a.obligation=p_obligation AND a.expires_at<=clock_timestamp()
 RETURNING a.generation,a.expires_at INTO token,valid_until;
 IF NOT FOUND THEN RAISE EXCEPTION 'EXCLUSIVE_WRITER_LEASE_BUSY'; END IF;
 RETURN NEXT;
END $func$;
CREATE OR REPLACE FUNCTION writer_control.verify(p_obligation text,p_holder text,p_token bigint,p_branch text,p_head text,p_main text)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER AS $func$
 SELECT EXISTS(SELECT 1 FROM writer_control.authority a WHERE a.obligation=p_obligation AND a.holder=p_holder AND a.generation=p_token AND a.branch=p_branch AND a.branch_sha=p_head AND a.main_sha=p_main AND a.expires_at>clock_timestamp());
$func$;
CREATE OR REPLACE FUNCTION writer_control.release(p_obligation text,p_holder text,p_token bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER AS $func$
DECLARE count_rows int;
BEGIN
 UPDATE writer_control.authority a SET expires_at='-infinity',holder=NULL,branch=NULL,branch_sha=NULL,main_sha=NULL
 WHERE a.obligation=p_obligation AND a.holder=p_holder AND a.generation=p_token;
 GET DIAGNOSTICS count_rows=ROW_COUNT;
 RETURN count_rows=1;
END $func$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA writer_control FROM PUBLIC, anon, authenticated;