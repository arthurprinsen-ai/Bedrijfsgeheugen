# github_main terminal evidence

The canonical Brain evidence authority now understands `github_main` as a distinct production-readback mode for automation-only changes whose production surface is the protected GitHub `main` branch.

The mode is deliberately narrow. The observed SHA must exactly equal the merge SHA, the workflow must mark the readback verified, and neither a production workflow run ID nor a deploy ID may be supplied. Durable evidence is stored with a `github-main:<sha>` reference so it cannot be confused with a website deployment or descendant production proof.

Runtime-changing work continues to use `canonical_run` or `descendant_live`.
