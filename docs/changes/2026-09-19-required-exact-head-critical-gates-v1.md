# Exact-head critical merge gates

The existing native required context `test` now remains pending until the already-running BRAIN and Powerhouse CodeQL workflows for the exact pull-request head SHA both complete successfully.

This closes the gap where GitHub could merge a candidate because `test` was green even though BRAIN was red or CodeQL was still running. The aggregator reads existing workflow results; it does not launch duplicate test suites, which keeps runner and API cost bounded.
