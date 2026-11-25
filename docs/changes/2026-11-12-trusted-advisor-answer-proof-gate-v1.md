# Trusted Advisor — antwoordbewijs niet op basis van statuslabel

Datum: 2026-11-12. Oorspronkelijk incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Bestaande fout
De Portal V2 renderer `normalizeAnswerAssurance` accepteerde `status: verified` als zelfstandig bewijs. Een bericht zonder bewijsreferentie of met expliciete `not_independently_verified` kon daardoor toch **Geverifieerd** tonen. De standaardbron `Bedrijfsgeheugen` verhulde ontbrekende bronidentiteit.

## Gerichte reparatie
In dezelfde `portal-v2/trusted-advisor-assurance.js` is de presentatieguard aangescherpt. De combinatie van geïdentificeerde bron, `claimVerification: independently_verified` en niet-lege `evidenceRef` is nodig voor het label. Ontbrekende of tegenstrijdige velden worden zichtbaar teruggezet naar **Niet onafhankelijk geverifieerd**. Ook `grounded` zonder bron wordt teruggezet. Node-regressietests bestrijken ontbrekende referenties, tegenstrijdige vlaggen, ontbrekende bron en de expliciete combinatie.

Dit valideert de bronreferentie niet cryptografisch of bij een provider. Die taak blijft bij de bestaande server/ONE BRAIN-evidence-eigenaar. Er is geen tweede verificatiedienst, cron, agent, database of directe productiehotfix gebouwd.

## Kwaliteits- en releasepoort
Origineel beleid en bestaande CMS/redactieskill geborgd; learning en ledger binnen bestaande incidentlineage. Eerst exact-head testen, Required/BRAIN/CodeQL, beschermd mergen, Netlify exact-SHA, en live browser-readback van echte en lege tenantstate. Tot dat moment **CODE_CANDIDATE**; geen claim van gedeployde reparatie, volledig groene klantoverdracht of gemeten toename in vertrouwen.
