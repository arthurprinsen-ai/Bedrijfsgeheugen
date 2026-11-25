# 2026-10-29 — Protected Portal DOM visual baseline with Netlify preview SSO

**Obligation:** `delivery|portal-visual|sso-preview-exact-source-fallback|20261029`.

### Confirmed root cause
Production DOM Readback on protected main `99fd28c...` failed despite exact ready Netlify production deploy because a **non-production** Netlify numbered preview alias returned 401 (SSO policy). Its preexisting error branch exited before invoking the already implemented *protected merged PR exact-source* visual baseline fallback. No screenshot diff was run, so no DOM approval existed.

### Narrow repair
In the existing `.github/workflows/portal-v2-production-dom-readback.yml`, an unavailable numbered PR alias is **not accepted as verified**. When release.json returns no accessible identity, it leaves `preview_url` empty; the existing exact-source fallback fetches the immutable protected merged PR HEAD, requires identical SHA, creates an isolated worktree, captures the browser screenshot from that source and then compares against the independently pinned production deploy. Any **non-empty** alias release identity that does not match the expected PR SHA and deploy ID still fails closed. There is no fallback to an unrelated preview, no SSO bypass, no skipped screenshot, no new scheduler or parallel writer.

### Local verification
13/13 existing and extended Portal V2 production visual regressions passed, including strict pixel tolerance and negative immutable preview status controls. Production run must still reexecute with real browser evidence; this document alone is NOT a successful DOM readback.

Related: [Previous failed run](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40864486952), [portal acceptance #4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215). Separate Supabase Preview history mismatch is not fixed by this patch.
