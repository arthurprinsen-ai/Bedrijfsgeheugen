# Pricing production deployment and readback

The pricing funnel update was merged to GitHub main, but the public Netlify production site was still serving an older source commit. This was release transport drift rather than a pricing-content defect.

This promotion deliberately uses the existing Production Source Snapshot workflow. After protected merge, the workflow packages the exact main source, sends it through the authorized Netlify transport, and performs bounded `release.json` identity readback.

The release is complete only when the Netlify production `commit_ref` equals the actual current main SHA and the public pricing page contains the new Build/value proposition without the obsolete annual-price toggle.
