#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Must use an isolated disposable PostgreSQL 17 database}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$ROOT/docs/delivery/sql/repository-writer-fenced-lease.sql" >/dev/null
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE g1 bigint;g2 bigint;a text:=repeat('1',64);b text:=repeat('2',64);
BEGIN
 SELECT generation INTO g1 FROM delivery_control.acquire_writer_lease('arthurprinsen-ai/Bedrijfsgeheugen','test-writer-one',a,30);
 IF g1<>1 THEN RAISE EXCEPTION 'generation one failed'; END IF;
 IF NOT delivery_control.assert_writer_lease('arthurprinsen-ai/Bedrijfsgeheugen','test-writer-one',a,g1) THEN RAISE EXCEPTION 'owner assertion failed'; END IF;
 BEGIN
   PERFORM delivery_control.acquire_writer_lease('arthurprinsen-ai/Bedrijfsgeheugen','test-writer-two',b,30);
   RAISE EXCEPTION 'second writer acquired active lease';
 EXCEPTION WHEN raise_exception THEN
   IF SQLERRM <> 'LEASE_ALREADY_HELD' THEN RAISE; END IF;
 END;
 IF delivery_control.renew_writer_lease('arthurprinsen-ai/Bedrijfsgeheugen','test-writer-two',b,g1,30) THEN RAISE EXCEPTION 'unauthorized renewal'; END IF;
 IF delivery_control.release_writer_lease('arthurprinsen-ai/Bedrijfsgeheugen','test-writer-two',b,g1) THEN RAISE EXCEPTION 'unauthorized release'; END IF;
 IF NOT delivery_control.renew_writer_lease('arthurprinsen-ai/Bedrijfsgeheugen','test-writer-one',a,g1,30) THEN RAISE EXCEPTION 'valid renewal failed'; END IF;
 IF NOT delivery_control.release_writer_lease('arthurprinsen-ai/Bedrijfsgeheugen','test-writer-one',a,g1) THEN RAISE EXCEPTION 'valid release failed'; END IF;
 SELECT generation INTO g2 FROM delivery_control.acquire_writer_lease('arthurprinsen-ai/Bedrijfsgeheugen','test-writer-two',b,30);
 IF g2<>g1+1 THEN RAISE EXCEPTION 'fencing not advanced'; END IF;
 IF delivery_control.assert_writer_lease('arthurprinsen-ai/Bedrijfsgeheugen','test-writer-one',a,g1) THEN RAISE EXCEPTION 'stale token valid'; END IF;
END $$;
SQL
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -c "UPDATE delivery_control.repository_writer_lease SET valid_until=clock_timestamp()-interval '1 second' WHERE repository='arthurprinsen-ai/Bedrijfsgeheugen'" >/dev/null
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
set +e
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atqc "SELECT generation FROM delivery_control.acquire_writer_lease('arthurprinsen-ai/Bedrijfsgeheugen','test-writer-three',repeat('3',64),30)" >"$tmp/1" 2>&1 & a=$!
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atqc "SELECT generation FROM delivery_control.acquire_writer_lease('arthurprinsen-ai/Bedrijfsgeheugen','test-writer-four',repeat('4',64),30)" >"$tmp/2" 2>&1 & b=$!
wait "$a"; ea=$?; wait "$b"; eb=$?
set -e
if [[ "$ea" -eq 0 && "$eb" -ne 0 ]]; then :; elif [[ "$eb" -eq 0 && "$ea" -ne 0 ]]; then :; else echo 'Exactly one claimant must win' >&2; exit 1; fi
echo "POSTGRES_LEASE_REPLAY_PASSED"

# Repository-wide promotion staging replay, using the same isolated PostgreSQL service.
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE g bigint; v bigint; s text; r constant text:='arthurprinsen-ai/Bedrijfsgeheugen'; h constant text:='github-actions:1:1'; e constant text:=repeat('a',64);
BEGIN
 SELECT generation,revision INTO g,v FROM delivery_control.reserve_promotion(r,h,1,repeat('1',40),repeat('2',40),e,30,e);
 IF g<>1 OR v<>1 THEN RAISE EXCEPTION 'initial reservation mismatch'; END IF;
 SELECT revision,state INTO v,s FROM delivery_control.transition_promotion(r,h,g,v,'prepare_grant',e);
 IF s<>'grant_pending' THEN RAISE EXCEPTION 'missing intent'; END IF;
 BEGIN
 PERFORM delivery_control.transition_promotion(r,h,g,v-1,'release_unused',e);
 RAISE EXCEPTION 'stale revision accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PROMOTION_RESERVATION_CAS_MISMATCH' THEN RAISE; END IF; END;
 UPDATE delivery_control.promotion_reservation SET valid_until=clock_timestamp()-interval '1 second' WHERE repository=r;
 BEGIN
 PERFORM delivery_control.reserve_promotion(r,'github-actions:2:1',2,repeat('3',40),repeat('2',40),e,30,e);
 RAISE EXCEPTION 'expired unresolved grant was replaced';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PROMOTION_RESERVATION_BUSY' THEN RAISE; END IF; END;
 BEGIN
 PERFORM delivery_control.transition_promotion(r,h,g,v,'release_unused',e);
 RAISE EXCEPTION 'ambiguous grant cleared';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PROMOTION_TRANSITION_DENIED' THEN RAISE; END IF; END;
 SELECT revision,state INTO v,s FROM delivery_control.transition_promotion(r,h,g,v,'prepare_revoke',e);
 IF s<>'revoke_pending' THEN RAISE EXCEPTION 'missing revoke intent'; END IF;
 SELECT revision,state INTO v,s FROM delivery_control.transition_promotion(r,h,g,v,'record_revocation_readback',e);
 IF s<>'idle' THEN RAISE EXCEPTION 'revocation not recorded'; END IF;
 IF (SELECT count(*) FROM delivery_control.promotion_reservation_event WHERE repository=r)<>4 THEN RAISE EXCEPTION 'audit event loss'; END IF;
END $$;
SQL
set +e
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atqc "SELECT generation FROM delivery_control.reserve_promotion('arthurprinsen-ai/Bedrijfsgeheugen','github-actions:3:1',3,repeat('3',40),repeat('2',40),repeat('a',64),30,repeat('b',64))" >"$tmp/3" 2>&1 & a=$!
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atqc "SELECT generation FROM delivery_control.reserve_promotion('arthurprinsen-ai/Bedrijfsgeheugen','github-actions:4:1',4,repeat('4',40),repeat('2',40),repeat('a',64),30,repeat('b',64))" >"$tmp/4" 2>&1 & b=$!
wait "$a"; ea=$?; wait "$b"; eb=$?
set -e
if [[ "$ea" -eq 0 && "$eb" -ne 0 ]]; then :; elif [[ "$eb" -eq 0 && "$ea" -ne 0 ]]; then :; else echo 'Exactly one promotion reservation must win' >&2; exit 1; fi
echo "POSTGRES_PROMOTION_RESERVATION_REPLAY_PASSED"


# Exact prewrite CAS race in the existing disposable service. Both processes
# use the same generation/revision; different prepared objects cannot both win.
IFS='|' read -r gen rev holder pr head epoch manifest < <(
 psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -At -F '|' -c "SELECT generation,revision,holder,pr_number,head_sha,main_sha,manifest_digest FROM delivery_control.promotion_reservation WHERE repository='arthurprinsen-ai/Bedrijfsgeheugen' AND state='reserved'"
)
[[ "$gen" =~ ^[1-9][0-9]*$ && "$rev" =~ ^[1-9][0-9]*$ && "$holder" =~ ^github-actions:[0-9]+:[0-9]+$ && "$pr" =~ ^[1-9][0-9]*$ && "$head" =~ ^[a-f0-9]{40}$ && "$epoch" =~ ^[a-f0-9]{40}$ && "$manifest" =~ ^[a-f0-9]{64}$ ]]
prewrite_race() {
 local digit="$1" tree_digit="$2" evidence_digit="$3"
 psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -At \
   -v gen="$gen" -v rev="$rev" -v holder="$holder" -v pr="$pr" \
   -v head="$head" -v epoch="$epoch" -v manifest="$manifest" \
   -v digit="$digit" -v tree_digit="$tree_digit" -v evidence_digit="$evidence_digit" <<'SQL'
BEGIN;
SELECT revision FROM delivery_control.prepare_prewrite('arthurprinsen-ai/Bedrijfsgeheugen', :'holder', :'gen'::bigint, :'rev'::bigint, :'pr'::bigint, :'head', :'epoch', :'manifest', 'review/prewrite-race', 'fixture-obligation', repeat(:'digit',40), repeat(:'tree_digit',40),repeat(:'evidence_digit',64));
SELECT pg_sleep(0.25);
COMMIT;
SQL
}
set +e
prewrite_race c a e >"$tmp/prewrite-a" 2>&1 & a=$!
prewrite_race d b f >"$tmp/prewrite-b" 2>&1 & b=$!
wait "$a"; ea=$?; wait "$b"; eb=$?
set -e
if [[ "$ea" -eq 0 && "$eb" -ne 0 ]]; then
 grep -q 'PREWRITE_IDENTITY_CAS_MISMATCH' "$tmp/prewrite-b"
 winner_commit=c; winner_tree=a; winner_evidence=e; winner_log="$tmp/prewrite-a"
elif [[ "$eb" -eq 0 && "$ea" -ne 0 ]]; then
 grep -q 'PREWRITE_IDENTITY_CAS_MISMATCH' "$tmp/prewrite-a"
 winner_commit=d; winner_tree=b; winner_evidence=f; winner_log="$tmp/prewrite-b"
else
 echo 'Exactly one prewrite claimant must win' >&2; exit 1
fi
# Match the durable intent and event to the actual successful session, not either fixture.
next_rev="$((rev+1))"
grep -Fxq "$next_rev" "$winner_log"
observed="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -At -F '|' <<'SQL'
SELECT i.generation,i.revision,i.holder,i.pr_number,i.head_sha,i.main_sha,i.manifest_digest,
 i.branch,i.obligation,i.commit_sha,i.tree_sha,i.intent_digest,e.evidence_digest
FROM delivery_control.promotion_prewrite_intent i
JOIN delivery_control.promotion_reservation r ON r.repository=i.repository AND r.generation=i.generation AND r.revision=i.revision
JOIN delivery_control.promotion_reservation_event e ON e.repository=i.repository AND e.generation=i.generation AND e.revision=i.revision
WHERE i.repository='arthurprinsen-ai/Bedrijfsgeheugen' AND r.state='prewrite_pending'
 AND e.action='prepare_prewrite' AND e.state=r.state AND e.holder=i.holder AND e.pr_number=i.pr_number
 AND e.head_sha=i.head_sha AND e.main_sha=i.main_sha AND e.manifest_digest=i.manifest_digest;
SQL
)"
printf -v expected_commit '%040d' 0; expected_commit="${expected_commit//0/$winner_commit}"
printf -v expected_tree '%040d' 0; expected_tree="${expected_tree//0/$winner_tree}"
printf -v expected_evidence '%064d' 0; expected_evidence="${expected_evidence//0/$winner_evidence}"
expected="$gen|$next_rev|$holder|$pr|$head|$epoch|$manifest|review/prewrite-race|fixture-obligation|$expected_commit|$expected_tree|$expected_evidence|$expected_evidence"
[[ "$observed" == "$expected" ]] || { echo 'Durable prewrite intent/event does not match successful session' >&2; exit 1; }
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE r delivery_control.promotion_reservation%ROWTYPE; i delivery_control.promotion_prewrite_intent%ROWTYPE;
BEGIN
 SELECT * INTO STRICT r FROM delivery_control.promotion_reservation WHERE repository='arthurprinsen-ai/Bedrijfsgeheugen';
 SELECT * INTO STRICT i FROM delivery_control.promotion_prewrite_intent WHERE repository=r.repository AND generation=r.generation;
 IF r.state<>'prewrite_pending' OR i.revision<>r.revision OR i.holder<>r.holder OR i.head_sha<>r.head_sha OR i.main_sha<>r.main_sha OR i.manifest_digest<>r.manifest_digest OR i.obligation<>'fixture-obligation'
 OR NOT ((i.commit_sha=repeat('c',40) AND i.tree_sha=repeat('a',40)) OR (i.commit_sha=repeat('d',40) AND i.tree_sha=repeat('b',40))) THEN RAISE EXCEPTION 'prewrite winner identity mismatch'; END IF;
 IF (SELECT count(*) FROM delivery_control.promotion_reservation_event e WHERE e.repository=r.repository AND e.generation=r.generation AND e.action='prepare_prewrite')<>1 THEN RAISE EXCEPTION 'duplicate prewrite event'; END IF;
 UPDATE delivery_control.promotion_reservation SET valid_until=clock_timestamp()-interval '1 second' WHERE repository=r.repository;
 BEGIN
 PERFORM delivery_control.reserve_promotion(r.repository,'github-actions:5:1',5,repeat('5',40),r.main_sha,r.manifest_digest,30,repeat('e',64));
 RAISE EXCEPTION 'unresolved prewrite taken over';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'PROMOTION_RESERVATION_BUSY' THEN RAISE; END IF; END;
END $$;
SQL
echo "POSTGRES_EXACT_PREWRITE_RACE_PASSED"
