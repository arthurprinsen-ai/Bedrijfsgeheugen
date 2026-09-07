# Composable Fast Release Control Plane Design

## Goal
Multiple agents must be able to develop, validate, merge and reach production independently without unrelated moving-main drift or unrelated failing suites blocking them.

## Architecture
`Required test` remains the stable protected status but becomes an aggregator only. Lane-specific execution lives in reusable workflows for website, portal, backend and automation. Website validation is risk-based (`fast-fix`, `normal`, `high-risk`) and runs targeted preview verification in parallel with the mandatory full public-page visibility crawl.

## Moving-main semantics
- `NO_OVERLAP`: keep the tested candidate; no rebuild and no successor.
- `COMPOSABLE_CONTROL_PLANE_OVERLAP`: current `main` stays authoritative and only the affected lane/control-plane module is recomposed; no successor.
- `REAL_FEATURE_OVERLAP`: synchronize only that candidate.
- A successor is allowed only when a real overlap exists and the current candidate is not safely synchronizable.

## Production semantics
Development, CI and deploy previews run in parallel per PR. Main merges remain sequential Git writes. Production readback uses one latest-main concurrency group so stale verification does not block newer releases. Every release is verified against the exact production SHA or is superseded by a newer `main` that contains it.

## Safety invariants
- `test` remains the branch-protection context.
- The moving-main successor guard remains mandatory.
- The public-page visibility crawl remains mandatory for every website PR, including fast fixes and menu-only changes.
- Fast fixes skip unrelated broad UI/SEO suites but still require baseline, exact deploy preview, targeted browser verification and public visibility.
- High-risk shared shell/navigation/workflow/Netlify changes run full regressions.
- Existing branches are never rebuilt merely because `main` advanced.
