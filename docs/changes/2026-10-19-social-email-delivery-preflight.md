# Herstel publicaties en e-mailtransport — 19 oktober 2026

## Wat ging mis?

Twee onafhankelijke defecten veroorzaakten terugkerende stilstand. De Gmail-preflight rapporteerde een ontbrekende `account_user_resolved`-eigenschap, terwijl de backend het verbonden account al had opgelost. De persoonlijke LinkedIn-generator maakte meerdere dagen berichten met praktisch hetzelfde verhaal. De veilige duplicaatcontrole blokkeerde herpublicatie terecht.

## Wijziging in bestaande Powerhouse

De bestaande e-mailfunctie rapporteert nu in de dry-run twee afzonderlijke, daadwerkelijk vastgestelde accountvelden. De persoonlijke contentherstelroute kiest een ander geverifieerd bronrecord als het oorspronkelijke verhaal vóór een providerverzending is geweigerd. Wanneer geen uniek en geverifieerd bronrecord bestaat, stopt de publicatie met een duidelijke reden. De planner, CRM, governance, provider-write en duplicate-controles blijven ongewijzigd.

## Wat dit NIET oplost

Het systeem heeft momenteel geen expliciet goedgekeurde autonome e-mailontvangers in de CRM-data. De geblokkeerde `email_newsletter` is een afzonderlijke campagnefunctie zonder geautoriseerde canonieke executor. De inactieve Make-webhook mag niet blind worden aangezet: hij controleert de goedkeuring per ontvanger niet. Ook een contentbron kan niet worden verzonnen om de persoonlijke LinkedIn-post toch te laten publiceren.

## Acceptatie en borging

PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4473. Regression: `tests/brain-canonical-delivery-preflight-personal-dedupe-20261019.test.mjs`. Bewijsvolgorde: verplichte CI en CodeQL → beschermde merge → geautoriseerde Edge-deploy → nieuwe e-mailpreflight met beide accountvelden → controle op unieke LinkedIn-bron → externe providerreceipt. Pas na die bewijzen mag de desbetreffende uitvoer groen heten.
