# Powerhouse Autonomous Gap Closer v1 — Design

## Goal
Close every structural revenue-flywheel gap automatically without inventing provider outcomes, realized revenue, forecasts or experiment results.

## Reuse
Reuse the existing `powerhouse_autonomous_growth_revenue_cycle`, `powerhouse-predictive-engine`, `powerhouse-forecast-calibrator`, `bg-experimentcyclus`, opportunities, sales actions/outcomes, forecasts/calibration, social experiments, runtime events and sales learnings. No parallel CRM, queue, forecasting store, experiment store or learning system.

## Loop
Hourly: run the existing revenue cycle; materialize missing provider outcome readback obligations at T+1h/T+24h/T+7d/T+30d; create deduped internal research-enrichment actions for opportunities whose economic value cannot yet be evidenced; trigger the existing predictive engine if forecasts are absent; trigger the existing calibrator only for matured forecasts without calibration; trigger the existing experiment engine if no ACTIVE/PLANNED experiment exists; write learning and health evidence.

## Truth boundary
An unknown future customer/provider outcome is not fabricated as success, failure, no-response or revenue. It must remain an explicit pending evidence obligation. A structural gap means missing lineage, repair ownership or eligible repair, not merely an external outcome that has not happened yet.

## Security
SECURITY DEFINER RPCs use deterministic search paths and service-role-only execute. Internal gap-register view uses `security_invoker=true`.

## Definition of done
Supabase migration applied; manual cycle healthy with zero unmanaged structural gaps; cron active; GitHub required/security/BRAIN gates green; PR merged; Netlify production `ready` on exact merge SHA; activation and learning read back from Supabase. Commercial maturity remains separately evidence-based and requires real repeated outcomes.