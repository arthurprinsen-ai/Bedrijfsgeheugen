# BRAIN inherited SQL source batch — 22 October 2026

Obligation: `ci-brain-inherited-archive-batch-20261022`; parent #3742, related #4215, blocked portal PR #4573.

## Failure evidence
Protected BRAIN verification run #39671036043 on candidate #4602: 3,511 tests, 3,190 passed, 321 failed. Several inherited tests try to open SQL migrations removed from the executable migration directory during migration-history reconciliation. Never restore historical SQL into the executable directory: it risks SQLSTATE 23505 and duplicate version history (see #3742).

## Contained repair
Seven distinct test source references now point to the exact original repository-only archive with matching filename. Original test assertions and negative security checks remain byte-for-byte unchanged. Seven new regression tests require genuine archive existence and forbid old executable read paths or executable duplicates. No provider actions, customer data, migrations, RLS, roles, grants, schedulers, production code, or deployment modifications.

Exact source main epoch: `54ed4ffcad4e27a1c0c8ea189a39818246b537df`. Verified seven archive Git blobs: `645aff910c4a6b986b98cdf7dfb8681ef3b43ea7`, `a4758905425f0964338371247343192e3ed4cd73`, `bc0cbe3c7a830c13872cf5bc4cb1f858c37f0a32`, `a6037047760fe281ab24298f9f7d94c62cc95695`, `84c4a40ebd15cbbc2054dbde344965b76e69a677`, `5cb4373bc7c923c601b5e6c5653e912832725995`, `03186b51e92cfc47482f572df787c306f004091e`.

## Exit conditions
Run Node source tests on the exact candidate head and full Unified BRAIN backend: **0 failing** required. Required CI, CodeQL, and BRAIN must all be exact-head terminal success. Do not merge or change production while any gate is red. Supabase clean-room migration parity #3742 and genuine authenticated two-tenant portal acceptance #4215 are independent obligations.

Current acceptance: **candidate only**. No predicted reduction is claimed as runner-verified.
