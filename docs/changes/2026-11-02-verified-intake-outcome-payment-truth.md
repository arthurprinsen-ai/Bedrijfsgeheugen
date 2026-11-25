# P0 2026-11-02 — geverifieerde klantclaim telt één keer, getekende offerte is geen betaling

**Eigenaar:** bestaande Growth & Revenue OS, originele Supabase intake- en commerciële outcome-writer, ONE BRAIN/Heartbeat, P0 #4198. **Status:** codekandidaat; niets live zonder beschermde release en live SQL-readback.

## Onafhankelijke nulmeting (productie, 2 november)
- `scan_inzendingen`: 58 totaal, **56 unverified, 2 demo, 0 verified**.
- `offerte_inzendingen`: 9 totaal, vier getekend (€51.200 nominale offertewaarde), **alle vier demo**; overige 5 unverified, 0 verified.
- `growth_outcomes`: 1 leadbronregel, €0 aan positieve gerealiseerde omzet; `powerhouse_revenue_flywheel_v1`: geen opbrengstbewijs.
- `commercial_leads`: 0 rijen. Een scan zonder opt-in en geverifieerde klantidentiteit mag nooit via bulk-backfill worden omgezet in een contact of lead.
- **Bronfout A:** originele `bg_scan_uitkomst` is `AFTER INSERT` alleen. Omdat een scan op INSERT meestal unverified is en pas later via originele claim-route geverifieerd wordt, krijgt de eerste legitieme claim geen canonieke commerciële 'lead'-outcome.
- **Bronfout B:** originele `intern.trg_offerte_uitkomst` accepteert alleen verified tenant (terecht), maar zou bij een echte geverifieerde ondertekende offerte `won_order` met `new.totaal` als revenue_eur aan `bg_uitkomst_vastleggen` doorgeven. Een handtekening is geen onafhankelijk betaalbewijs; dit is een aantoonbare latente false-paid-revenue-route, niet reeds waargenomen echte foutieve klantomzet.

## Correctie: geen nieuwe keten
De bestaande `intern.bg_uitkomst_eenmalig` wordt hergebruikt. De originele triggers luisteren na insert ook naar een wijziging van tenant-identiteit/organisatie. Alleen `verified` met echte `organisatie_id` kan exact één scan-lead of offerte-proposal als source-linked stage vastleggen. Herhaalde UPDATE van dezelfde verified-tenant creëert geen extra conversies. Geen historical/backfill; bestaande demo/unverified records blijven onveranderd. Geen nieuwe grants, tabellen, scheduler, agent, auth-bypass, Data API exposure of externe berichten.

De offerte-source geeft `proposal` met omzetbedrag **0** en bewaart `quoted_contract_value_eur` uitsluitend als informatiewaarde met expliciete `payment_status=NOT_VERIFIED`. Een formele ondertekening blijft zichtbaar in de oorspronkelijke offerte-tabel; pas een aparte, geldig geautoriseerde provider-/bankbetaling kan de echte order/revenue-lus voeren. Voorkom dubbele proposal-events door dezelfde oorspronkelijke `bron_id` te blijven gebruiken. Let op: bestaande historische bronregels worden niet herschreven.

## Portaal en agents
De bronvolgorde is: website-scan → unverified SELF_REPORTED → originele geautoriseerde claim → `verified tenant` → een `lead/proposal` met 0 ontvangsten → toestemming/relevante volgende stap → afspraak/offerte → afzonderlijk betaalbewijs → klantnulmeting → gemeten effect → ONE BRAIN learning. Portal V2 toont elk stadium met bewijs en EVIDENCE_DUE; zonder identiteitsclaim of betaling niet groen. De bestaande `.agents/skills/trigger-based-mkb-acquisition/SKILL.md` en één originele inkopende/commerciële eigenaar zijn bijgewerkt.

## Acceptatie
1. Regresstest `tests/brain-verified-tenant-intake-quoted-value-payment-truth-20261102.test.mjs`: claim na INSERT, herhaalde updates, alleen verified tenant, demo blokkeren, getekend is niet paid, geen aparte writer.
2. Broncode via beschermde Required/CodeQL, main merge en overeenkomstige migratiehistorie in originele Supabase-project. **Niet** vooraf productiecode als live melden.
3. Independently SQL-readback `pg_get_triggerdef` en `pg_get_functiondef` na migratie; bestaande demo/unverified counts en echte revenue ongewijzigd, geen regressie in RLS/privacy.
4. Pas volgende legitieme, consented **real** identity-claim echt eenmalig in de originele outcome-spine zien; geen handmatig verzonnen klant. Onafhankelijke betaalprovider-readback bij eerste echte betaling. Root P0 #4198 blijft OPEN zonder aangetoonde betaalde klant.
