# Terminal control-plane replay uses current protected main

## Verified blocker

The corrected version-first migration resolver was protected merged in [PR #4123](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4123). The subsequent canonical [terminal closure rerun #37757904129](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37757904129) for historical merged [PR #4118](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4118) did not get as far as migration readback. Instead it failed with `ERR_MODULE_NOT_FOUND tools/delivery/terminal-migration-identity.mjs` during identity preflight.

Cause: the **new** terminal workflow checked out the **historical** merge commit of #4118. That immutable older source tree predates the resolver module. Importing a current control-plane module from historical source can never succeed.

## Correction

Change only the existing `.github/workflows/obligation-terminal-closure.yml` checkout to the immutable `github.sha` bound to the workflow invocation on protected main. Explicitly require the historic merge SHA be an ancestor both of fetched `origin/main` and of this checked-out control-plane commit. Continue using the original immutable candidate HEAD and merge SHA for all Required, CodeQL, migration ledger, production release, skill projection and Brain terminal evidence. The signed invocation revision is executable governance; the historic merge is evidence.

Tests reject a regression to checkout of `steps.context.outputs.merge_sha` and enforce the two ancestry conditions, original gate names and durable Brain persistence. No change to application code, Supabase production, Netlify deployment, scheduled jobs, provider privileges, or terminal status semantics.

## Acceptance

Protected Required and CodeQL pass, main contains the protected merge, and one new canonical terminal workflow run for PR #4118 executes successfully through production migration/Brain evidence readback. The previous failed run remains an auditable failure, never falsely green.
