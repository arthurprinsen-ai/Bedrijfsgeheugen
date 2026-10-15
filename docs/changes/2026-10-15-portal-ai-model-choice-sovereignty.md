# Customer-selectable third-party AI models: sourcing, sovereignty and AI Act

Date: 2026-10-15
Scope: Portal V2, customers, all 110 research-directory entries.

## Implemented
- A new **AI-modellen kiezen** native customer page in the canonical Data & intelligence navigation and Data & AI hub.
- Every catalog record is browsable and may be added to a tenant's **requested shortlist**. Selection does not mean contract acceptance, cost approval, provider entitlement, deployment, successful invocation or permission to process tenant data.
- An independent supplier-status snapshot, derived from Supabase's catalog evidence table and joined by exact model ID. At this snapshot: 83 VERIFIED as public supplier bookkeeping, 26 PARTIAL and 1 CONFLICT. None of these statuses themselves attest authenticated runtime readiness.
- Supplier source URL and per-deployment-path source-linked descriptions of storage residency, inference region, training use, retention, private networking, self-hosting and sovereignty classification. Unavailable evidence must remain visibly **unknown**. A region-local service is not equivalent to full sovereign control.
- Customers can indicate EU/EER storage, both EU/EER storage and inference, or customer-controlled sovereignty. These are **requested policy preferences**, not proof the provider path conforms. Treat policy mismatch or unknown as an activation gate for a subsequent authorized review, not as an automated activation.
- EU AI Act preliminary **use-case** risk note, links to official Commission timeline and EDPB data transfer advice. Classifications depend on actual use, provider/deployer role, jurisdiction and applicable dates.
- Authenticated, non-demo preferences are saved in the tenant-scoped portal state under `portal.aiModelPreferences` with `requestState:'review_only_not_activated'`. The write is flushed and read back. No provider runtime endpoint is called.

## Policy for 26 PARTIAL and 1 CONFLICT
Retain them as research entries, not green-lighted production candidates. Route human review by supplier and missing claim (model ID/status/pricing/capabilities/deployment/governance), confirm precise official document and date, and check actual authorized account, region, DPA/contract and data control settings. Mark any absent evidence as unknown, not verified. Retire/replace model candidates that are genuinely EOL or unavailable instead of maintaining them as deployable choices. The Amazon Nova Premier conflict remains unusable pending authenticated, region-specific Bedrock model-lifecycle confirmation.

## Production use is a separate permission boundary
A chosen model becomes **runtime eligible** only after a deliberately implemented, authenticated tenant-specific activation workflow confirms the exact API ID, actual account/model/region entitlement, lawful data transfer and contract terms, security configuration and use-case risk controls, with customer approval. No switch is silently set in the provider gateway or recommender by a wishlist change.

## Official primary references
- European Commission AI Act implementation timeline: https://ai-act-service-desk.ec.europa.eu/en/ai-act/eu-ai-act-implementation-timeline
- AI Act Article 26 (deployers of high-risk AI): https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26
- European Commission AI Act Article 50 guidance: https://digital-strategy.ec.europa.eu/en/policies/guidelines-ai-transparency-obligations
- EDPB cross-border transfers for SMEs: https://www.edpb.europa.eu/sme/be-compliant/international-data-transfers_en

No assertion of GDPR compliance, full EU sovereignty, provider contractual proof or fully active 110-model inference is made by this release.
