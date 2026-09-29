# Workshopscan contact-release recovery

## Root cause
De eerste contact-release bevatte in drie bronbestanden literal `\\n`-escapes waar echte regeleinden bedoeld waren. Daardoor kon de Supabase Edge Function niet bundelen en konden HTML/CSS ongewenste tekst-escapes bevatten. Daarnaast miste de Brain learning de canonieke semantische velden `compiler.failure_class` en `root_cause`.

## Herstel
- literal newline-escapes vervangen door echte regeleinden in scan HTML, CSS en Edge Function;
- semantische Brain learning aangevuld;
- functionele scope blijft gelijk: verplichte naam, e-mail en telefoon, zichtbaar in de persoonlijke PDF en privé opgeslagen in de portal-intake.

## Preventie
Een release met Edge Function-wijziging is pas production-ready nadat de function source succesvol bundelt/deployt en de closure-learning semantic guard groen is.
