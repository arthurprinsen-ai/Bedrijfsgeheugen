# 24-11-2026 — oorspronkelijke persoonlijke LinkedIn schedule false-positive

Obligation-ID: powerhouse|personal-linkedin|schedule-projection-stale-20261124
Source: productie tabellen, exact originele beslissing `2026-11-24T07:00Z`; stale blokker werd eerder aangemaakt dan de beslissing.
Single owner: original content-loop & social-publisher; geen tweede scheduler.
Code: supabase/functions/_shared/publication-recovery-obligation-writeback.mjs
Test: tests/brain-publication-obligation-recovery-handoff-20261031.test.mjs
Proof required: Required/CodeQL → protected merge → native active original content-loop source readback → repeated-due shadow simulation; independent LinkedIn provider result afzonderlijk.
Status: proposed in protected PR, **not** production-proven until exact source readback.
