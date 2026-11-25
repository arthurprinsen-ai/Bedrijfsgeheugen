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

-- Repository-wide promotion reservation staging contract; no provider authority.
-- A grant attempt cannot be cleared by expiry. No runtime roles are granted access.
CREATE TABLE IF NOT EXISTS delivery_control.promotion_reservation (
 repository text PRIMARY KEY CHECK (repository='arthurprinsen-ai/Bedrijfsgeheugen'),
 generation bigint NOT NULL CHECK (generation>0),
 revision bigint NOT NULL CHECK (revision>0),
 state text NOT NULL CHECK (state IN ('reserved','prewrite_pending','grant_pending','granted','revoke_pending','idle')),
 holder text NOT NULL,
 pr_number bigint NOT NULL CHECK (pr_number>0),
 head_sha text NOT NULL CHECK (head_sha ~ '^[0-9a-f]{40}$'),
 main_sha text NOT NULL CHECK (main_sha ~ '^[0-9a-f]{40}$'),
 manifest_digest text NOT NULL CHECK (manifest_digest ~ '^[0-9a-f]{64}$'),
 valid_until timestamptz NOT NULL
);
-- Upgrade only the known legacy state check; reject unexpected schema drift.
DO $upgrade$
DECLARE observed text;
BEGIN
 LOCK TABLE delivery_control.promotion_reservation IN ACCESS EXCLUSIVE MODE;
 SELECT pg_get_constraintdef(oid) INTO STRICT observed FROM pg_constraint
 WHERE conrelid='delivery_control.promotion_reservation'::regclass
 AND conname='promotion_reservation_state_check' AND contype='c' AND convalidated;
 IF observed = $old$CHECK ((state = ANY (ARRAY['reserved'::text, 'grant_pending'::text, 'granted'::text, 'revoke_pending'::text, 'idle'::text])))$old$ THEN
  ALTER TABLE delivery_control.promotion_reservation DROP CONSTRAINT promotion_reservation_state_check,
   ADD CONSTRAINT promotion_reservation_state_check CHECK (state IN ('reserved','prewrite_pending','grant_pending','granted','revoke_pending','idle'));
 ELSIF observed <> $new$CHECK ((state = ANY (ARRAY['reserved'::text, 'prewrite_pending'::text, 'grant_pending'::text, 'granted'::text, 'revoke_pending'::text, 'idle'::text])))$new$ THEN
  RAISE EXCEPTION 'UNRECOGNIZED_PROMOTION_STATE_CONSTRAINT';
 END IF;
END $upgrade$;
CREATE TABLE IF NOT EXISTS delivery_control.promotion_reservation_event (
 repository text NOT NULL,
 generation bigint NOT NULL,
 revision bigint NOT NULL,
 action text NOT NULL,
 state text NOT NULL,
 holder text NOT NULL,
 pr_number bigint NOT NULL,
 head_sha text NOT NULL,
 main_sha text NOT NULL,
 manifest_digest text NOT NULL,
 evidence_digest text NOT NULL CHECK (evidence_digest ~ '^[0-9a-f]{64}$'),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(repository,revision)
);
REVOKE ALL ON delivery_control.promotion_reservation,delivery_control.promotion_reservation_event FROM PUBLIC;
CREATE OR REPLACE FUNCTION delivery_control.reserve_promotion(
 p_repository text,p_holder text,p_pr bigint,p_head text,p_main text,p_manifest text,p_ttl integer,p_evidence text)
RETURNS TABLE(generation bigint,revision bigint)
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE rec delivery_control.promotion_reservation%ROWTYPE;
BEGIN
 IF p_repository IS DISTINCT FROM 'arthurprinsen-ai/Bedrijfsgeheugen' OR
 p_holder IS NULL OR p_holder !~ '^github-actions:[0-9]+:[0-9]+$' OR
 p_pr IS NULL OR p_pr<1 OR p_head IS NULL OR p_head !~ '^[0-9a-f]{40}$' OR
 p_main IS NULL OR p_main !~ '^[0-9a-f]{40}$' OR
 p_manifest IS NULL OR p_manifest !~ '^[0-9a-f]{64}$' OR
 p_evidence IS NULL OR p_evidence !~ '^[0-9a-f]{64}$' OR
 p_ttl IS NULL OR p_ttl NOT BETWEEN 30 AND 120 THEN RAISE EXCEPTION 'INVALID_PROMOTION_RESERVATION'; END IF;
 INSERT INTO delivery_control.promotion_reservation AS r
 (repository,generation,revision,state,holder,pr_number,head_sha,main_sha,manifest_digest,valid_until)
 VALUES(p_repository,1,1,'reserved',p_holder,p_pr,p_head,p_main,p_manifest,clock_timestamp()+make_interval(secs=>p_ttl))
 ON CONFLICT(repository) DO UPDATE SET generation=r.generation+1,revision=r.revision+1,
 state='reserved',holder=excluded.holder,pr_number=excluded.pr_number,head_sha=excluded.head_sha,
 main_sha=excluded.main_sha,manifest_digest=excluded.manifest_digest,valid_until=excluded.valid_until
 WHERE r.state='idle' RETURNING * INTO rec;
 IF NOT FOUND THEN RAISE EXCEPTION 'PROMOTION_RESERVATION_BUSY'; END IF;
 INSERT INTO delivery_control.promotion_reservation_event(repository,generation,revision,action,state,holder,pr_number,head_sha,main_sha,manifest_digest,evidence_digest)
 VALUES(rec.repository,rec.generation,rec.revision,'reserve',rec.state,rec.holder,rec.pr_number,rec.head_sha,rec.main_sha,rec.manifest_digest,p_evidence);
 RETURN QUERY SELECT rec.generation,rec.revision;
END $$;
CREATE OR REPLACE FUNCTION delivery_control.transition_promotion(
 p_repository text,p_holder text,p_generation bigint,p_revision bigint,p_action text,p_evidence text)
RETURNS TABLE(generation bigint,revision bigint,state text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE rec delivery_control.promotion_reservation%ROWTYPE; next_state text;
BEGIN
 IF p_repository IS DISTINCT FROM 'arthurprinsen-ai/Bedrijfsgeheugen' OR p_holder IS NULL OR
 p_generation IS NULL OR p_revision IS NULL OR p_action IS NULL OR
 p_evidence IS NULL OR p_evidence !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'INVALID_PROMOTION_TRANSITION'; END IF;
 SELECT * INTO rec FROM delivery_control.promotion_reservation r WHERE r.repository=p_repository FOR UPDATE;
 IF NOT FOUND OR rec.holder IS DISTINCT FROM p_holder OR rec.generation<>p_generation OR rec.revision<>p_revision THEN
 RAISE EXCEPTION 'PROMOTION_RESERVATION_CAS_MISMATCH'; END IF;
 next_state:=CASE
 WHEN rec.state='reserved' AND p_action='prepare_grant' AND rec.valid_until>clock_timestamp() THEN 'grant_pending'
 WHEN rec.state='reserved' AND p_action='release_unused' THEN 'idle'
 WHEN rec.state='grant_pending' AND p_action='record_grant_readback' THEN 'granted'
 WHEN rec.state IN ('grant_pending','granted') AND p_action='prepare_revoke' THEN 'revoke_pending'
 WHEN rec.state='revoke_pending' AND p_action='record_revocation_readback' THEN 'idle'
 ELSE NULL END;
 IF next_state IS NULL THEN RAISE EXCEPTION 'PROMOTION_TRANSITION_DENIED'; END IF;
 UPDATE delivery_control.promotion_reservation r SET state=next_state,revision=r.revision+1
 WHERE r.repository=p_repository AND r.generation=p_generation AND r.revision=p_revision RETURNING * INTO rec;
 IF NOT FOUND THEN RAISE EXCEPTION 'PROMOTION_RESERVATION_CAS_MISMATCH'; END IF;
 INSERT INTO delivery_control.promotion_reservation_event(repository,generation,revision,action,state,holder,pr_number,head_sha,main_sha,manifest_digest,evidence_digest)
 VALUES(rec.repository,rec.generation,rec.revision,p_action,rec.state,rec.holder,rec.pr_number,rec.head_sha,rec.main_sha,rec.manifest_digest,p_evidence);
 RETURN QUERY SELECT rec.generation,rec.revision,rec.state;
END $$;
REVOKE ALL ON FUNCTION delivery_control.reserve_promotion(text,text,bigint,text,text,text,integer,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION delivery_control.transition_promotion(text,text,bigint,bigint,text,text) FROM PUBLIC;
-- Evidence digests are audit references, not provider proof. No live adapter or grant.

-- Staging-only: exact immutable prewrite intent, no release or grant.
CREATE TABLE IF NOT EXISTS delivery_control.promotion_prewrite_intent (
 repository text NOT NULL CHECK(repository='arthurprinsen-ai/Bedrijfsgeheugen'),
 generation bigint NOT NULL CHECK(generation>0),
 revision bigint NOT NULL CHECK(revision>0),
 holder text NOT NULL,
 pr_number bigint NOT NULL CHECK(pr_number>0),
 head_sha text NOT NULL CHECK(head_sha ~ '^[0-9a-f]{40}$'),
 main_sha text NOT NULL CHECK(main_sha ~ '^[0-9a-f]{40}$'),
 branch text NOT NULL CHECK(branch<>'' AND branch<>'main'),
 obligation text NOT NULL CHECK(obligation<>''),
 commit_sha text NOT NULL CHECK(commit_sha ~ '^[0-9a-f]{40}$' AND commit_sha<>head_sha AND commit_sha<>main_sha),
 tree_sha text NOT NULL CHECK(tree_sha ~ '^[0-9a-f]{40}$'),
 manifest_digest text NOT NULL CHECK(manifest_digest ~ '^[0-9a-f]{64}$'),
 intent_digest text NOT NULL CHECK(intent_digest ~ '^[0-9a-f]{64}$'),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(repository,generation)
);
REVOKE ALL ON delivery_control.promotion_prewrite_intent FROM PUBLIC;
CREATE OR REPLACE FUNCTION delivery_control.prepare_prewrite(
 p_repository text,p_holder text,p_generation bigint,p_revision bigint,p_pr bigint,
 p_head text,p_main text,p_manifest text,p_branch text,p_obligation text,
 p_commit text,p_tree text,p_evidence text)
RETURNS TABLE(generation bigint,revision bigint,state text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE rec delivery_control.promotion_reservation%ROWTYPE;
BEGIN
 IF p_repository IS DISTINCT FROM 'arthurprinsen-ai/Bedrijfsgeheugen' OR
 p_holder IS NULL OR p_holder !~ '^github-actions:[0-9]+:[0-9]+$' OR
 p_generation IS NULL OR p_revision IS NULL OR p_pr IS NULL OR
 p_head IS NULL OR p_main IS NULL OR p_manifest IS NULL OR
 p_branch IS NULL OR p_branch='' OR p_branch='main' OR
 p_obligation IS NULL OR btrim(p_obligation)='' OR
 p_commit IS NULL OR p_commit !~ '^[0-9a-f]{40}$' OR p_commit=p_head OR p_commit=p_main OR
 p_tree IS NULL OR p_tree !~ '^[0-9a-f]{40}$' OR
 p_evidence IS NULL OR p_evidence !~ '^[0-9a-f]{64}$'
 THEN RAISE EXCEPTION 'INVALID_PREWRITE_INTENT'; END IF;
 SELECT * INTO rec FROM delivery_control.promotion_reservation r WHERE r.repository=p_repository FOR UPDATE;
 IF NOT FOUND OR rec.holder IS DISTINCT FROM p_holder OR rec.generation<>p_generation OR rec.revision<>p_revision OR
 rec.pr_number<>p_pr OR rec.head_sha<>p_head OR rec.main_sha<>p_main OR rec.manifest_digest<>p_manifest
 THEN RAISE EXCEPTION 'PREWRITE_IDENTITY_CAS_MISMATCH'; END IF;
 IF rec.state<>'reserved' OR rec.valid_until<=clock_timestamp() THEN RAISE EXCEPTION 'PREWRITE_STATE_DENIED'; END IF;
 UPDATE delivery_control.promotion_reservation r SET state='prewrite_pending',revision=r.revision+1
 WHERE r.repository=p_repository AND r.generation=p_generation AND r.revision=p_revision RETURNING * INTO rec;
 IF NOT FOUND THEN RAISE EXCEPTION 'PREWRITE_IDENTITY_CAS_MISMATCH'; END IF;
 INSERT INTO delivery_control.promotion_prewrite_intent(repository,generation,revision,holder,pr_number,head_sha,main_sha,branch,obligation,commit_sha,tree_sha,manifest_digest,intent_digest)
 VALUES(rec.repository,rec.generation,rec.revision,rec.holder,rec.pr_number,rec.head_sha,rec.main_sha,p_branch,p_obligation,p_commit,p_tree,rec.manifest_digest,p_evidence);
 INSERT INTO delivery_control.promotion_reservation_event(repository,generation,revision,action,state,holder,pr_number,head_sha,main_sha,manifest_digest,evidence_digest)
 VALUES(rec.repository,rec.generation,rec.revision,'prepare_prewrite',rec.state,rec.holder,rec.pr_number,rec.head_sha,rec.main_sha,rec.manifest_digest,p_evidence);
 RETURN QUERY SELECT rec.generation,rec.revision,rec.state;
END $$;
REVOKE ALL ON FUNCTION delivery_control.prepare_prewrite(text,text,bigint,bigint,bigint,text,text,text,text,text,text,text,text) FROM PUBLIC;
-- The existing transition function deliberately has NO exit from prewrite_pending.
-- Provider-verified resolution and exclusive release authority are still required.
