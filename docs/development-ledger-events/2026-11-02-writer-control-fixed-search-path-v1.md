# 2026-11-02 — Writer-control search-path security candidate

Obligation-ID: `powerhouse-security-writer-control-search-path-20261102-v1`.
Original authority: existing ONE BRAIN Security Agent and single protected delivery writer.
Source: original Supabase Security Advisor (three mutable search-path findings). These lease functions are currently SECURITY INVOKER, schema-qualify their table and are limited to authorized database roles. This does not establish exploitation.
Root cause: missing explicit search_path setting on SECURITY INVOKER functions. Minimal correction changes function configuration only; no body replacement.
Controls: exact signature checks, invoker-only assertion and post-ALTER pg_proc readback, protected branch, shadow/canary security learning, original preview/source parity and live advisor recheck.
Candidate release state: OPEN until protected checks, merge and provider re-evaluation. No direct live SQL modification was performed by this source change.
Non-goal: the token-gated externally callable privileged cron RPC has a separate authorization review and must not be disabled, regranted or relabeled green without source callers and provider proofs.
