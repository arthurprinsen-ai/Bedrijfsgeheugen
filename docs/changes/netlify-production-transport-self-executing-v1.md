# Self-executing Netlify production transport

Bedrijfsgeheugen production is currently API-sourced in Netlify. The canonical Production Source Snapshot workflow already has an authorized Netlify transport, but that transport previously only ran after a manual workflow dispatch with `deploy=true`.

This recovery makes a push of the transport workflow itself execute the same exact-source deployment and bounded production identity proof. The existing manual dispatch path remains available. No Netlify credential is stored in source; the workflow continues to use the existing encrypted temporary proxy secret.

This prevents a merged website change from remaining on GitHub main while production stays on an older Netlify commit solely because nobody manually dispatched the transport workflow.
