# Daily blog — immutable live-publication readback, 9 October 2026

The existing Powerhouse blog `sopv-2026-plasticverwerkers-productietest-subsidie` is truly public. GitHub's **Native daily blog live watchdog #37920475011** independently returned HTTP 200 with the exact canonical, content ID and title. Supabase pg_net provider probe #1570 independently confirmed all three. Netlify production deploy `6ac8c38172d5dd0008a51165` was a prior deploy; the relevant canonical blog deploy is `6ac8c38172d5dd0008a6169a`, from immutable GitHub commit `47441ea9ed428202a7f1ccca5dc8cd5038d544bb`.

The originally selected article `onprijsd-probleem-bedrijfsvoering` is 301 redirected to its previously consolidated older canonical and therefore failed the correct identity test in watchdog #37918931429. We retain that redirect and did not publish the same SEO story twice.

Protected PR #4258 changed only the existing daily selection to the SOPV article; Supabase's existing `record_content_publication_state` already returned `LIVE_PROVEN` for this correct ID. **This PR #4260** carries the original watchdog's immutable exact-canonical `live_proof`, updated with provider-deploy/commit and independent probe identifiers. No fabricated channel/provider metrics and no second executor are introduced.

The first Required CI attempt for PR #4260 failed for missing semantic closure artifacts; these exact Brain-learning, activity ledger and human explanation files were added to satisfy the *existing* admission rule. Required CI and CodeQL must still pass, and only a protected merge may set the repository ledger's `state=live`.
