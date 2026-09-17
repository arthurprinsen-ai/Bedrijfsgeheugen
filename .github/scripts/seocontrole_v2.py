# -*- coding: utf-8 -*-
"""Registry-driven SEO diagnostic for the production-built site.

Authority:
- site/seo-order-map.json + site/seo-order-expansion.json own keyword intent;
- bg-keyword-cluster is the production projection of that registry;
- only indexable, self-canonical URLs are independent SEO surfaces.

High severity is reserved for defects that can damage an owned/indexable SEO
surface. Non-owned support-page hygiene remains reported but does not block a
release merely because a utility page has weak internal-link counts.
"""
from __future__ import annotations

import glob
import html
import io
import json
import os
import re
import sys
import unicodedata
from urllib.parse import urlparse

ORIGIN = 'https://www.bedrijfsgeheugen.nl'
OVERSLAAN = {
    'index-oud', 'klantportaal', 'klantformulier', 'klantportaal-demo',
    'klant-login', 'prototype-v18-stable',
}
SLECHTE_ANKERS = {'lees meer', 'klik hier', 'meer info', 'hier', 'lees verder', 'meer'}
VERBODEN_WOORDEN = {
    'implementeren', 'implementatie', 'optimaliseren', 'optimalisatie',
    'strategisch', 'strategische', 'waardevol', 'ontzorgen', 'naadloos',
    'toekomstbestendig', 'op het snijvlak', 'oplossingen op maat',
}
MIN_INKOMEND = 3
MIN_UITGAAND = 2


def norm(value: str) -> str:
    value = html.unescape(re.sub(r'<[^>]+>', ' ', value or '')).lower()
    value = ''.join(c for c in unicodedata.normalize('NFD', value)
                    if unicodedata.category(c) != 'Mn')
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]', ' ', value)).strip()


def route_of_absolute(value: str) -> str:
    if not value:
        return ''
    parsed = urlparse(value)
    if parsed.netloc and parsed.netloc != 'www.bedrijfsgeheugen.nl':
        return ''
    path = parsed.path or '/'
    return path.rstrip('/') or '/'


def load_registry() -> dict[str, dict]:
    pages = []
    for path in ('site/seo-order-map.json', 'site/seo-order-expansion.json'):
        if not os.path.exists(path):
            continue
        data = json.load(io.open(path, encoding='utf-8'))
        pages.extend(data.get('pages', []))
    out = {}
    for entry in pages:
        route = route_of_absolute(entry.get('route', ''))
        if route:
            out[route] = entry
    return out


def _meta(s: str, name: str) -> str:
    m = re.search(r'<meta\b[^>]*name=["\']%s["\'][^>]*content=["\']([^"\']*)["\'][^>]*>' % re.escape(name), s, re.I)
    if not m:
        m = re.search(r'<meta\b[^>]*content=["\']([^"\']*)["\'][^>]*name=["\']%s["\'][^>]*>' % re.escape(name), s, re.I)
    return html.unescape(m.group(1)) if m else ''


def _canonical(s: str) -> str:
    m = re.search(r'<link\b[^>]*rel=["\'][^"\']*canonical[^"\']*["\'][^>]*href=["\']([^"\']+)["\']', s, re.I)
    if not m:
        m = re.search(r'<link\b[^>]*href=["\']([^"\']+)["\'][^>]*rel=["\'][^"\']*canonical[^"\']*["\']', s, re.I)
    return html.unescape(m.group(1)) if m else ''


def is_noindex(s: str) -> bool:
    robots = _meta(s, 'robots').lower()
    return 'noindex' in {x.strip() for x in re.split(r'[,\s]+', robots) if x.strip()}


def is_self_canonical(url: str, canonical: str) -> bool:
    return not canonical or route_of_absolute(canonical) == (url.rstrip('/') or '/')


def lees_paginas() -> dict[str, dict]:
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
        url = url.rstrip('/') or '/'
        canonical = _canonical(s)
        if is_noindex(s) or not is_self_canonical(url, canonical):
            continue
        hoofd_match = re.search(r'<main\b[^>]*>([\s\S]*?)</main>', s, re.I)
        hoofd = hoofd_match.group(1) if hoofd_match else s
        paginas[url] = {
            'bestand': f,
            'ruw': s,
            'hoofd': hoofd,
            'titel': html.unescape((re.search(r'<title>(.*?)</title>', s, re.S | re.I) or [None, ''])[1]),
            'meta': _meta(s, 'description'),
            'keyword': _meta(s, 'bg-keyword-cluster'),
            'h1': re.findall(r'<h1[^>]*>(.*?)</h1>', s, re.S | re.I),
            'h2': re.findall(r'<h2[^>]*>(.*?)</h2>', s, re.S | re.I),
            'canon': canonical,
            'og': bool(re.search(r'property=["\']og:title["\']', s, re.I)),
            'links': set(
                (x.split('#')[0].split('?')[0].rstrip('/') or '/')
                for x in re.findall(r'href=["\'](?:https://www\.bedrijfsgeheugen\.nl)?(/[^"\']*)["\']', hoofd, re.I)
            ),
            'ankers': re.findall(r'<a [^>]*href=["\'](?:https://www\.bedrijfsgeheugen\.nl)?/[^"\']*["\'][^>]*>(.*?)</a>', hoofd, re.S | re.I),
        }
    return paginas


def orphan_severity(route: str, registry: dict[str, dict]) -> str:
    entry = registry.get(route)
    return 'hoog' if entry and entry.get('role') in {'pillar', 'money'} else 'midden'


def main() -> int:
    registry = load_registry()
    pages = lees_paginas()
    bevindingen = []

    # 1. Canonical keyword ownership from the registry.
    primary_owner = {}
    for route, entry in registry.items():
        kw = norm(entry.get('primary_keyword', ''))
        if kw:
            primary_owner[kw] = route
        page = pages.get(route)
        if not page:
            bevindingen.append(('hoog', route, 'registry-owned SEO-pagina ontbreekt, is noindex of is niet self-canonical'))
            continue
        projected = norm(page.get('keyword', ''))
        if not projected:
            bevindingen.append(('hoog', route, 'bg-keyword-cluster ontbreekt na production-build'))
        elif projected != kw:
            bevindingen.append(('hoog', route, 'bg-keyword-cluster "%s" wijkt af van registry "%s"' % (page['keyword'], entry.get('primary_keyword', ''))))

    for route, page in pages.items():
        projected = norm(page.get('keyword', ''))
        owner = primary_owner.get(projected)
        if owner and owner != route:
            bevindingen.append(('hoog', route, 'keyword-cluster "%s" is owned door %s' % (page['keyword'], owner)))

    # 2. Registry-declared supporting links (structure remains diagnostic).
    for route, entry in registry.items():
        page = pages.get(route)
        if not page:
            continue
        for target in entry.get('supporting_routes', []):
            target_route = route_of_absolute(target)
            if target_route and target_route in pages and target_route not in page['links']:
                bevindingen.append(('midden', route, 'mist registry-supportlink naar %s' % target_route))

    # 3. Technical SEO.
    for route, page in sorted(pages.items()):
        title_len, meta_len = len(page['titel']), len(page['meta'])
        if not page['titel']:
            bevindingen.append(('hoog', route, 'geen titel'))
        elif title_len > 65:
            bevindingen.append(('midden', route, 'titel is %d tekens, Google kapt rond 65' % title_len))
        elif title_len < 25:
            bevindingen.append(('laag', route, 'titel is maar %d tekens' % title_len))
        if not page['meta']:
            bevindingen.append(('hoog', route, 'geen meta-omschrijving'))
        elif not 110 <= meta_len <= 165:
            bevindingen.append(('laag', route, 'meta-omschrijving is %d tekens, streef naar 110 tot 165' % meta_len))
        if len(page['h1']) != 1:
            bevindingen.append(('hoog', route, '%d keer een h1, er hoort er precies één te zijn' % len(page['h1'])))
        if not page['canon']:
            bevindingen.append(('midden', route, 'geen canonical'))
        if not page['og']:
            bevindingen.append(('laag', route, 'geen og:title voor social sharing'))
        if not page['h2'] and route not in {'/404'}:
            bevindingen.append(('laag', route, 'geen h2-structuur'))
        for block in re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', page['ruw'], re.S | re.I):
            try:
                json.loads(block)
            except ValueError as exc:
                bevindingen.append(('hoog', route, 'ongeldige JSON-LD: %s' % exc))
        for anker in page['ankers']:
            if norm(anker) in SLECHTE_ANKERS:
                bevindingen.append(('midden', route, 'niet-beschrijvende interne ankertekst "%s"' % norm(anker)))
                break

    # 4. Internal-link strength. Commercial owners block; utility/support pages do not.
    incoming = {route: set() for route in pages}
    for source, page in pages.items():
        for target in page['links']:
            if target in incoming and target != source:
                incoming[target].add(source)
    for route, page in sorted(pages.items()):
        if route in {'/', '/404', '/bedankt', '/privacy', '/contact'}:
            continue
        n_in = len(incoming[route])
        if n_in == 0:
            bevindingen.append((orphan_severity(route, registry), route, 'weespagina — geen enkele andere canonical pagina linkt hierheen'))
        elif n_in < MIN_INKOMEND:
            bevindingen.append(('midden', route, 'maar %d inkomende links, streef naar %d' % (n_in, MIN_INKOMEND)))
        n_out = len((page['links'] & set(pages)) - {route})
        if n_out < MIN_UITGAAND:
            bevindingen.append(('laag', route, 'maar %d uitgaande interne links, streef naar %d' % (n_out, MIN_UITGAAND)))

    # 5. Brand-language hygiene remains visible, never converted into fake SEO ownership.
    for route, page in sorted(pages.items()):
        text = norm(page['hoofd'])
        for word in sorted(VERBODEN_WOORDEN):
            if word in text:
                bevindingen.append(('midden', route, 'merktaal: "%s" aangetroffen' % word))

    # 6. Sitemap coverage: only independent canonical pages; owned pages are blocking.
    sitemap = set()
    if os.path.exists('sitemap.xml'):
        sm = io.open('sitemap.xml', encoding='utf-8').read()
        for loc in re.findall(r'<loc>([^<]+)</loc>', sm):
            route = route_of_absolute(loc)
            if route:
                sitemap.add(route)
    for route in sorted(pages):
        if route not in sitemap:
            severity = 'hoog' if route in registry else 'midden'
            bevindingen.append((severity, route, 'staat niet in sitemap.xml'))

    order = {'hoog': 0, 'midden': 1, 'laag': 2}
    bevindingen = sorted(set(bevindingen), key=lambda item: (order[item[0]], item[1], item[2]))
    totals = {level: sum(1 for item in bevindingen if item[0] == level) for level in order}
    lines = [
        '# SEO-controle v2', '',
        '%d indexeerbare, self-canonical pagina\'s gecontroleerd; %d registry-owned SEO-surfaces.' % (len(pages), len(registry)),
        '',
        '**%d hoog · %d midden · %d laag**' % (totals['hoog'], totals['midden'], totals['laag']),
        '',
    ]
    labels = {'hoog': 'Hoog — release blocker', 'midden': 'Midden — verbeteren', 'laag': 'Laag — hygiene'}
    for level in ('hoog', 'midden', 'laag'):
        group = [item for item in bevindingen if item[0] == level]
        if not group:
            continue
        lines += ['## ' + labels[level]]
        lines += ['- `%s` — %s' % (route, text) for _, route, text in group]
        lines.append('')
    if not bevindingen:
        lines.append('Geen bevindingen.')
    io.open('seo-rapport.md', 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print('\n'.join(lines))
    return 1 if totals['hoog'] else 0


if __name__ == '__main__':
    sys.exit(main())
