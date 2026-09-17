# -*- coding: utf-8 -*-
"""Controleert de site tegen de SEO- en zoekwoordstrategie uit Notion.

De SEO-check bewaakt zoekwoord-ownership, clusterstructuur, technische SEO,
interne linkkracht, merktaal en sitemapdekking. De canonical brand shell wordt
bewust niet hier opnieuw gevalideerd: die heeft een eigen browsermatige gate in
paginacontrole.py en de production-build projecteert dezelfde canonical shell.
Zo blijft er één shell-authority en kan een legacy HTML-fragment geen sitebrede
false positives veroorzaken.
"""
import glob, html, io, json, os, re, sys, unicodedata

CLUSTERS = {
    '/afas-koppeling': [
        '/exact-online-koppeling', '/twinfield-koppeling', '/webshop-koppeling',
        '/api-koppeling-laten-maken'],
    '/bedrijfsgeheugen': [
        '/blog/wat-is-een-bedrijfsgeheugen/', '/zelfscan', '/product',
        '/afmaakindex', '/frisse-blik', '/systemen-koppelen', '/due-diligence',
        '/ai-adoptie', '/begrippen'],
    '/blog/systemen-koppelen-mkb/': [
        '/blog/afas-exact-koppelen/', '/blog/afas-koppeling/',
        '/blog/wat-kost-een-afas-koppeling/', '/blog/wat-kost-een-afas-partner/',
        '/blog/planning-in-excel-vervangen/', '/blog/offertes-opvolgen-zonder-crm/',
        '/connect', '/systemen-koppelen'],
    '/blog/wat-kost-digitalisering-mkb/': [
        '/blog/wat-kost-een-afas-koppeling/', '/blog/wat-kost-een-afas-partner/',
        '/blog/automatiseren-zonder-traject/', '/frisse-blik', '/prijzen'],
    '/blog/wat-is-een-bedrijfsgeheugen/': [
        '/blog/bedrijfsopvolging-begin-bij-het-geheugen/', '/product', '/zelfscan',
        '/blog/werkinstructie-voorbeeld/'],
    '/blog/bedrijfsopvolging-begin-bij-het-geheugen/': [
        '/due-diligence', '/investeerders-ma', '/blog/wat-is-een-bedrijfsgeheugen/'],
    '/ai-adoptie': [
        '/ai-act', '/ai-governance', '/data-soevereiniteit', '/business-case-ai',
        '/ai-voor-bestuurders', '/ai-implementeren', '/ai-poc', '/workshops',
        '/ai-scan', '/benchmark', '/afmaakindex', '/ai-capability-model'],
}

EIGENAAR = {
    'systemen koppelen mkb': '/blog/systemen-koppelen-mkb/',
    'wat kost digitalisering mkb': '/blog/wat-kost-digitalisering-mkb/',
    'prijzen digitalisering mkb': '/prijzen',
    'bedrijfsopvolging familiebedrijf kennis': '/blog/bedrijfsopvolging-begin-bij-het-geheugen/',
    'eu ai act mkb': '/blog/eu-ai-act-mkb/',
    'afas koppeling kosten': '/blog/wat-kost-een-afas-koppeling/',
    'afas pocket app koppelen': '/afas-pocket-koppelen',
    'erp implementatie mislukt': '/blog/automatiseren-zonder-traject/',
    'ai marketing mkb': '/ai-marketing-mkb',
    'kennisborging mkb': '/product',
    'werkinstructie voorbeeld': '/blog/werkinstructie-voorbeeld/',
    'ai adoptie mkb': '/ai-adoptie',
    'ai act compliance mkb': '/ai-act',
    'ai workshop mkb': '/workshops',
    'ai governance mkb': '/ai-governance',
    'ai capability model': '/ai-capability-model',
    'data soevereiniteit': '/data-soevereiniteit',
    'chatgpt bedrijfsgegevens beleid': '/data-soevereiniteit',
    'business case ai mkb': '/business-case-ai',
    'ai strategie directie': '/ai-voor-bestuurders',
    'ai implementeren mkb': '/ai-implementeren',
    'ai pilot opzetten mkb': '/ai-poc',
    'bedrijfsprocessen automatiseren': '/bedrijfsprocessen-automatiseren',
    'exact online koppeling': '/exact-online-koppeling',
    'api koppeling laten maken': '/api-koppeling-laten-maken',
    'twinfield koppeling': '/twinfield-koppeling',
    'webshop koppelen boekhouding': '/webshop-koppeling',
    'ai scan mkb': '/ai-scan',
    'benchmark mkb digitalisering': '/benchmark',
    'afmaakindex': '/afmaakindex',
    'bedrijfsgeheugen': '/bedrijfsgeheugen',
    'kennisverlies mkb': '/blog/wat-is-een-bedrijfsgeheugen/',
    'begrippenlijst mkb': '/begrippen',
}

# Niet-publieke of uitgefaseerde surfaces horen niet in de SEO-indexcontrole.
OVERSLAAN = {
    'index-oud', 'klantportaal', 'klantformulier', 'klantportaal-demo',
    'klant-login', 'prototype-v18-stable',
}
GEEN_CANONICAL = {'404'}
GEEN_H2 = {'404'}
GEEN_SCHEMA = {'404', 'bedankt', 'zelfscan'}
VERBODEN_WOORDEN = {
    'implementeren': {'/ai-implementeren', '/expertises', '/ai-adoptie', '/ai-poc'},
    'implementatie': {'/ai-implementeren', '/frisse-blik', '/power-bi-implementatie', '/expertises'},
    'optimaliseren': set(),
    'optimalisatie': set(),
    'strategisch': {'/ai-voor-bestuurders'},
    'strategische': {'/ai-voor-bestuurders'},
    'waardevol': set(),
    'ontzorgen': set(),
    'naadloos': set(),
    'toekomstbestendig': set(),
    'op het snijvlak': set(),
    'oplossingen op maat': set(),
}
GEEN_TAALEIS = {'privacy', '404', 'index-oud', 'klantportaal', 'klantportaal-demo'}
MIN_INKOMEND = 3
MIN_UITGAAND = 2
GEEN_LINKEIS = {'index', '404', 'bedankt', 'privacy', 'contact'}
SLECHTE_ANKERS = {'lees meer', 'klik hier', 'meer info', 'hier', 'lees verder', 'meer'}
MERK = 'bedrijfsgeheugen'


def norm(t):
    t = html.unescape(re.sub(r'<[^>]+>', ' ', t or '')).lower()
    t = ''.join(c for c in unicodedata.normalize('NFD', t)
                if unicodedata.category(c) != 'Mn')
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]', ' ', t)).strip()


def zonder_merk(titel):
    t = titel
    for scheiding in (' | ', ' — ', ' - ', ' · '):
        deel = t.split(scheiding)
        if len(deel) > 1 and MERK in norm(deel[-1]) and len(norm(deel[-1]).split()) <= 3:
            t = scheiding.join(deel[:-1])
    return t


def _woorden_matchen(zoekwoord, doel):
    woorden = [w for w in zoekwoord.split()
               if w not in ('van', 'de', 'het', 'een', 'in', 'je')]
    doelwoorden = norm(doel).split()
    return all(any(d.startswith(w[:max(4, len(w) - 2)]) for d in doelwoorden)
               for w in woorden)


def claimt(zoekwoord, pagina):
    """Bepaal zoekwoord-ownership met expliciete meta als authority.

    Als ``bg-zoekwoord`` aanwezig is, is die expliciete classificatie leidend.
    Titel en H1 zijn dan presentatiecopy en mogen de ownership-claim niet
    ongedaan maken. Alleen zonder expliciete meta gebruiken we de historische
    titel/H1-heuristiek.
    """
    expliciet = norm(pagina.get('zoekwoord', ''))
    if expliciet:
        return _woorden_matchen(zoekwoord, expliciet)
    doel = norm(zonder_merk(pagina['titel'])) + ' ' + norm(' '.join(pagina['h1']))
    return _woorden_matchen(zoekwoord, doel)


def lees_paginas():
    paginas = {}
    for f in sorted(glob.glob('*.html') + glob.glob('blog/*/index.html')):
        naam = os.path.basename(f)[:-5]
        if naam in OVERSLAAN:
            continue
        s = io.open(f, encoding='utf-8').read()
        if f == 'index.html':
            url = '/'
        elif f.endswith('/index.html'):
            url = '/' + f[:-len('index.html')]
        else:
            url = '/' + f[:-5]
        if '<main' in s and '</main>' in s:
            hoofd = s[s.find('<main'):s.find('</main>')]
        else:
            hoofd = s
        paginas[url.rstrip('/') or '/'] = {
            'bestand': f,
            'url': url,
            'ruw': s,
            'hoofd': hoofd,
            'titel': html.unescape((re.search(r'<title>(.*?)</title>', s, re.S) or [None, ''])[1]),
            'meta': html.unescape((re.search(r'<meta name="description" content="(.*?)"', s, re.S) or [None, ''])[1]),
            'zoekwoord': html.unescape((re.search(r'<meta name="bg-zoekwoord" content="(.*?)"', s, re.S) or [None, ''])[1]),
            'h1': re.findall(r'<h1[^>]*>(.*?)</h1>', s, re.S),
            'h2': [norm(x) for x in re.findall(r'<h2[^>]*>(.*?)</h2>', s, re.S)],
            'canon': (re.search(r'<link rel="canonical" href="(.*?)"', s) or [None, ''])[1],
            'og': bool(re.search(r'property="og:title"', s)),
            'links': set(
                x.split('#')[0].split('?')[0].rstrip('/') or '/'
                for x in re.findall(
                    r'href="(?:https://www\.bedrijfsgeheugen\.nl)?(/[^"]*)"', hoofd
                )
            ),
            'ankers': re.findall(
                r'<a [^>]*href="(?:https://www\.bedrijfsgeheugen\.nl)?/[^"]*"[^>]*>(.*?)</a>',
                hoofd,
                re.S,
            ),
        }
    return paginas


def main():
    P = lees_paginas()
    bevindingen = []

    # 1. Eén zoekwoord, één eigenaar.
    for zw, eigenaar in EIGENAAR.items():
        sleutel = eigenaar.rstrip('/') or '/'
        claimers = [u for u, p in P.items() if claimt(zw, p)]
        if sleutel not in claimers:
            bevindingen.append((
                'hoog', eigenaar,
                'claimt het zoekwoord "%s" niet via bg-zoekwoord of titel/h1' % zw,
            ))
        anderen = [u for u in claimers if u != sleutel]
        if anderen:
            bevindingen.append((
                'hoog', eigenaar,
                'kannibalisatie op "%s" — ook geclaimd door: %s'
                % (zw, ', '.join(anderen)),
            ))

    # 2. Clusterstructuur heen en terug.
    for pijler, leden in CLUSTERS.items():
        sp = pijler.rstrip('/') or '/'
        p = P.get(sp)
        if not p:
            bevindingen.append(('hoog', pijler, 'pijlerpagina bestaat niet'))
            continue
        for lid in leden:
            sl = lid.rstrip('/') or '/'
            q = P.get(sl)
            if not q:
                bevindingen.append(('hoog', lid, 'clusterpagina bestaat niet'))
                continue
            if sl not in p['links']:
                bevindingen.append(('midden', pijler, 'linkt niet naar clusterpagina %s' % lid))
            if sp not in q['links']:
                bevindingen.append(('midden', lid, 'linkt niet terug naar de pijler %s' % pijler))

    # 3. Technische SEO per pagina.
    for url, p in sorted(P.items()):
        naam = os.path.basename(p['bestand'])[:-5]
        map_naam = p['bestand'].split('/')[1] if p['bestand'].startswith('blog/') else naam
        t, m = len(p['titel']), len(p['meta'])

        if not p['titel']:
            bevindingen.append(('hoog', url, 'geen titel'))
        elif t > 65:
            bevindingen.append(('midden', url, 'titel is %d tekens, Google kapt rond 65' % t))
        elif t < 25:
            bevindingen.append(('laag', url, 'titel is maar %d tekens' % t))

        if not p['meta']:
            bevindingen.append(('hoog', url, 'geen meta-omschrijving'))
        elif not 110 <= m <= 165:
            bevindingen.append(('laag', url, 'meta-omschrijving is %d tekens, streef naar 110 tot 165' % m))

        if len(p['h1']) != 1:
            bevindingen.append(('hoog', url, '%d keer een h1, er hoort er precies één te zijn' % len(p['h1'])))
        if not p['canon'] and map_naam not in GEEN_CANONICAL and naam not in GEEN_CANONICAL:
            bevindingen.append(('midden', url, 'geen canonical'))
        if not p['og']:
            bevindingen.append(('laag', url, 'geen og:title voor het delen op social'))
        if not p['h2'] and naam not in GEEN_H2:
            bevindingen.append(('laag', url, 'geen enkele h2 — de pagina heeft geen structuur'))

        blokken = re.findall(r'<script type="application/ld\+json">(.*?)</script>', p['ruw'], re.S)
        if not blokken and naam not in GEEN_SCHEMA:
            bevindingen.append(('midden', url, 'geen gestructureerde data (JSON-LD)'))
        for b in blokken:
            try:
                json.loads(b)
            except ValueError as e:
                bevindingen.append(('hoog', url, 'gestructureerde data is ongeldig JSON: %s' % e))

        for anker in p['ankers']:
            a = norm(anker)
            if a in SLECHTE_ANKERS:
                bevindingen.append(('midden', url, 'ankertekst "%s" zegt niets over de bestemming' % a))
                break

    # 4. Interne linkkracht.
    inkomend = {u: set() for u in P}
    for bron, p in P.items():
        for doel in p['links']:
            d = doel.rstrip('/') or '/'
            if d in inkomend and d != bron:
                inkomend[d].add(bron)

    for url, p in sorted(P.items()):
        naam = os.path.basename(p['bestand'])[:-5]
        if naam in GEEN_LINKEIS:
            continue
        n_in = len(inkomend[url])
        if n_in == 0:
            bevindingen.append(('hoog', url, 'weespagina — geen enkele andere pagina linkt hierheen'))
        elif n_in < MIN_INKOMEND:
            bevindingen.append((
                'midden', url,
                'maar %d inkomende link%s, streef naar %d'
                % (n_in, '' if n_in == 1 else 's', MIN_INKOMEND),
            ))

        n_uit = len(({l.rstrip('/') or '/' for l in p['links']} & set(P)) - {url})
        if n_uit < MIN_UITGAAND:
            bevindingen.append((
                'laag', url,
                'maar %d uitgaande interne link%s, streef naar %d'
                % (n_uit, '' if n_uit == 1 else 's', MIN_UITGAAND),
            ))

    # 5. Merktaal.
    for url, p in sorted(P.items()):
        naam = os.path.basename(p['bestand'])[:-5]
        if naam in GEEN_TAALEIS:
            continue
        plat = norm(p['hoofd'])
        for woord, toegestaan in VERBODEN_WOORDEN.items():
            if url in toegestaan:
                continue
            if url.startswith('/blog/') and woord.startswith('implementa'):
                continue
            if url.startswith('/blog/') and woord == 'implementeren':
                continue
            if woord in plat:
                bevindingen.append(('midden', url, 'merktaal: het woord "%s" hoort niet in onze teksten' % woord))
        zichtbaar = re.sub(
            r'<script[\s\S]*?</script>|<style[\s\S]*?</style>|<!--[\s\S]*?-->',
            ' ',
            p['hoofd'],
        )
        if '!' in re.sub(r'<[^>]+>', ' ', zichtbaar):
            bevindingen.append(('laag', url, 'uitroepteken in de tekst'))

    # 6. Sitemapdekking. Canonical shell heeft een aparte fail-closed gate.
    if os.path.exists('sitemap.xml'):
        sm = io.open('sitemap.xml', encoding='utf-8').read()
        in_sitemap = set()
        for loc in re.findall(r'<loc>([^<]+)</loc>', sm):
            pad = re.sub(r'^https?://[^/]+', '', loc).rstrip('/') or '/'
            in_sitemap.add(pad)
        for url, p in sorted(P.items()):
            naam = os.path.basename(p['bestand'])[:-5]
            if naam in ('404', 'index-oud', 'klantportaal', 'klantportaal-demo', 'bedankt'):
                continue
            if 'noindex' in p['ruw']:
                continue
            if url.rstrip('/') and url.rstrip('/') not in in_sitemap:
                bevindingen.append(('hoog', url, 'staat niet in sitemap.xml'))
            elif url == '/' and '/' not in in_sitemap:
                bevindingen.append(('hoog', url, 'staat niet in sitemap.xml'))

    orde = {'hoog': 0, 'midden': 1, 'laag': 2}
    bevindingen.sort(key=lambda b: (orde[b[0]], b[1]))
    tel = {k: sum(1 for b in bevindingen if b[0] == k) for k in orde}

    regels = [
        '# SEO-controle',
        '',
        "%d pagina's gecontroleerd tegen de zoekwoord- en clusterstrategie." % len(P),
        '',
    ]
    if bevindingen:
        regels.append('**%d hoog · %d midden · %d laag**' % (tel['hoog'], tel['midden'], tel['laag']))
        regels.append('')
        for ernst in ('hoog', 'midden', 'laag'):
            groep = [b for b in bevindingen if b[0] == ernst]
            if not groep:
                continue
            kop = {
                'hoog': 'Hoog — dit kost je posities',
                'midden': 'Midden — structuur en linkbuilding',
                'laag': 'Laag — netjes maken',
            }[ernst]
            regels.append('## %s' % kop)
            for _, pag, tekst in groep:
                regels.append('- `%s` — %s' % (pag, tekst))
            regels.append('')
    else:
        regels.append(
            "Geen bevindingen. Elk zoekwoord heeft precies één pagina, elke cluster "
            "linkt heen en terug, en alle pagina's hebben een kloppende titel, "
            "meta-omschrijving, h1 en canonical."
        )

    io.open('seo-rapport.md', 'w', encoding='utf-8').write('\n'.join(regels) + '\n')

    status = {
        'bijgewerkt': __import__('datetime').date.today().isoformat(),
        'zoekwoorden': [],
    }
    for zw, eigenaar in sorted(EIGENAAR.items()):
        sleutel = eigenaar.rstrip('/') or '/'
        p = P.get(sleutel)
        status['zoekwoorden'].append({
            'zoekwoord': zw,
            'pagina': eigenaar,
            'bestaat': bool(p),
            'claimt': bool(p and claimt(zw, p)),
            'type': 'pijler' if eigenaar in CLUSTERS else 'cluster',
        })
    status['pijlers'] = sorted(CLUSTERS.keys())
    io.open('seo-status.json', 'w', encoding='utf-8').write(
        json.dumps(status, ensure_ascii=False, indent=1) + '\n'
    )
    print('\n'.join(regels))
    sys.exit(1 if tel['hoog'] else 0)


if __name__ == '__main__':
    main()
