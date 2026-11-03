# Audit: LinkedIn personal eligible source starvation despite successful canonical Mira radar

Date: 2026-10-29 Europe/Amsterdam. Primary lineage: GitHub issue #4439, PRs #5086/#5090/#5145/#5149, Supabase canonical project.
Fingerprint: `linkedin|personal|shared-radar-only-feeds-business-source-topics|20261029-v1`.
Original prod evidence: `content_publication_obligations` linkedin_personal BLOCKED, provider ID missing, 5 duplicate-safe attempts; instagram BLOCKED original Mira video identity 0.900; company LIVE_PROVEN. pg_cron #120 existing Mira radar selects only approved entrepreneur topics; `powerhouse_ensure_personal_source_rotation_v2` accepts only daily-life topics and HTTPS dated sources with score>=0.72, last 45 days.
Change: Same source radar original eight external calls now 6 entrepreneur + 2 personally relevant, by business date, no extra paid calls. Write separate public-safe metadata contracts into existing table; original Mira materializer checks exclusive entrepreneur contract and original frozen winner. Existing portal admin API counts eligible personal sources, never creates provider IDs. Source score/date/dedupe and identity thresholds unchanged.
Human-readable: `docs/changes/2026-10-29-personal-linkedin-radar-source-supply-closure.md`. Skill: `.agents/skills/powerhouse-social-recovery-cooperation/SKILL.md`.
Validation: PR Required/CodeQL PENDING; Supabase Edge production readback PENDING; natural provider source intake PENDING; LinkedIn and Instagram post ID/readback ABSENT. Do not close #4439 until provider outcomes.
