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
if ! { { [[ "$ea" -eq 0 ]] && [[ "$eb" -ne 0 ]]; } || { [[ "$eb" -eq 0 ]] && [[ "$ea" -ne 0 ]]; }; then echo 'Exactly one claimant must win' >&2; exit 1; fi
echo "POSTGRES_LEASE_REPLAY_PASSED"
