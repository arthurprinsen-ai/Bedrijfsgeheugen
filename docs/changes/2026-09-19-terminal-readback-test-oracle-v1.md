# Terminal readback test oracle repair

The backend BRAIN lane contained a stale regression assertion that allowed only `canonical_run` and `descendant_live`. After `github_main` became a valid, strictly verified mode, that assertion produced a false failure.

The test now recognizes all three supported modes and explicitly checks the stricter `github_main` constraints: exact main SHA equality, no workflow run ID, no deploy ID, and explicit verification.
