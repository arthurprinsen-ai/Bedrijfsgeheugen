# Terminalizer BRAIN gate applicability

Date: 2026-09-25

The terminal closure workflow required an exact-head Unified Brain Delivery run filtered to `event=pull_request`. Unified Brain Delivery is dispatch-only, so that exact event can never exist. Docs-only PRs therefore waited until timeout despite their applicable gates being green.

The terminalizer now marks BRAIN not applicable only for `Delivery-Lane: docs`. All other lanes still require a successful exact-head Unified Brain Delivery run, but without an impossible event filter. Required and CodeQL rules are unchanged.
