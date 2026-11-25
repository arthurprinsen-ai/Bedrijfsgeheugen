# Native Netlify production parity recovery after PR #4223

PR #4223 was merged into protected main at `bb50ba3faf91a9496fd707a26c6db60c151c9fd1`. It modified anonymous production DOM parity tests and evidence, not the Netlify-hosted product. The established `netlify-ignore-build.mjs` policy correctly skipped the test-only change, leaving the published Netlify commit at `adc19513396fd2bb619a7835bcd93d51960147c0`.

The exact-source manual snapshot (run 37887051743) proved the source identity and packaged the artifact but could not publish: its authorized JIT fallback rejected the bridge request with HTTP 420 `composio_netlify_account_not_public`.

This recovery follows the repository's existing `netlify.toml` production heartbeat convention, changing no redirects, build commands, secrets, portal authorization or website runtime logic. The config file change is eligible for a normal Netlify Git build. Do not mark production ready until the new protected main's live `/release.json` commit and deploy identity are verified, along with relevant production browser checks. CSRD and authenticated tenant E2E remain separate requirements in #4215.
