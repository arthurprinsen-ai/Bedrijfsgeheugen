# Instagram herstelroute: server-only toegang (21 november 2026)

## Wat is verbeterd?
De Instagram-herstelcontrole van Bedrijfsgeheugen gebruikte eerder een vaste toegangscode in de Edge Function. Die is vervangen door een expliciete serverautorisatie vóór database- en providertoegang. Een gewone bezoeker, een gebruikerssessie of een publieke API-sleutel krijgt geen toegang. De respons geeft geen ruwe instellingen van de externe provider meer terug.

## Productiecontrole
De bestaande Supabase-functie draait nu als **ACTIVE v10**; de live bron is byte-identiek aan de code in de bijbehorende beveiligings-PR. Onafhankelijk gemeten: GET 405; POST zonder autorisatie 401; POST met een ongeldige oude herstelheader 401. De securitytests en de veilige monitoringchecker zijn lokaal 7/7 geslaagd en de bestaande Security Operations-workflow draaide succesvol op de exacte kandidaatbranch.

## Blijvende beveiliging
In de bestaande Security Operations-workflow is een extra controle toegevoegd die de originele functionele toegangsgrens test zonder credentials of datawijzigingen. De geplande controle is pas actief op de standaardbranch **na** de beschermde merge; de providerhotfix is afzonderlijk reeds live. Er is geen nieuwe scheduler en Make is niet gebruikt.

## Restpunten
Het GitHub-mergeproces moet worden afgerond met Required en CodeQL. Daarnaast blijven volledige per-route CSP, WAF/rate limiting, account-MFA, broncodezichtbaarheid en sommige legacy server-to-server callers afzonderlijke beveiligingsverplichtingen. De fix is geen algehele garantie tegen aanvallen.
