# Backend lane dependency-install timeout

The protected Required test could remain non-terminal because the backend lane ran an unbounded `npm install --silent`. When the npm process or network stalled, branch protection could not reach a terminal result and auto-merge remained blocked.

This change adds two bounds:

- the backend job has a 20-minute hard timeout;
- dependency installation has an 8-minute step timeout with bounded npm fetch retries.

The install is no longer silent, so a failed or slow install leaves diagnostic output. The dependency command remains compatible with the repository's current package manifest, which does not contain a lockfile.

The lane therefore fails closed instead of hanging indefinitely.
