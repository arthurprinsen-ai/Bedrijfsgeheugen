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
    # koppelingen: /afas-koppeling is de pijler, de pakketpagina's linken heen en terug
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
        '/blog/automatiseren-zonder-traject/', '/frisse-blik'],
    '/blog/wat-is-een-bedrijfsgeheugen/': [
        '/blog/bedrijfsopvolging-begin-bij-het-geheugen/', '/product', '/zelfscan',
        '/blog/werkinstructie-voorbeeld/'],
    '/blog/bedrijfsopvolging-begin-bij-het-geheugen/': [
        '/due-diligence', '/investeerders-ma', '/blog/wat-is-een-bedrijfsgeheugen/'],
    '/ai-adoptie': [
        '/ai-act', '/ai-governance', '/data-soevereiniteit', '/business-case-ai',
        '/ai-voor-bestuurders', '/ai-implementeren', '/ai-poc', '/workshops', '/ai-scan', '/benchmark',
        '/afmaakindex', '/ai-capability-model'],
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
    # 140 per maand, concurrentie 9 — laagste weerstand in de hele lijst.
    'afas pocket app koppelen': '/afas-pocket-koppelen',
    'erp implementatie mislukt': '/blog/automatiseren-zonder-traject/',
    'ai marketing mkb': '/ai-marketing-mkb',
    'kennisborging mkb': '/product',
    'werkinstructie voorbeeld': '/blog/werkinstructie-voorbeeld/',
    # cluster AI in het mkb, toegevoegd 14 augustus
    'ai adoptie mkb': '/ai-adoptie',
    'ai act compliance mkb': '/ai-act',
    'ai workshop mkb': '/workshops',
    'ai governance mkb': '/ai-governance',
    # toegevoegd 20 augustus: eigen model, nog door geen pagina geclaimd
    'ai capability model': '/ai-capability-model',
    # 260 zoekopdrachten per maand, concurrentie 41, CPC 17,73 euro.
    # Eigen thema dat vrijwel niemand commercieel claimt.
    'data soevereiniteit': '/data-soevereiniteit',
    'chatgpt bedrijfsgegevens beleid': '/data-soevereiniteit',
    'business case ai mkb': '/business-case-ai',
    'ai strategie directie': '/ai-voor-bestuurders',
    'ai implementeren mkb': '/ai-implementeren',
    'ai pilot opzetten mkb': '/ai-poc',
    # pakketkoppelingen, gemeten met DataForSEO op 16 augustus
    # hoofdzoekwoord, gekozen op 18 augustus: 480 zoekopdrachten per maand,
    # concurrentie 41, CPC 18,79 euro. Hoogste waarde in de hele kansenlijst.
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

OVERSLAAN = {'index-oud', 'klantportaal', 'klantformulier', 'klantportaal-demo'}
# Previewroutes zijn geen indexeerbare productiepagina's. Alleen op een
# prototypebranch slaan we de tijdelijke indexredirect en prototypes over.
PREVIEW_BRANCH = os.getenv('BG_PREVIEW_BRANCH') == 'true'
if PREVIEW_BRANCH:
    OVERSLAAN.update(
        os.path.basename(f)[:-5] for f in glob.glob('prototype-*.html')
    )
GEEN_KRUIMEL = {'index', '404'}
GEEN_CANONICAL = {'404'}
GEEN_H2 = {'404'}
GEEN_SCHEMA = {'404', 'bedankt', 'zelfscan'}
# -- merktaal --
# Woorden uit de bouwsteen "Hoe Arthur overkomt" die niet klinken als iemand die
# het aan tafel zegt. Per woord staat erbij op welke pagina's het wel mag, omdat
# het daar het zoekwoord of een officiele term is.
VERBODEN_WOORDEN = {
    'implementeren': {'/ai-implementeren', '/expertises', '/ai-adoptie', '/ai-poc'},
    'implementatie': {'/ai-implementeren', '/frisse-blik'},
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

# -- kop en voettekst --
# Elke pagina heeft exact dezelfde balk en voettekst. De referentie staat in
# .github/canoniek/. Wijkt een pagina af, dan is dat altijd een fout: zo zijn
# er eerder zeven verschillende voetteksten ontstaan, waarvan een met het
# verkeerde e-mailadres erin.
CANONIEK_KOP = '.github/canoniek/kop.html'
CANONIEK_VOET = '.github/canoniek/voet.html'
GEEN_BALK = {'klantportaal', 'klantportaal-demo', 'index-oud'}

MIN_INKOMEND = 3          # minimaal aantal pagina's dat hierheen linkt
MIN_UITGAAND = 2          # minimaal aantal interne links vanaf deze pagina
GEEN_LINKEIS = {'index', '404', 'bedankt', 'privacy', 'contact'}
SLECHTE_ANKERS = {'lees meer', 'klik hier', 'meer info', 'hier', 'lees verder', 'meer'}


def norm(t):
    t = html.unescape(re.sub(r'<[^>]+>', ' ', t or '')).lower()
    t = ''.join(c for c in unicodedata.normalize('NFD', t) if unicodedata.category(c) != 'Mn')
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]', ' ', t)).strip()


MERK = 'bedrijfsgeheugen'


def zonder_merk(titel):
    """Haalt het merkdeel uit de titel weg.

    De merknaam staat achter elke titel ('... | Bedrijfsgeheugen'). Zonder deze
    stap ziet de controle elk zoekwoord dat de merknaam bevat als door iedere
    pagina geclaimd, en meldt hij kannibalisatie waar alleen branding staat.
    """
    t = titel
    for scheiding in (' | ', ' — ', ' - ', ' · '):
        deel = t.split(scheiding)
        if len(deel) > 1 and MERK in norm(deel[-1]) and len(norm(deel[-1]).split()) <= 3:
            t = scheiding.join(deel[:-1])
    return t


def claimt(zoekwoord, pagina):
    """Claimt deze pagina het zoekwoord?

    Een expliciete bg-zoekwoord-meta is leidend. Zo kan een artikel woorden uit
    een commercieel zoekwoord in titel of h1 gebruiken zonder dat het automatisch
    dat zoekwoord claimt. Zonder expliciete meta blijft de titel/h1-heuristiek.
    """
    woorden = [w for w in zoekwoord.split() if w not in ('van', 'de', 'het', 'een', 'in', 'je')]
    expliciet = norm(pagina.get('zoekwoord', ''))
    if expliciet:
        expliciet_woorden = expliciet.split()
        if not all(any(d.startswith(w[:max(4, len(w) - 2)]) for d in expliciet_woorden) for w in woorden):
            return False
    doel = norm(zonder_merk(pagina['titel'])) + ' ' + norm(' '.join(pagina['h1']))
    return all(any(d.startswith(w[:max(4, len(w) - 2)]) for d in doel.split()) for w in woorden)


def lees_paginas():
    paginas = {}
    for f in sorted(glob.glob('*.html') + glob.glob('blog/*/index.html')):
        # Alleen de tijdelijke rootredirect overslaan; blog/*/index.html blijft
        # onderdeel van de controle.
        if PREVIEW_BRANCH and f == 'index.html':
            continue
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
            'zoekwoord': html.unescape((re.search(r'<meta name="bg-zoekwoord" content="(.*?)"', s, re.S) or [None, ''])[1]),
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


    # ── 4. interne linkkracht: weespagina's en te weinig uitgaande links ──
    # Een pagina zonder inkomende links is voor Google een pagina die niemand
    # belangrijk vindt, hoe goed hij ook geschreven is. Dit is de stap die bij
    # het toevoegen van een pagina het vaakst vergeten wordt.
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
            bevindingen.append(('hoog', url,
                'weespagina — geen enkele andere pagina linkt hierheen'))
        elif n_in < MIN_INKOMEND:
            bevindingen.append(('midden', url,
                'maar %d inkomende link%s, streef naar %d'
                % (n_in, '' if n_in == 1 else 's', MIN_INKOMEND)))

        n_uit = len({l.rstrip('/') or '/' for l in p['links']} & set(P) - {url})
        if n_uit < MIN_UITGAAND:
            bevindingen.append(('laag', url,
                'maar %d uitgaande interne link%s, streef naar %d'
                % (n_uit, '' if n_uit == 1 else 's', MIN_UITGAAND)))


    # ── rapport ───────────────────────────────────────────────────────────
    orde = {'hoog': 0, 'midden': 1, 'laag': 2}

    # -- 5. merktaal: consultancywoorden en uitroeptekens --
    # De enige controle op hoe het klinkt in plaats van hoe het is opgebouwd.
    # Zonder deze stap sluipt de brochuretaal er vanzelf weer in, want die
    # woorden voelen bij het schrijven altijd even goed.
    for url, p in sorted(P.items()):
        naam = os.path.basename(p['bestand'])[:-5]
        if naam in GEEN_TAALEIS:
            continue
        plat = norm(p['hoofd'])
        # Blogs beschrijven de taal van de markt; daar is 'implementatie' vaak
        # juist het zoekwoord (ERP implementatie mislukt, implementatiepartner).
        # De eis geldt onverkort op onze eigen dienstenpagina's.
        for woord, toegestaan in VERBODEN_WOORDEN.items():
            if url in toegestaan:
                continue
            if url.startswith('/blog/') and woord.startswith('implementa'):
                continue
            if url.startswith('/blog/') and woord == 'implementeren':
                continue
            if woord in plat:
                bevindingen.append(('midden', url,
                    'merktaal: het woord "%s" hoort niet in onze teksten' % woord))
        zichtbaar = re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>|<!--[\s\S]*?-->', ' ', p['hoofd'])
        if '!' in re.sub(r'<[^>]+>', ' ', zichtbaar):
            bevindingen.append(('laag', url, 'uitroepteken in de tekst'))


    # -- 6. kop en voettekst identiek op elke pagina --
    def schoon(x):
        # aria-current markeert de actieve pagina en mag per pagina verschillen
        x = re.sub(r'\s+aria-current="page"', '', x or '')
        return re.sub(r'\s+', ' ', x).strip()

    ref_kop = ref_voet = None
    if os.path.exists(CANONIEK_KOP):
        ref_kop = schoon(io.open(CANONIEK_KOP, encoding='utf-8').read())
    if os.path.exists(CANONIEK_VOET):
        ref_voet = schoon(io.open(CANONIEK_VOET, encoding='utf-8').read())

    for url, p in sorted(P.items()):
        naam = os.path.basename(p['bestand'])[:-5]
        if naam in GEEN_BALK:
            continue
        s = p['ruw']
        m = re.search(r'<nav class="bgkop"[\s\S]*?</nav>', s)
        if ref_kop and (not m or schoon(m.group(0)) != ref_kop):
            bevindingen.append(('hoog', url,
                'de menubalk wijkt af van .github/canoniek/kop.html'))
        vs = re.findall(r'<footer[\s\S]*?</footer>', s)
        if ref_voet:
            if len(vs) != 1:
                bevindingen.append(('hoog', url,
                    'er staan %d voetteksten op deze pagina, er hoort er precies een' % len(vs)))
            elif schoon(vs[0]) != ref_voet:
                bevindingen.append(('hoog', url,
                    'de voettekst wijkt af van .github/canoniek/voet.html'))


    # -- 7. staat elke pagina in de sitemap --
    # De sitemap wordt bij elke build gegenereerd (tools/bouw-sitemap.mjs).
    # Deze controle is het vangnet: liep hij ooit achter, dan wisten zoek-
    # machines niet dat nieuwe pagina's bestonden. Dat gebeurde met zeven
    # pagina's tegelijk.
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
