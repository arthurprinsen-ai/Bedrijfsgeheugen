# Social recovery Supavisor authority

The social-publication recovery control plane no longer depends on Vault inspection or the Data API for scheduler authority and canonical state readback.

The recovery workflow delegates to one source-controlled Edge Function. That runner uses the EU Supavisor transaction pooler for internal database access, invokes the canonical content loop, performs bounded channel fallback only when preparation degrades, and proves final state through direct database readback.

The provider writer remains the only provider-side publication authority. Provider truth is still required before recovery is green.
