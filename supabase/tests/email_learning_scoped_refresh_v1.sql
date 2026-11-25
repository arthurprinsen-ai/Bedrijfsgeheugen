-- Run only on an isolated disposable database/preview; all fixtures ROLLBACK.
BEGIN;
CREATE TEMP TABLE powerhouse_email_learning_stats (LIKE public.powerhouse_email_learning_stats INCLUDING ALL);
CREATE TEMP TABLE powerhouse_sales_actions (LIKE public.powerhouse_sales_actions INCLUDING ALL);
CREATE TEMP TABLE powerhouse_email_reply_events (LIKE public.powerhouse_email_reply_events INCLUDING ALL);
CREATE TEMP TABLE powerhouse_sales_outcomes (LIKE public.powerhouse_sales_outcomes INCLUDING ALL);
DO $prepare$
DECLARE v_definition text:=pg_get_functiondef('public.powerhouse_refresh_email_learning_stats()'::regprocedure);
BEGIN
 v_definition:=replace(v_definition,'FUNCTION public.powerhouse_refresh_email_learning_stats()','FUNCTION pg_temp.powerhouse_refresh_email_learning_stats()');
 v_definition:=replace(v_definition,'public.powerhouse_email_learning_stats','pg_temp.powerhouse_email_learning_stats');
 v_definition:=replace(v_definition,'public.powerhouse_sales_actions','pg_temp.powerhouse_sales_actions');
 v_definition:=replace(v_definition,'public.powerhouse_email_reply_events','pg_temp.powerhouse_email_reply_events');
 v_definition:=replace(v_definition,'public.powerhouse_sales_outcomes','pg_temp.powerhouse_sales_outcomes');
 EXECUTE v_definition;
END $prepare$;
DO $proof$
DECLARE a1 uuid:=gen_random_uuid(); a2 uuid:=gen_random_uuid();
 k text:=md5('fixture4478|guide|observed|question');
 actual record;
 baseline_sources integer;
BEGIN
 SELECT count(*) INTO baseline_sources FROM pg_temp.powerhouse_sales_actions;
 INSERT INTO pg_temp.powerhouse_email_learning_stats(learning_key,channel,sent_count,evidence)
 VALUES('fixture4478:other-channel','linkedin_dm',71,'{"contract":"foreign-owner"}'),
       ('fixture4478:other-contract','email',72,'{"contract":"foreign-owner"}'),
       ('fixture4478:expired-owned','email',73,'{"contract":"powerhouse-email-reply-learning-v1"}');
 INSERT INTO pg_temp.powerhouse_sales_actions(action_id,dedupe_key,action_type,channel,status,executed_at,evidence)
 VALUES(a1,'fixture4478:action1','autonomous_email','email','done',now(),'{"persuasion_strategy":"fixture4478","give_asset":"guide","trigger_type":"observed","get_ask":"question"}'),
       (a2,'fixture4478:action2','autonomous_email','email','done',now(),'{"persuasion_strategy":"fixture4478","give_asset":"guide","trigger_type":"observed","get_ask":"question"}');
 INSERT INTO pg_temp.powerhouse_email_reply_events(action_id,provider_message_id,sender_email,reply_class,occurred_at)
 VALUES(a1,'fixture4478:reply1','fixture@example.invalid','positive',now()),
       (a1,'fixture4478:reply2','fixture@example.invalid','question',now());
 PERFORM pg_temp.powerhouse_refresh_email_learning_stats();
 SELECT * INTO actual FROM pg_temp.powerhouse_email_learning_stats WHERE learning_key=k;
 IF actual.sent_count IS DISTINCT FROM 2 OR actual.reply_count IS DISTINCT FROM 2
    OR actual.positive_reply_count IS DISTINCT FROM 1 OR actual.question_reply_count IS DISTINCT FROM 1
    OR actual.reply_rate IS DISTINCT FROM 1.0000::numeric
    OR actual.revenue_eur IS DISTINCT FROM 0::numeric THEN
   RAISE EXCEPTION 'EMAIL_LEARNING_SOURCE_AGGREGATION_MISMATCH';
 END IF;
 IF (SELECT count(*) FROM pg_temp.powerhouse_email_learning_stats
     WHERE learning_key IN ('fixture4478:other-channel','fixture4478:other-contract') AND sent_count IN (71,72))<>2 THEN
   RAISE EXCEPTION 'EMAIL_LEARNING_FOREIGN_OWNER_LOSS';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_temp.powerhouse_email_learning_stats WHERE learning_key='fixture4478:expired-owned') THEN
   RAISE EXCEPTION 'EMAIL_LEARNING_EXPIRED_OWNER_ROW_NOT_RETIRED';
 END IF;
 PERFORM pg_temp.powerhouse_refresh_email_learning_stats();
 IF (SELECT count(*) FROM pg_temp.powerhouse_email_learning_stats WHERE learning_key=k AND sent_count=2 AND reply_count=2)<>1 THEN
   RAISE EXCEPTION 'EMAIL_LEARNING_REPEAT_DUPLICATES_OR_DRIFT';
 END IF;
 UPDATE pg_temp.powerhouse_sales_actions SET executed_at=now()-interval '181 days' WHERE action_id IN (a1,a2);
 PERFORM pg_temp.powerhouse_refresh_email_learning_stats();
 IF EXISTS(SELECT 1 FROM pg_temp.powerhouse_email_learning_stats WHERE learning_key=k) THEN
   RAISE EXCEPTION 'EMAIL_LEARNING_EXPIRED_WINDOW_RETAINED';
 END IF;
 IF (SELECT count(*) FROM pg_temp.powerhouse_sales_actions)<>baseline_sources+2
    OR (SELECT count(*) FROM pg_temp.powerhouse_email_reply_events WHERE action_id IN (a1,a2))<>2 THEN
   RAISE EXCEPTION 'EMAIL_LEARNING_SOURCE_EVIDENCE_LOSS';
 END IF;
 -- A foreign owner sharing an active derived key must fail without overwriting it.
 UPDATE pg_temp.powerhouse_sales_actions SET executed_at=now() WHERE action_id IN (a1,a2);
 INSERT INTO pg_temp.powerhouse_email_learning_stats(learning_key,channel,sent_count,evidence)
 VALUES(k,'linkedin_dm',91,'{"contract":"foreign-owner"}');
 BEGIN
  PERFORM pg_temp.powerhouse_refresh_email_learning_stats();
  RAISE EXCEPTION 'EMAIL_LEARNING_COLLISION_NOT_REJECTED';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM<>'EMAIL_LEARNING_FOREIGN_KEY_COLLISION' THEN RAISE; END IF;
 END;
 IF (SELECT sent_count FROM pg_temp.powerhouse_email_learning_stats WHERE learning_key=k)<>91 THEN
  RAISE EXCEPTION 'EMAIL_LEARNING_FOREIGN_COLLISION_OVERWRITTEN';
 END IF;
END $proof$;
ROLLBACK;
SELECT 'EMAIL_LEARNING_SCOPED_REFRESH_PROOF_PASSED' AS result;
