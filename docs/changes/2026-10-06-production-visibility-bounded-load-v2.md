# Production visibility bounded load — 6 October 2026

On main `52460f88df1d48a5c51e1b9582fdd87e119a325b`, the exact production identity, Production Source Snapshot and Production Release Readback were green. The remaining Canonical brand shell live readback failure came from the all-route visibility sweep.

The workflow forced 8 route workers and 3 viewport workers, allowing up to 24 simultaneous browser navigations against the public production origin. Under that artificial burst, two healthy English blog routes returned transient HTTP 403 and one healthy AI Model Guide route returned no response. All three routes were independently reachable immediately afterwards.

The production verifier now uses 4 route workers and 2 viewport workers. The checker itself also clamps canonical production to those limits even when a future workflow or manual invocation requests more. Full sitemap coverage, all three viewports, transient retry handling, visibility, occlusion, content, CLS and the global fail-closed time budget remain intact.

The standalone visibility checker is also part of the canonical verifier-only production-readback contract, so verifier maintenance does not cause an unnecessary website deployment.
