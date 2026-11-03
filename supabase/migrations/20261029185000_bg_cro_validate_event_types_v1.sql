-- Follow-up on protected CRO #5153 / incident #5141.
-- Production 20261029182000 widened bg_interacties_gebeurtenis_check to the
-- exact 17 events accepted by Edge bg-interactie v12 but used NOT VALID to avoid
-- scanning a large table during the short lock. Existing rows were already
-- valid under the older, strictly narrower seven-event CHECK.
-- This separately reviews ALL existing records before claiming CONVALIDATED.
-- VALIDATE CONSTRAINT uses SHARE UPDATE EXCLUSIVE and preserves normal DML.
-- Fail closed on lock contention or long scan; no DROP, TRUNCATE, or RLS change.
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE public.bg_interacties
  VALIDATE CONSTRAINT bg_interacties_gebeurtenis_check;
