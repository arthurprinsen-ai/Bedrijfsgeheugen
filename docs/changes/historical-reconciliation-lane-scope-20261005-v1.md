# Historical reconciliation lane scope

Historical terminal reconciliation is a delivery-control-plane workflow. It does not change website, portal or automation runtime surfaces.

Before this change, the workflow path matched the generic `.github/workflows/` shared-path rule and therefore activated every delivery lane. That caused unnecessary Netlify build and browser assurance work. With branch protection requiring an up-to-date branch, the long unrelated website fan-out repeatedly allowed moving `main` to invalidate an otherwise fully green recovery candidate.

The workflow is now explicitly mapped to the backend lane, matching other control-plane workflows. Backend and shared control-plane checks remain mandatory; portal and website lanes do not run unless another changed path independently requires them.
