# Main push fan-out governor — 24 september 2026

## Incident
GitHub Actions accumulated queued and in-progress runs because two independent patterns amplified work:
- expensive pull-request workflows did not consistently supersede older heads;
- several specialist workflows ran on every push to main even when their own PR scope was path-specific.

## Root cause
Concurrency identity and trigger scope were not aligned with semantic ownership. Some workflows used unique run IDs, which prevents cancellation, while some main triggers had no path filter.

A first recovery also exposed an implementation defect: an automated YAML transformation corrupted the multi-line branch list in `seo-growth-intelligence.yml`. This successor fixes the YAML structure and hardens the regression around semantic branch/path presence.

## Fix
- expensive PR workflows are single-flight per PR;
- supersedable workflows use stable PR/ref concurrency keys;
- specialist main workflows use relevant path scopes;
- every expensive job has a bounded runtime where applicable;
- workflow-structure regression is semantic rather than dependent on one-line branch syntax;
- learning, activity ledger and human documentation are delivered in the same lineage.

## Prevention
Never transform YAML branch/path blocks with assumptions about one-line versus multi-line syntax. After workflow mutation, validate the resulting semantic structure before remote CI.

Terminal closure still requires protected merge and current-main readback.
