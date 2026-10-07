# Data, AI Sovereignty & Security Trust Center v1

## Doel
Bedrijfsgeheugen toont klanten in één contextuele trustlaag waar data wordt verwerkt/opgeslagen, welke AI/providers betrokken zijn, wie toegang kan hebben, welke technische securitycontrols aantoonbaar zijn, welke normen relevant zijn en welke evidence nog ontbreekt.

## Ontwerpregels
- evidence-first: measured/evidence-backed, anders UNKNOWN;
- provider assurance is nooit automatisch een Bedrijfsgeheugen-certificering;
- juridische applicability en technische controlstatus zijn aparte dimensies;
- provider/IAM-observaties verlopen en worden STALE;
- database posture wordt live uit PostgreSQL catalogi afgeleid;
- de bestaande data-sovereignty heartbeat is de enige refresh authority;
- klantdata blijft tenant-scoped via Netlify Identity → EU gateway → Supabase.

## UX
De Security Trust Center-pagina gebruikt progressive disclosure: een question rail beantwoordt de belangrijkste klantvragen direct, het bento-overzicht toont de actuele posture en drawers geven provider/control-evidence pas bij drill-down. De ervaring ondersteunt reduced motion en smalle schermen.

## Kaders
Projectie bevat AVG/GDPR, EU AI Act, NIS2/Cyberbeveiligingswet, ISO 27001/27017/27018/22301/42001, SOC 2, NIST CSF 2.0, CIS Controls, OWASP en DORA waar contextueel relevant. Dit zijn applicability/reference labels, geen automatische complianceclaims.

## Runtime
- security snapshot: public.security_trust_snapshot_v1
- database scan: public.security_database_posture_v1()
- observation write: public.record_security_management_observation_v1(...)
- security refresh: public.refresh_security_trust_snapshot_v1(tenant)
- combined heartbeat: public.powerhouse_refresh_data_sovereignty_v1()
- authenticated API: /api/security-trust
- portal: https://www.bedrijfsgeheugen.nl/portal-next/security.html

## Security truth
Known database findings are deliberately visible as findings. Een groene UI volgt alleen wanneer catalogus/advisor-evidence het onderliggende issue niet meer rapporteert. RLS enabled zonder policy blijft informatief omdat deny-all bewust kan zijn.
