# -*- coding: utf-8 -*-
"""Controleert de site tegen de SEO- en zoekwoordstrategie uit Notion.

Drie dingen, in volgorde van belang:

1. **De ijzeren regel** — één zoekwoord, één pagina. Twee pagina's op hetzelfde
   zoekwoord concurreren met elkaar en verliezen allebei.
2. **Clusterstructuur** — elke clusterpagina linkt naar zijn pijler en terug.
   Zonder onderlinge links is een cluster geen cluster maar een stapel.
3. **Technische SEO per pagina** — titel, meta, h1, canonical, og-tags,
   ankerteksten die iets zeggen.

De strategie zelf staat in Notion en wordt hier niet herhaald: alleen de regels
die je automatisch kunt controleren staan hieronder.
"""
import glob, html, io, json, os, re, sys, unicodedata

# ── de clusters, zoals vastgelegd in de zoekwoordenstrategie ───────────────
CLUSTERS = {
    '/blog/systemen-koppelen-mkb/': [
        '/blog/afas-exact-koppelen/', '/blog/afas-koppeling/',
        '/blog/wat-kost-een-afas-koppeling/', '/blog/wat-kost-een-afas-partner/',
        '/blog/planning-in-excel-vervangen/', '/blog/offertes-opvolgen-zonder-crm/',
        '/connect', '/systemen-koppelen'],
    '/blog/wat-kost-digitalisering-mkb/': [
        '/blog/wat-kost-een-afas-koppeling/', '/blog/wat-kost-een-afas-partner/',
        '/blog/automatiseren-zonder-traject/', '/frisse-blik'],
    '/blog/wat-is-een-bedrijfsgeheugen/': [
        '/blog/bedrijfsopvolging-begin-bij-het-geheugen/', '/product', '/zelfscan',
        '/blog/werkinstructie-voorbeeld/'],
    '/blog/bedrijfsopvolging-begin-bij-het-geheugen/': [
        '/due-diligence', '/investeerders-ma', '/blog/wat-is-een-bedrijfsgeheugen/'],
    '/ai-adoptie': [
        '/ai-act', '/ai-governance', '/data-soevereiniteit', '/business-case-ai',
        '/ai-voor-bestuurders', '/ai-implementeren', '/ai-poc', '/workshops', '/ai-scan', '/benchmark', '/afmaakindex'],
}

# ── zoekwoord → de pagina die het hoort te claimen ────────────────────────
EIGENAAR = {
    # zoekwoord uit de Notion-database → de pagina die het hoort te claimen.
    # Wijzig je een cluster of zoekwoord in Notion, werk dan deze lijst bij.
    'systemen koppelen mkb': '/blog/systemen-koppelen-mkb/',
    'wat kost digitalisering mkb': '/blog/wat-kost-digitalisering-mkb/',
    'bedrijfsopvolging familiebedrijf kennis': '/blog/bedrijfsopvolging-begin-bij-het-geheugen/',
    'eu ai act mkb': '/blog/eu-ai-act-mkb/',
    'afas koppeling kosten': '/blog/wat-kost-een-afas-koppeling/',
    'erp implementatie mislukt': '/blog/automatiseren-zonder-traject/',
    'ai marketing mkb': '/ai-marketing-mkb',
    'kennisborging mkb': '/product',
    'werkinstructie voorbeeld': '/blog/werkinstructie-voorbeeld/',
    # cluster AI in het mkb, toegevoegd 14 augustus
    'ai adoptie mkb': '/ai-adoptie',
    'ai act compliance mkb': '/ai-act',
    'ai workshop mkb': '/workshops',
    'ai governance mkb': '/ai-governance',
    'chatgpt bedrijfsgegevens beleid': '/data-soevereiniteit',
    'business case ai mkb': '/business-case-ai',
    'ai strategie directie': '/ai-voor-bestuurders',
    'ai implementeren mkb': '/ai-implementeren',
    'ai pilot opzetten mkb': '/ai-poc',
    'ai scan mkb': '/ai-scan',
    'benchmark mkb digitalisering': '/benchmark',
    'afmaakindex': '/afmaakindex',
}

OVERSLAAN = {'index-oud', 'klantportaal', 'klantformulier', 'klantportaal-demo'}
GEEN_KRUIMEL = {'index', '404'}
GEEN_CANONICAL = {'404'}
GEEN_H2 = {'404'}
GEEN_SCHEMA = {'404', 'bedankt', 'zelfscan'}
SLECHTE_ANKERS = {'lees meer', 'klik hier', 'meer info', 'hier', 'lees verder', 'meer'}


def norm(t):
    t = html.unescape(re.sub(r'<[^>]+>', ' ', t or '')).lower()
    t = ''.join(c for c in unicodedata.normalize('NFD', t) if unicodedata.category(c) != 'Mn')
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]', ' ', t)).strip()


def claimt(zoekwoord, pagina):
    """Claimt deze pagina het zoekwoord? Alle woorden moeten in titel of h1 staan.
    Op stam vergeleken, zodat 'kost' ook 'kosten' dekt."""
    doel = norm(pagina['titel']) + ' ' + norm(' '.join(pagina['h1']))
    woorden = [w for w in zoekwoord.split() if w not in ('van', 'de', 'het', 'een', 'in', 'je')]
    return all(any(d.startswith(w[:max(4, len(w) - 2)]) for d in doel.split()) for w in woorden)


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
        # zonder <main> valt de controle terug op de hele pagina, anders zouden
        # alle links onzichtbaar zijn en zou elke pagina vals alarm geven
        if '<main' in s and '</main>' in s:
            hoofd = s[s.find('<main'):s.find('</main>')]
        else:
            hoofd = s
        paginas[url.rstrip('/') or '/'] = {
            'bestand': f, 'url': url, 'ruw': s, 'hoofd': hoofd,
            'titel': html.unescape((re.search(r'<title>(.*?)</title>', s, re.S) or [None, ''])[1]),
            'meta': html.unescape((re.search(r'<meta name="description" content="(.*?)"', s, re.S) or [None, ''])[1]),
            'h1': re.findall(r'<h1[^>]*>(.*?)</h1>', s, re.S),
            'h2': [norm(x) for x in re.findall(r'<h2[^>]*>(.*?)</h2>', s, re.S)],
            'canon': (re.search(r'<link rel="canonical" href="(.*?)"', s) or [None, ''])[1],
            'og': bool(re.search(r'property="og:title"', s)),
            'links': set(x.split('#')[0].split('?')[0].rstrip('/') or '/'
                         for x in re.findall(r'href="(/[^"]*)"', hoofd)),
            'ankers': re.findall(r'<a [^>]*href="/[^"]*"[^>]*>(.*?)</a>', hoofd, re.S),
        }
    return paginas


def main():
    P = lees_paginas()
    bevindingen = []          # (ernst, pagina, tekst)

    # ── 1. de ijzeren regel: één zoekwoord, één pagina ────────────────────
    for zw, eigenaar in EIGENAAR.items():
        sleutel = eigenaar.rstrip('/') or '/'
        claimers = [u for u, p in P.items() if claimt(zw, p)]
        if sleutel not in claimers:
            bevindingen.append(('hoog', eigenaar,
                'claimt het zoekwoord "%s" niet in titel of h1' % zw))
        anderen = [u for u in claimers if u != sleutel]
        if anderen:
            bevindingen.append(('hoog', eigenaar,
                'kannibalisatie op "%s" — ook geclaimd door: %s' % (zw, ', '.join(anderen))))

    # ── 2. clusterstructuur: heen en terug ────────────────────────────────
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

    # ── 3. technische SEO per pagina ──────────────────────────────────────
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

        # gestructureerde data: zonder JSON-LD weet Google wel waar de pagina over
        # gaat, maar niet wát het is — een dienst, een gereedschap, een cursus.
        blokken = re.findall(r'<script type="application/ld\+json">(.*?)</script>',
                             p['ruw'], re.S)
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
                bevindingen.append(('midden', url,
                    'ankertekst "%s" zegt niets over de bestemming' % a))
                break

    # ── rapport ───────────────────────────────────────────────────────────
    orde = {'hoog': 0, 'midden': 1, 'laag': 2}
    bevindingen.sort(key=lambda b: (orde[b[0]], b[1]))
    tel = {k: sum(1 for b in bevindingen if b[0] == k) for k in orde}

    regels = ['# SEO-controle', '',
              '%d pagina\'s gecontroleerd tegen de zoekwoord- en clusterstrategie.' % len(P), '']
    if bevindingen:
        regels.append('**%d hoog · %d midden · %d laag**' % (tel['hoog'], tel['midden'], tel['laag']))
        regels.append('')
        for ernst in ('hoog', 'midden', 'laag'):
            groep = [b for b in bevindingen if b[0] == ernst]
            if not groep:
                continue
            kop = {'hoog': 'Hoog — dit kost je posities',
                   'midden': 'Midden — structuur en linkbuilding',
                   'laag': 'Laag — netjes maken'}[ernst]
            regels.append('## %s' % kop)
            for _, pag, tekst in groep:
                regels.append('- `%s` — %s' % (pag, tekst))
            regels.append('')
    else:
        regels.append('Geen bevindingen. Elk zoekwoord heeft precies één pagina, elke cluster '
                      'linkt heen en terug, en alle pagina\'s hebben een kloppende titel, '
                      'meta-omschrijving, h1 en canonical.')

    io.open('seo-rapport.md', 'w', encoding='utf-8').write('\n'.join(regels) + '\n')

    # ── seo-status.json: de site publiceert zijn eigen SEO-stand ──────────
    # Make leest dit bestand om te bepalen of een zoekwoord al een pagina heeft.
    # Zonder dit zou een automatisering blind blogs bijmaken voor onderwerpen
    # die al een pagina hebben — precies de kannibalisatie waar de strategie
    # tegen waarschuwt.
    status = {'bijgewerkt': __import__('datetime').date.today().isoformat(),
              'zoekwoorden': []}
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
        json.dumps(status, ensure_ascii=False, indent=1) + '\n')
    print('\n'.join(regels))
    # alleen hoge bevindingen laten falen; midden en laag zijn een melding
    sys.exit(1 if tel['hoog'] else 0)


if __name__ == '__main__':
    main()
