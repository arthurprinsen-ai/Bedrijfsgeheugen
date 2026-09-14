#!/usr/bin/env python3
import hashlib
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import publish_approved_blog as base
import publish_approved_blog_v2 as v2

q = {
    'page': '3dbda36a-ac8a-81bf-aa50-cfa7e6ea566a',
    'slug': 'zoekverkeer-stijgt-omzet-niet',
    'source': 'powerhouse:2026-09-14:blog',
    'cmd': 'seo-publish|powerhouse:2026-09-14:blog|zoekverkeer-stijgt-omzet-niet',
    'attempt': 0,
    'title': 'Waarom je zoekverkeer stijgt en je omzet niet: het onderprijsde probleem in organische kwalificatie',
    'keyword': 'organisch zoekverkeer kwalificeren',
    'meta': 'Je organisch verkeer groeit, maar aanvragen blijven achter. Ontdek waar zoekvraag niet kwalificeert en hoe je die frictie in content verkleint.',
    'source_hash': 'PENDING_SEAL',
    'blogtext': """Je Search Console-rapport ziet er prima uit. Impressies stijgen, je scoort op relevante zoektermen, misschien zelfs op een paar termen waar je concurrenten niet bij komen. En toch: het aantal serieuze aanvragen dat uit die organische bezoekers voortkomt, blijft achter bij wat de zoekvraag zou moeten opleveren.<br><br>Dit is geen ranking-probleem. Het is een kwalificatie-probleem, en het is opvallend hoe vaak dit probleem onderbelicht blijft in de gemiddelde SEO-aanpak. Bedrijven optimaliseren volop op zichtbaarheid, maar nauwelijks op de vraag die daarna telt: komt hier iemand terecht die ook daadwerkelijk past bij wat wij oplossen?<br><br>**Het verschil tussen zoekvraag en gekwalificeerde vraag**<br><br>Zoekvraag is het aantal mensen dat een bepaalde term intikt. Gekwalificeerde vraag is het deel daarvan dat een probleem heeft dat jij oplost, op het moment dat ze er open voor staan om iets te doen. Tussen die twee zit een laag die in de praktijk zelden expliciet wordt gemanaged: de vertaling van een generieke zoekintentie naar een scherp herkend probleem.<br><br>Veel content is geschreven om gevonden te worden, niet om te activeren. Het resultaat: bezoekers landen op een pagina die informatief is, maar die hen niet helpt te beseffen dat hun situatie een naam heeft, een patroon is, en een kostenplaatje met zich meebrengt als er niets verandert. Ze lezen, knikken, en vertrekken. Geen fricties opgelost, geen volgende stap gezet.<br><br>**Waarom dit probleem onderprijsd wordt**<br><br>De reden dat dit probleem zo vaak onder de radar blijft, is dat de symptomen zich niet meteen als "SEO-probleem" aandienen. Traffic groeit, bouncepercentages zijn niet dramatisch, en de site "werkt" in de zin dat hij gevonden wordt. Maar de vraag die zelden gesteld wordt, is: hoeveel van deze bezoekers herkennen zichzelf daadwerkelijk in het probleem dat wij beschrijven?<br><br>Dat is precies waar de frictie zit. Niet in het aantrekken van bezoekers, maar in het moment van herkenning. Als een lezer op PROBLEM_AWARE niveau zit — hij weet dat er iets knelt, maar heeft het nog niet scherp geformuleerd — dan is de taak van je content niet "informeren over je dienst". De taak is: het probleem zo specifiek en herkenbaar neerzetten dat de lezer denkt "dit ben ik" of "dit is precies wat er bij ons misgaat".<br><br>Zonder die stap blijft zoekvraag decoratief. Het levert bezoekcijfers op die goed staan in een rapport, maar die zich niet vertalen naar gesprekken, offertes of omzet.<br><br>**Wat frictie-reductie in dit stadium betekent**<br><br>Frictie-reductie klinkt technisch, maar in de context van organische kwalificatie gaat het om iets heel praktisch: de afstand verkleinen tussen "ik heb een vaag ongemak" en "ik zie nu exact wat er aan de hand is en waarom het kostbaar is om het te laten liggen".<br><br>Drie plekken waar die frictie meestal zit:<br><br>Ten eerste, de taal. Content die het probleem beschrijft in vakjargon of vanuit de oplossing, in plaats van vanuit de dagelijkse ervaring van de lezer, mist de herkenning. Een lezer die zoekt op een symptoom herkent zichzelf niet in een tekst die meteen over de oplossing begint.<br><br>Ten tweede, de specificiteit. Algemene uitspraken over "inefficiëntie" of "gemiste kansen" activeren niets. Concrete patronen — herkenbare situaties, terugkerende knelpunten, het soort dingen die iemand zelf al half wist maar nooit had uitgesproken — doen dat wel. Hoe scherper het probleem benoemd wordt, hoe kleiner de afstand tot herkenning.<br><br>Ten derde, het ontbreken van een duidelijke volgende stap. Als een lezer het probleem herkent, maar geen logische, laagdrempelige manier ziet om te checken of het bij hen ook zo speelt, verdwijnt die herkenning weer. De brug tussen "dit herken ik" en "laat me dit even laten bekijken" moet klein en concreet zijn, niet een verkooppitch.<br><br>**Wat dit kost als het onopgelost blijft**<br><br>De kosten van dit probleem zijn niet dramatisch zichtbaar, en dat is precies het punt. Er gaat geen alarm af. Wat er wel gebeurt: zoekvraag die je al hebt verdiend met SEO-inspanning, wordt onvoldoende benut. Bezoekers die eigenlijk klaar waren om verder te kijken, vertrekken zonder dat er een signaal wordt vastgelegd. Concurrenten die dezelfde zoekvraag wel omzetten in gekwalificeerde gesprekken, bouwen een voorsprong op die niet uit betere rankings komt, maar uit betere activatie.<br><br>Uitstel van deze correctie is dus niet neutraal. Elke maand dat content zoekvraag aantrekt zonder die vraag te kwalificeren, is een maand waarin het onderliggende probleem van de bezoeker onbenoemd blijft — en waarin die bezoeker het antwoord ergens anders vindt, bij een partij die het probleem wél scherp weet te verwoorden.<br><br>**Hoe je dit zelf herkent**<br><br>Je hebt dit probleem waarschijnlijk als je herkent dat:<br><br>Je organisch verkeer aantoonbaar groeit, maar het aantal inhoudelijke aanvragen daaruit niet evenredig meebeweegt. Je content beantwoordt vragen, maar zet zelden een lezer aan tot een concrete volgende stap. Je site trekt bezoekers aan op probleemtermen, maar de tekst zelf begint al snel over jullie aanpak of dienst, in plaats van over de situatie van de lezer.<br><br>Geen van deze signalen is op zichzelf alarmerend. Samen wijzen ze op een structureel patroon: zoekvraag die niet wordt vertaald naar herkenning, en herkenning die niet wordt vertaald naar een volgende stap.<br><br>**De eerste, kleine stap**<br><br>Dit oplossen begint niet met een contentherziening van je hele site. Het begint met zicht krijgen op waar in jouw specifieke geval de frictie zit: bij de taal, bij de specificiteit, of bij het ontbreken van een logische volgende stap. Dat is iets dat je met een gerichte blik van buiten sneller scherp krijgt dan wanneer je zelf door je eigen content heen leest — je kent je eigen aanbod te goed om nog te zien wat een nieuwe bezoeker wél of niet herkent.<br><br>Wil je weten waar dit in jouw content precies knelt? Vraag een diagnose aan waarin we samen kijken naar waar je zoekvraag wegvloeit voordat die kwalificeert."""
}

if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', q['slug']):
    raise SystemExit('invalid slug')
if q['cmd'] != f"seo-publish|{q['source']}|{q['slug']}":
    raise SystemExit('publish command mismatch')
if not 120 <= len(q['meta']) <= 170:
    raise SystemExit(f"meta length invalid: {len(q['meta'])}")
payload = '\n'.join([q['source'], q['slug'], q['title'], q['keyword'], q['meta'], q['blogtext']])
actual_hash = hashlib.sha256(payload.encode()).hexdigest()
target = pathlib.Path('blog') / q['slug'] / 'index.html'
if target.exists():
    raise SystemExit('target slug already exists')
target.parent.mkdir(parents=True, exist_ok=True)
html = base.article(base.TEMPLATE.read_text(encoding='utf-8'), q)
target.write_text(v2.instrument_content_id(html, q['slug']), encoding='utf-8')
base.updates(q)
print(f'RECOVERY_RENDERED slug={q["slug"]} source_hash={actual_hash}')
