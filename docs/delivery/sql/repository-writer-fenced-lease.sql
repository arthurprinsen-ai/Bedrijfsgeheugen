-- Disposable test and reviewed backend-only deployment. Never apply blindly to production.
CREATE SCHEMA IF NOT EXISTS delivery_control;
CREATE TABLE IF NOT EXISTS delivery_control.repository_writer_lease (
 repository text PRIMARY KEY,
 generation bigint NOT NULL CHECK (generation>0),
 holder text,
 token_digest text,
 valid_until timestamptz NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
REVOKE ALL ON SCHEMA delivery_control FROM PUBLIC;
REVOKE ALL ON delivery_control.repository_writer_lease FROM PUBLIC;
CREATE OR REPLACE FUNCTION delivery_control.acquire_writer_lease(
 p_repository text,p_holder text,p_token_digest text,p_ttl_seconds integer)
RETURNS TABLE(generation bigint,valid_until timestamptz)
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE rec delivery_control.repository_writer_lease%ROWTYPE;
BEGIN
 IF p_repository<>'arthurprinsen-ai/Bedrijfsgeheugen'
 OR p_holder !~ '^[A-Za-z0-9_:/.-]{8,200}$'
 OR p_token_digest !~ '^[0-9a-f]{64}$'
 OR p_ttl_seconds NOT BETWEEN 30 AND 120 THEN
 RAISE EXCEPTION 'INVALID_LEASE_REQUEST';
 END IF;
 INSERT INTO delivery_control.repository_writer_lease AS l
 (repository,generation,holder,token_digest,valid_until)
 VALUES(p_repository,1,p_holder,p_token_digest,clock_timestamp()+make_interval(secs=>p_ttl_seconds))
 ON CONFLICT(repository) DO UPDATE SET
 generation=l.generation+1,holder=excluded.holder,
 token_digest=excluded.token_digest,
 valid_until=clock_timestamp()+make_interval(secs=>p_ttl_seconds),
 updated_at=clock_timestamp()
 WHERE l.valid_until<clock_timestamp()
 RETURNING * INTO rec;
 IF NOT FOUND THEN RAISE EXCEPTION 'LEASE_ALREADY_HELD'; END IF;
 RETURN QUERY SELECT rec.generation,rec.valid_until;
END $$;
CREATE OR REPLACE FUNCTION delivery_control.assert_writer_lease(
 p_repository text,p_holder text,p_token_digest text,p_generation bigint)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM delivery_control.repository_writer_lease l
 WHERE l.repository=p_repository AND l.holder=p_holder
 AND l.token_digest=p_token_digest AND l.generation=p_generation
 AND l.valid_until>clock_timestamp());
$$;
CREATE OR REPLACE FUNCTION delivery_control.renew_writer_lease(
 p_repository text,p_holder text,p_token_digest text,p_generation bigint,p_ttl_seconds integer)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE affected integer;
BEGIN
 IF p_ttl_seconds NOT BETWEEN 30 AND 120 THEN RAISE EXCEPTION 'INVALID_TTL'; END IF;
 UPDATE delivery_control.repository_writer_lease l SET
 valid_until=clock_timestamp()+make_interval(secs=>p_ttl_seconds),
 updated_at=clock_timestamp()
 WHERE l.repository=p_repository AND l.holder=p_holder
 AND l.token_digest=p_token_digest AND l.generation=p_generation
 AND l.valid_until>clock_timestamp();
 GET DIAGNOSTICS affected=ROW_COUNT;
 RETURN affected=1;
END $$;
CREATE OR REPLACE FUNCTION delivery_control.release_writer_lease(
 p_repository text,p_holder text,p_token_digest text,p_generation bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE affected integer;
BEGIN
 UPDATE delivery_control.repository_writer_lease l SET
 valid_until=clock_timestamp(),holder=NULL,token_digest=NULL,
 updated_at=clock_timestamp()
 WHERE l.repository=p_repository AND l.holder=p_holder
 AND l.token_digest=p_token_digest AND l.generation=p_generation
 AND l.valid_until>clock_timestamp();
 GET DIAGNOSTICS affected=ROW_COUNT;
 RETURN affected=1;
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA delivery_control FROM PUBLIC;
-- Provision grants to a vetted backend-only role separately after security review.
