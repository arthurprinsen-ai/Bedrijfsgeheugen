# Onderzoeksreparatie onafhankelijk vóór de vastlopende index

Obligation-ID: portal|bounded-internal-research-economics|20261020
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Protected sources: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4540 en https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4546

Na herstel van alle 731 toegepaste versie-identiteiten kwam de productie-integratie werkelijk bij DDL. Check 118618278557 faalde om 12:08:19 UTC op statement 3 van 20261020113000: de publicatie-index op bronpublicaties kreeg 57014. De functiecorrectie van #4546 stond als versie 20261020143000 ná deze blokkade en kon via canonieke replay dus nooit eerst werken.

De correctie projecteert de exact reeds beschermde function-only SQL bytegelijk als 20261020112220, vóór de eerste waargenomen blokkade 20261020113000. De bestaande beschermde versie blijft behouden. De functie heeft haar eigen transactie, 2 seconden lockbudget en 12 seconden statementbudget, behoudt LIMIT 50, anti-join/dedupe, historie, onbekende kosten en server-only EXECUTE. Daarna volgt 20261020112221: uitsluitend de exacte eigen kandidaatindex uit #4540, apart begrensd op 2 seconden locks en 20 seconden statements. Die index kan de eerder gecommitteerde functie niet terugdraaien. Er wordt niets aan andere indexen, actieve schedulers of productiehistorie veranderd. Dit is replayvolgordeherstel, geen timestamp-wijziging van bestaande bronbestanden of handmatige providerdeploy.

De regressie faalde eerst op de twee ontbrekende vroege projecties; zij bewaakt nu exacte bronbytes, werkelijke sorteervolgorde, aparte transacties, timeoutgrenzen en behoud van de oorspronkelijke identiteiten. De bestaande System Map/component- en authorityrelaties blijven gelijk; de bestaande learning-naar-skill-projectie neemt deze preventieregel op.

Acceptatie: alle normale Required/CodeQL/preview-gates; beschermde merge; werkelijk teruglezen van de twee vroege versies, functiehash/rechten, eigen index en begrensde verwerking. Een eventuele latere fout bij de afzonderlijke publicatie-index blijft zichtbaar in #4215 en maakt deze onafhankelijke reparatie niet ongedaan. Geen universeel portaalgroen zonder actuele klantacceptatie.
