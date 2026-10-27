# Historical reconciliation lane scope

Historical terminal reconciliation is a backend delivery-control-plane concern. It does not change website, portal or automation runtime surfaces.

Before this change, both `.github/workflows/historical-terminal-reconciliation.yml` and `config/historical-terminal-reconciliation.json` could fall through generic shared-path classification. That caused Required test to fan a backend-only recovery into unrelated product lanes, including full Netlify/browser assurance. Under strict up-to-date branch protection, the unnecessary delay repeatedly allowed moving `main` to invalidate an otherwise green candidate.

Both the workflow and its registry are now explicitly mapped to the backend lane. Shared admission/preflight and backend contracts remain mandatory; portal, website and automation lanes only run when another changed path independently requires them.
