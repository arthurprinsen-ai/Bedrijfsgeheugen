# Pricing production source promotion recovery

The pricing interaction changes were merged, but Netlify production still exposed the preceding commit. This recovery intentionally refreshes the existing `Production Source Snapshot` workflow so a push to `main` invokes its exact-source Netlify transport.

Success requires exact SHA production identity plus pricing content proof; merge alone is not sufficient.
