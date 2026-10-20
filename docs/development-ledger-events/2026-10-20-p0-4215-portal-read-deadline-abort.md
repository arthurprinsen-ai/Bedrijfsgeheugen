# Development ledger event — P0 #4215 PostgREST abort/deadline (2026-10-20)

Obligation-ID: p0-4215-portal-read-deadline-abort-v1
Lane: backend / portal existing Edge.
Observed: 90–197 s time-outs first three read stages; latest production HTTP 504; production DB connection timeout.
Change: boundedReads now aborts PostgREST fetch after 6000 ms, runs max two reads simultaneously, rejects on incomplete evidence, explicitly 503 when unavailable. No writes, new DB migrations, cron changes, new state store or fabricated data.
Tests: tests/brain-portal-eu-bounded-reads.test.mjs; tests/brain-p0-4215-portal-read-deadline.test.mjs
LIVE_PROVEN: no. Exact-sha Edge deploy, authenticated 200/readback and two-client RLS isolation required. Related #4215 #4539.
