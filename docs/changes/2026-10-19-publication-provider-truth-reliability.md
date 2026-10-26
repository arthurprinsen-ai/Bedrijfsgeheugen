# Publication reliability incident — 19 October 2026

Evidence boundary: 3 of 4 required channels have provider proof. Instagram Mira is blocked because two media candidates did not meet the immutable 0.94 face-identity criterion and a provider rejected a subsequent reference submission. Corrected existing Supabase watchdog and sync SQL routines now preserve the immutable LinkedIn create acknowledgement and the real Instagram blocker. No failed media is allowed to publish. Do not mark channel green without a real Instagram post ID, exact media identity verification and provider readback.

Runtime SQL modifications must be captured in migration history through the protected workflow. Continue with verified CI and authorized deployment. Do not create parallel schedulers; preserve existing Netlify/Supabase owner.

**Scheduled assertion parity:** The already-active `bg-content-publication-daily-assert` cron still used a stricter status-only predicate and could falsely fail for a legitimate LinkedIn provider-acknowledged post. The existing `public.assert_content_publication_daily_invariant(date)` function now uses `powerhouse_publication_proof_health(date)` exactly like the watchdog; its `SECURITY DEFINER` EXECUTE remains granted to `service_role` but not browser roles. An unproven Instagram post still fails the assertion.
