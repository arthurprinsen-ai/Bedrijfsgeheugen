# LinkedIn company scoped OAuth recovery

Date: 2026-10-06

The existing production setup function could validate organization scopes but its create-link path reused generic LinkedIn managed auth. Reauthorization therefore kept producing member-capable connections without the organization-admin capability required by the company publisher.

This change starts from the deployed setup v18 source and preserves its direct-Supavisor/JSON normalization hardening. The create-link path now creates or reuses a dedicated managed auth configuration requesting:
- r_organization_admin
- r_organization_social
- w_organization_social
- openid/profile/email

The returned connected-account ID is stored as the OAuth candidate. Company readiness is accepted only for that exact fresh account after a successful approved ADMINISTRATOR ACL read for the canonical organization and organization write capability. Generic ACTIVE connections cannot satisfy the company gate.

No provider post is created by the setup flow. Publication remains delegated to powerhouse-social-publisher after successful scoped authorization.
