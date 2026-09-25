# SEO production reconcile — production drift en delivery-authority

Fingerprint: `seo|production-reconcile|exact-head-sibling-proof|v1`

## Incident

De commerciële SEO-wijzigingen voor Exact Online, API-koppelingen en Twinfield stonden al op `main`, terwijl Netlify nog een oudere productiecommit serveerde. De correcte recovery was daarom een production reconcile, geen nieuwe SEO-implementatie.

In de deliveryversie die tijdens de oorspronkelijke recovery actief was, keek Required naar exact-head BRAIN/CodeQL sibling-runs. Een oudere cancelled BRAIN-run bleef daardoor blokkeren en een groene `workflow_dispatch`-run telde niet omdat de historische gate `event=pull_request` vereiste.

## Belangrijkste nieuwe learning

Tijdens de latere borging was de control plane inmiddels veranderd. De actuele Required-workflow is nu de **canonieke single-flight PR aggregate gate** en pollt sibling-workflows niet meer. Unified Brain Delivery is expliciete recovery/dispatch authority. Daarom mag historische recoverylogica nooit blind als huidig uitvoeringscontract worden hergebruikt.

## Permanente Powerhouse-regels

1. Staat de wijziging al op `main` maar productie loopt achter: production drift → exact-main reconcile.
2. Lees vóór recovery altijd de actuele producer én consumer workflows samen.
3. Historische gate-semantiek blijft audit-evidence, niet automatisch de huidige authority.
4. Onder de huidige single-flight architectuur mag geen native BRAIN PR-fanout worden hersteld alleen om oude sibling-polling na te bootsen.
5. Queue-pressure en dedupe blijven bindend: één obligation, één candidate, geen duplicate heavy CI.
6. Na merge: bewijs `main_sha == Netlify commit_ref`.
7. Houd provider identity en functionele browserproof per relevante scope gescheiden.

## Bewijs

- oorspronkelijke obligation: `seo-money-pages-commercial-intent-20260925-v1`
- recovery PR: `#3007`
- historische candidate head: `55afeef3e68b0b619ebc053415fdc831e4b8341d`
- historische PR-triggered BRAIN run: `36154098583`
- historische Required run: `36154098536`
- merge/reconcile SHA: `584311610b65ab1170c9f956965af26620c8b07b`
- bewezen productie SHA tijdens recovery: `6417fa291ac08345369e1e143abf974fac54f0e4`
- Netlify deploy: `6ab698be9627e6c36975bed1`

De actuele regressietest controleert expliciet dat Required single-flight blijft en dat Unified Brain niet opnieuw als automatische PR-fanout wordt aangezet.
