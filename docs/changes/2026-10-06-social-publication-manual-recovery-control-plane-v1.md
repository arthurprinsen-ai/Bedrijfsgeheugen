# Same-day social publication recovery

A permanent operational recovery lane is added for incidents where the normal social scheduler has not produced a visible daily publication and the scheduled Netlify endpoint cannot be invoked externally.

The workflow is intentionally narrow. It only accepts today's date in Europe/Amsterdam, obtains the existing scheduler token inside GitHub Actions, invokes the existing canonical Supabase publisher, and reads back the canonical daily decision rows. The workflow does not contain provider-specific publishing calls and therefore cannot become a second writer.

All existing publication controls remain authoritative: content readiness, channel identity, one-time capability consumption, global uniqueness, provider acknowledgement and readback.
