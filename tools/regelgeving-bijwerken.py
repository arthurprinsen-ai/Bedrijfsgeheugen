#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Werkt data/regelgeving.json bij met de actuele stand van AI Act, NIS2 en GPAI.

Waarom dit bestaat: /frisse-blik toonde compliance-datums die in de HTML zelf
stonden, met een knop die vanuit de browser de Anthropic API aanriep. Die browser
heeft geen sleutel, dus dat werkte op de live site nooit. Het bijwerken gebeurt
nu hier, server-side, en de pagina leest alleen nog data/regelgeving.json.

Draait wekelijks via .github/workflows/regelgeving-bijwerken.yml.
Faalt hij, dan mailt GitHub dat naar de eigenaar van de repo — dat is het signaal
dat de datums op de pagina niet meer gecontroleerd zijn.
"""
import json, os, sys, urllib.request, datetime, re

BESTAND = 'data/regelgeving.json'
MODEL = 'claude-sonnet-4-6'

VRAAG = (
    "Je bent een compliance-onderzoeker. Zoek op internet de ACTUELE status (vandaag: {vandaag}) van: "
    "(1) EU AI Act-deadlines incl. Digital Omnibus (hoog-risico Annex III/I, transparantie art. 50, "
    "watermerken, nieuwe verboden) — vermeld expliciet of wijzigingen definitief zijn aangenomen; "
    "(2) de Nederlandse Cyberbeveiligingswet (NIS2): parlementaire status en (verwachte) "
    "inwerkingtredingsdatum; (3) GPAI-verplichtingen en handhaving (incl. bestaande modellen, "
    "2 aug 2027) en (4) actuele CBS-cijfers over AI-gebruik door Nederlandse bedrijven. "
    "Antwoord met UITSLUITEND geldige JSON (geen markdown) in exact dit schema: "
    '{{"peildatum":"<d maand jjjj>","peildatumISO":"<jjjj-mm-dd>","omnibusStatus":"<een zin>",'
    '"deadlines":[{{"date":"jjjj-mm-dd","label":"<omschrijving, vermeld uitgesteld waar van toepassing>",'
    '"kort":"<max 4 woorden>"}}],"fines":{{"aiActLow":3,"aiActHigh":7,"nis2":2}},'
    '"stats":{{"mkbAI":"<x,x%>","grootAI":"<x,x%>","bedrijfAI2024":"<x,x%>","bedrijfAI2023":"<x%>",'
    '"afhaakErvaring":"<x,x%>","gartnerTop":"<5%"}}}} '
    "Eisen: 5-9 deadlines, chronologisch, alleen met bronnen onderbouwde data; bij onzekerheid het "
    "woord verwacht in het label. Laat verlopen datums staan alleen als ze nog dit jaar spelen."
)


def geldig(d):
    if not isinstance(d, dict):
        return 'geen object'
    for veld in ('peildatum', 'peildatumISO', 'deadlines', 'fines', 'stats'):
        if veld not in d:
            return 'veld %s ontbreekt' % veld
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', str(d['peildatumISO'])):
        return 'peildatumISO onjuist'
    if not isinstance(d['deadlines'], list) or not (4 <= len(d['deadlines']) <= 9):
        return 'aantal deadlines buiten 4-9'
    for x in d['deadlines']:
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', str(x.get('date', ''))):
            return 'deadline zonder geldige datum'
        if not x.get('label') or not x.get('kort'):
            return 'deadline zonder label of kort'
    return None


def main():
    sleutel = os.environ.get('ANTHROPIC_API_KEY', '').strip()
    if not sleutel:
        print('GEEN SLEUTEL: zet ANTHROPIC_API_KEY als repository secret. '
              'Zonder die sleutel kan de regelgeving niet gecontroleerd worden.')
        return 1

    vandaag = datetime.date.today()
    body = json.dumps({
        'model': MODEL,
        'max_tokens': 2500,
        'tools': [{'type': 'web_search_20250305', 'name': 'web_search', 'max_uses': 8}],
        'messages': [{'role': 'user', 'content': VRAAG.format(
            vandaag=vandaag.strftime('%-d %B %Y'))}],
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.anthropic.com/v1/messages', data=body,
        headers={'content-type': 'application/json', 'x-api-key': sleutel,
                 'anthropic-version': '2023-06-01'})
    with urllib.request.urlopen(req, timeout=180) as r:
        antwoord = json.load(r)

    tekst = ''.join(b.get('text', '') for b in antwoord.get('content', [])
                    if b.get('type') == 'text')
    tekst = tekst.replace('```json', '').replace('```', '')
    nieuw = json.loads(tekst[tekst.index('{'):tekst.rindex('}') + 1])

    fout = geldig(nieuw)
    if fout:
        print('ANTWOORD AFGEKEURD: %s' % fout)
        print(tekst[:800])
        return 1

    # peildatum mag nooit in de toekomst liggen of ouder zijn dan vandaag - 7
    peil = datetime.date.fromisoformat(nieuw['peildatumISO'])
    if peil > vandaag or (vandaag - peil).days > 7:
        nieuw['peildatumISO'] = vandaag.isoformat()
        nieuw['peildatum'] = vandaag.strftime('%-d %B %Y')

    oud = {}
    if os.path.exists(BESTAND):
        oud = json.load(open(BESTAND, encoding='utf-8'))

    samen = dict(oud)
    samen.update(nieuw)
    if json.dumps(samen, sort_keys=True, ensure_ascii=False) == json.dumps(oud, sort_keys=True, ensure_ascii=False):
        print('Niets gewijzigd; peildatum blijft %s' % oud.get('peildatum'))
        return 0

    with open(BESTAND, 'w', encoding='utf-8') as f:
        json.dump(samen, f, ensure_ascii=False, indent=2)
        f.write('\n')

    inhoud_gewijzigd = json.dumps(oud.get('deadlines'), ensure_ascii=False) != \
        json.dumps(samen.get('deadlines'), ensure_ascii=False)
    print('Bijgewerkt naar %s%s' % (samen['peildatum'],
          ' — DE TIJDLIJN IS GEWIJZIGD' if inhoud_gewijzigd else ' (alleen peildatum)'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
