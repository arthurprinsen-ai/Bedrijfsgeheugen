# 21 november 2026 — menselijke LinkedIn-connectie-outreach & Bedrijfsgeheugen handtekening

**Status:** SOURCE_CANDIDATE_IN_PROTECTED_PR — nooit als productie-actief of bewezen hogere sales claimen voor onafhankelijke Required/CodeQL/Supabase/Gmail readback.

## Incident en oorzaak
Een feitelijk verzonden mail aan een LinkedIn-contact ("Manuela", Gmail-ID `1a1fccc860948474`, originele action-ID `d90d9a5b-49f5-4bdc-b55f-509248e0a8a5`) gebruikte AI-redactietaal zoals "(probleem)", "Praktische les", "Beperking", "Alternatief is niets doen" terwijl de oorspronkelijke composer daarvoor `quality_score=1.0` doorgaf. De generieke trusted-advisor-briefrichtlijn behandelde commerciële conversatie als lang adviesartikel. Het oorspronkelijke Gmail-sendpad verzond bovendien `is_html:false` zonder het officiële Bedrijfsgeheugen-merk of websitehandtekening.

## Kanaalnorm / contactintentie
1. **Bron eerst:** ga uit van feitelijk contact, eerdere conversatie, geverifieerde LinkedIn-connectie via `bg_connecties.extra.verbonden_op`, of onafhankelijke recente publieke informatie. Een LinkedIn-profiel-URL is geen bewezen connectie; een connectie is geen juridische opt-in.
2. **LinkedIn-connectie, eerste zakelijke e-mail:** noem de echte verbinding kort en zonder overdreven familiariteit; zeg in mensentaal dat Arthur Bedrijfsgeheugen is begonnen, waarom, en sluit aan op het werk van de ontvanger. Geen onbewezen persoonlijke ontmoeting, geen "onlangs" zonder datum, geen aanname dat de ontvanger een probleem heeft. Eerste doel is interesse, niet meteen een meeting.
3. **Eerder contact / reply / bezwaren:** begin bij de echte eerdere boodschap. Geen standaardintro opnieuw, geen automatische "twee observaties" en nooit druk bij stilte. Bij opt-out strikt onderdrukken.
4. **Klanttekst geen redactieregels:** verbied alle zichtbare interne tekst labels en meta-diagnoses ("(probleem)", "Praktische les", "Beperking", "hypothese", "alternatief is niets doen", "Human Commercial Composer"); check via deterministische `assessHumanOutreachCopy`.
5. **Ondertekening uitsluitend door originele Gmail-sender:** één compacte, toegankelijke HTML-handtekening: officiële HTTPS-logo-URL, Arthur Prinsen, Oprichter · Bedrijfsgeheugen, volledige HTTPS-link naar https://www.bedrijfsgeheugen.nl/ en bedrijfsmail. Houd HTML-tekst zichtbaar bij geblokkeerde externe afbeeldingen. Geen pixel, verborgen tracking of redirect-link. Nooit dubbele AI-handtekening in bericht.
6. **Harde grens:** bewijs rechtmatig verzenden, bron, ontvanger, suppressie, 14-daagse contactdruk, veilige claim, idempotente provider-ACK en onafhankelijke Gmail-message-readback zoals voorheen. De oorspronkelijke scheduler, owner, action-ID, outcome-verwerking en Heartbeat blijven exclusief. Geen alternatieve sender, geen extra cron, geen resend van onzekere of al verstuurde items.

## Onderbouwing externe bronnen
- Hunter 2026 rapport, 31 miljoen mails, meer respons bij gerichte personalisatie dan template-bulk: https://hunter.io/the-state-of-cold-email
- Gong 2026, doorgaans 50–100 woorden bij senior beslissers en waarde-CTA: https://www.gong.io/blog/do-execs-really-reply-to-cold-email-here-s-what-the-data-says
- ACM Nederlandse ongevraagde reclame: https://www.acm.nl/nl/verkoop-aan-consumenten/reclame-en-verleiden/spam-voorkomen-uw-reclame
- DDMA vereisten en uitzonderingen toestemming: https://ddma.nl/legal/wetgeving/e-mail/
- Gmail geauthenticeerde HTML en afzendertransparantie: https://support.google.com/mail/answer/81126

Deze bronnen zijn hypotheses voor betere copy, niet bewijs van gerealiseerde reply-uplift. Meet op originele provider-ID alleen echte positieve antwoorden, nuttige gesprekken, afspraken, gekwalificeerde aanvragen, afmeldingen, klachten en aantoonbare omzet. Externe cijfers zijn geen eigen causale winst.

## Regressie en uitrol
- `tests/brain-outreach-human-intent-quality-20261121.test.mjs`: herhaalt slechte Manuela-copy als af te keuren, gecontroleerde LinkedIn-connectie, oprichterstekst, logo/HTML/full-URL, oorspronkelijke consent-, suppression- en readback-gates.
- PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/6094
- Vereist: protected CI Required, CodeQL, een echte gecontroleerde compositie in originele Supabase edge function en zonder extra leadmail onafhankelijke Gmail HTML-readback op een geautoriseerde testmail voordat LIVE_VERIFIED mag worden ingevuld.
