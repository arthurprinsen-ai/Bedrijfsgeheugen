# github_main regression alignment

The terminal descendant-recovery regression now recognizes `github_main` as a third production-readback mode while preserving the distinction between GitHub-main containment and runtime descendant recovery.

The regression explicitly checks that `github_main` requires exact main SHA equality, no production run ID, no deploy ID, and an explicit verified flag.
