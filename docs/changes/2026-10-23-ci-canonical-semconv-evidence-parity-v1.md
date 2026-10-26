# One evidence truth for autonomous CI/CD agents

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661  
Fingerprint: `delivery|ci|semantic-task-evidence-drift-from-canonical-jobs|20261023-v1`.

The existing Powerhouse Repository Janitor already builds authoritative executed-job data with `summarizeObservedCiJobs`. The bounded OpenTelemetry-compatible semantic projection was added in #4756 and received timestamp/error guards in #4762, but agent consumers needed an explicit guarantee that **both views refer to the same accepted jobs**.

This release adds `reconcileCicdProjectionWithCanonical`: run, attempt, job, exact SHA, normalized name, recorded result and execution milliseconds must match the canonical source rows. For ≤64 accepted jobs, every accepted job must be represented; samples above 64 remain bounded and labeled. Mismatch is a fail-closed status with zero semantic records, never a fabricated success.

The existing hourly Janitor invokes this pure function on the **same** already-fetched GitHub snapshot. No additional API budget, storage, agent, scheduler, exporter, webhook, self-trigger or release authorization. The source remains provider-observed but not proof of a causal critical path or customer ROI.

Regression: `node --test tests/brain-ci-canonical-semconv-parity-v1.test.mjs tests/brain-ci-cicd-semconv-evidence-v1.test.mjs tests/brain-observed-ci-throughput-v1.test.mjs`.

Release remains protected exact-head Required, CodeQL, main readback, and actual existing hourly artifact evidence. No change to the signed CI gates or portaal production path.

References: https://opentelemetry.io/docs/specs/semconv/cicd/cicd-spans/ and https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue
