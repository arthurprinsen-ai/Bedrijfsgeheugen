# Canonical content research versus measurable growth — 23 October 2026

Owner: [P0 commercial closed loop #4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198). Existing source: `tools/content-growth/materialize-learning.mjs`.

## Observed failure

The existing `data/content-growth-events.json` contains a real government-guidance research event with `event_type=problem_radar_signal_accepted`, but no `content_id`. The scheduled learning job passed this context signal to `aggregateContentPerformance`. The strict aggregator rightly rejects it; changing the event to look like a sale or inventing a blog ID would be false attribution.

## Bounded correction

Partition that exact source-only event type at the existing input boundary. Keep the source event in its immutable original input, count and list bounded excluded event IDs in learning output, but never score or monetize it. Other measured events retain the canonical ID requirement. A source-only day produces `NO_OBSERVED_CONTENT_PERFORMANCE`, zero proven items and zero revenue, not a fake green growth story. An observed content event remains `PERFORMANCE_EVENTS_PRESENT_PROVIDER_ATTRIBUTION_UNVERIFIED` because this script does not independently validate the provider receipt.

## Acceptance and promotion

The historical input must materialize successfully without fraudulent value; a malicious research event with a forged content_id and revenue-like value cannot influence scores; an orphan revenue or click event must still fail. Protected Required, CodeQL and all affected tests must pass on exact head, followed by protected merge and the next actual daily workflow outcome. A code-test success is not provider outcome or customer revenue proof. No second scheduler, agent fleet, storage, marketing publisher, tenant permissions, manual post or data repair.
