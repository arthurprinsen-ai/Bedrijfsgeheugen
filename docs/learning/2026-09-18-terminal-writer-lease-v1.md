# Terminal writer lease — 2026-09-18

During TERMINAL_DELIVERY exactly one writer owns the canonical obligation and PR. Every chat/agent preflight reads the ownership guard before material repository writes. A non-owner must DEFER and reuse the current lineage rather than changing its head.

The lease remains active through protected merge, production/provider readback and learning writeback. Head drift under an active lease is a control-plane incident.

Fingerprint: `delivery|same-lineage|parallel-writer-head-thrash-v1`.
