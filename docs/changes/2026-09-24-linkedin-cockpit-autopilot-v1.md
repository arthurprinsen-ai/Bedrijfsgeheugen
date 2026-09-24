# LinkedIn cockpit autopilot v1

De LinkedIn-cockpit wordt niet langer behandeld als een scherm dat dagelijks handmatig bediend moet worden. De bestaande Powerhouse social publisher consumeert nu ook geschikte cockpitacties.

## Wat automatisch gaat
Een evidence-backed reactie op een concrete LinkedIn-post kan automatisch worden opgepakt wanneer de actie nog `suggested` is, een directe LinkedIn-postbron heeft en er definitieve tekst beschikbaar is. De actie wordt eerst atomair geclaimd, vervolgens via de bestaande Composio LinkedIn-verbinding uitgevoerd en daarna met providerbewijs en outcome teruggeschreven.

## Wat bewust niet wordt geforceerd
LinkedIn-DM's en connectie-activatie worden niet nagemaakt via scraping, browsertrucs of een niet-bestaande provideractie. Als de gekoppelde LinkedIn/Composio-capability die handeling niet ondersteunt, blijft de cockpit dat item tonen als capability-exception.

## Waarom deze wijziging
De eerdere architectuur kon signaleren, prioriteren en concepten genereren, maar koppelde dat niet door naar uitvoering. Daardoor bleef menselijke bediening noodzakelijk. De structurele oplossing is om uitvoering aan de canonieke publisher toe te voegen, met dezelfde idempotency-, evidence- en outcome-regels.

## Borging
De wijziging heeft contracttests in de bestaande LinkedIn Revenue Cockpit-suite. De gebruikte outcome-RPC staat in het quality-surface-register. De delivery-classifier herkent de cockpittests. LIVE_PROVEN mag pas worden gebruikt na merge naar `main`, deployment van de Supabase function en geauthenticeerde runtime-readback.


## Productie-evidence — 2026-09-24

De autopilot is gemerged naar `main` via PR #2734, merge-SHA `350f90eb9b2c76a715530836a7d9c485c2ccdd42`.

De actieve Supabase runtime is `powerhouse-social-publisher` v49 met runtime SHA-256 `d7def61407cf27081a02bc0452c3b506a504e32e0051c86c09c97fc6285d6bf1`. Productie-readback bevestigt dat de runtime de cockpit-autopilot, `reconciliation_required`, `republish_forbidden` en de normal-mode hook bevat.

De bestaande cronjob `powerhouse-content-closed-loop-v1` (job 62) draait elke vijf minuten en roept de canonieke publisher al aan. Daardoor is geen nieuwe task of parallelle scheduler nodig. Een handmatig getriggerde closed-loop tick leidde tot meerdere `powerhouse-social-publisher` requests met HTTP 200 op productie v49.

Tijdens de live verificatie bevatte de hoogste `suggested` queue geen geldige `reply_post`-actie, alleen LinkedIn-DM/nieuwsacties. Daarom was nul externe comment-side-effect het correcte canary-resultaat. De runtime-integratie is `LIVE_PROVEN_RUNTIME`; een echte comment-provider-side-effect wordt pas als apart bewijs toegevoegd zodra een geldige `reply_post` door de autonome loop wordt uitgevoerd.
