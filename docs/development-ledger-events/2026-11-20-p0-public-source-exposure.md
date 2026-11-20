# P0 security incident — publicly readable repository artifacts
Date: 2026-11-20. Owner: canonical security-operations workflow / website delivery lane.

## Source-grounded incident
An independent browser readback against https://www.bedrijfsgeheugen.nl/ returned HTTP 200 for a SQL migration under /supabase/migrations/, an internal security CI script under /scripts/, and /package.json. The site was built from a repository-root publish directory (`[build] publish = "."`). The SQL file contained a credential *digest*, not an identified plaintext secret. No authentication compromise has been demonstrated.

## Immediate containment candidate
Use forced Netlify `404!` rules at the beginning of `_redirects` for internal project trees and build files. This overrides existing static files. Do not deny public assets under /assets/, /data/, /portal-v2/ or the actual /.netlify/functions/ API namespace. Add both positive (public paths unaffected) and negative (source file 404) CI assertions.

## Production proof contract
Do not mark this incident resolved based on a commit, successful PR workflow or deploy job alone. Require protected merge, Netlify CURRENT/READY for the production site, and independent HTTPS GET to the previously exposed endpoints returning **HTTP 404**, with the public homepage still HTTP 200. The original content may already have been downloaded or cached; inspect for plaintext credentials and rotate only evidenced exposures. Netlify production controls and historical deploy URLs need review separately.

## Other audit results
Supabase: 208 public-schema tables and 10 storage-schema tables examined with RLS enabled; 188 linter INFO notices report RLS enabled without policies and are not themselves evidence of exposure. One linter WARN notes `public.powerhouse_external_cron_reconcile_v1(text)` is executable by anon, but the exact reviewed migration deliberately grants this to a purpose-scoped ≥40-character SHA-256 bearer-token gateway. Do not revoke blindly and break external cron; migrate it to a dedicated authenticated server caller with measured provider readback first.

## Controls
The existing `security-operations-proof` weekly run now also checks the public production 404s. No new scheduler, no Make, no unverified "all green" declaration.
