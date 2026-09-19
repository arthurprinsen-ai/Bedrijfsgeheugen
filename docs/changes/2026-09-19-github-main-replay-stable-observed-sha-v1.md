# Stable github_main replay evidence

For GitHub-main production evidence there are now two separate identities.

The current `origin/main` SHA is only the containment witness used to prove that the obligation's merge commit is still present in protected main. The terminal `production_observed_sha` is always the obligation's own merge SHA.

This makes terminal replay stable when unrelated commits advance main, while retaining fail-closed ancestry verification.
