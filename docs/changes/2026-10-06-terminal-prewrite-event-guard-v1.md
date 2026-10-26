# Terminal pre-write event guard — 2026-10-06

## Failure mode

A terminally leased PR could still receive a content commit and only afterward update `Writer-Lease-Head`. The final metadata looked exact, but the content mutation had already invalidated the previous Required evidence and restarted CI.

Observed on PR #3994: terminal HEAD `d5862df4...` was followed by content commit `eaac0b6e...`.

## Structural correction

- the existing delivery-hygiene admission now reads the immutable `pull_request:synchronize` event snapshot;
- if that snapshot still says `Writer-Lease-State: TERMINAL_DELIVERY`, the synchronize is rejected as `TERMINAL_CANDIDATE_MUTATED_WITHOUT_LEASE_TRANSITION`;
- legitimate moving-main refresh first changes the lease to `MAIN_SYNC` and pins `Writer-Lease-Main-Epoch` to the exact refresh target;
- a `MAIN_SYNC` commit is admitted only if its parents include the previous leased HEAD and that exact main target;
- after the merge, the supervisor rebinds the same PR to exact `TERMINAL_DELIVERY`;
- if the merge fails, the prior terminal body is restored fail-closed;
- `MAIN_SYNC` remains protected by the premature-close guard;
- ordinary repair content must transition the lease to `RECOVERY` before writing.

No extra pull-request workflow is added, so this closes the write race without reintroducing CI fan-out.
