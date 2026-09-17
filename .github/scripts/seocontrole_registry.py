# -*- coding: utf-8 -*-
"""Registry-driven SEO diagnostic for the production-built site.

Authority:
- site/seo-order-map.json + site/seo-order-expansion.json own keyword intent;
- bg-keyword-cluster is the production projection of that registry;
- only indexable, self-canonical URLs are independent SEO surfaces;
- supporting routes may project the keyword cluster of their exact registry owner.
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
OVERSLAAN = {'index-oud', 'klantportaal', 'klantformulier', 'klantportaal-demo', 'klant-login', 'prototype-v18-stable'}
SLECHTE_ANKERS = {'lees meer', 'klik hier', 'meer info', 'hier', 'lees verder', 'meer'}
VERBODEN_WOORDEN = {'implementeren','implementatie','optimaliseren','optimalisatie','strategisch','strategische','waardevol','ontzorgen','naadloos','toekomstbestendig','op het snijvlak','oplossingen op maat'}
MIN_INKOMEND = 3
MIN_UITGAAND = 2


def norm(value: str) -> str:
    value = html.unescape(re.sub(r'<[^>]+>', ' ', value or '')).lower()
    value = ''.join(c for c in unicodedata.normalize('NFD', value) if unicodedata.category(c) != 'Mn')
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]', ' ', value)).strip()


def route_of_absolute(value: str) -> str:
    if not value:
        return ''
    parsed = urlparse(value)
    if parsed.netloc and parsed.netloc != 'www.bedrijfsgeheugen.nl':
        return ''
    return (parsed.path or '/').rstrip('/') or '/'


def load_registry() -> dict[str, dict]:
    entries = []
    for path in ('site/seo-order-map.json', 'site/seo-order-expansion.json'):
        if os.path.exists(path):
            entries.extend(json.load(io.open(path, encoding='utf-8')).get('pages', []))
    return {route_of_absolute(e.get('route', '')): e for e in entries if route_of_absolute(e.get('route', ''))}


def supporting_owner_map(registry: dict[str, dict]) -> dict[str, str]:
    """Return exact supporting-route -> owner route relationships from registry."""
    owners = {}
    for owner_route, entry in registry.items():
        for value in entry.get('supporting_routes', []):
            route = route_of_absolute(value)
            if route and route != owner_route:
                owners.setdefault(route, owner_route)
    return owners


def _meta(source: str, name: str) -> str:
    patterns = [
        r'<meta\b[^>]*name=["\']%s["\'][^>]*content=["\']([^"\']*)["\'][^>]*>' % re.escape(name),
        r'<meta\b[^>]*content=["\']([^"\']*)["\'][^>]*name=["\']%s["\'][^>]*>' % re.escape(name),
    ]
    for pattern in patterns:
        match = re.search(pattern, source, re.I)
        if match:
            return html.unescape(match.group(1))
    return ''


def _canonical(source: str) -> str:
    patterns = [
        r'<link\b[^>]*rel=["\'][^"\']*canonical[^"\']*["\'][^>]*href=["\']([^"\']+)["\']',
        r'<link\b[^>]*href=["\']([^"\']+)["\'][^>]*rel=["\'][^"\']*canonical[^"\']*["\']',
    ]
    for pattern in patterns:
        match = re.search(pattern, source, re.I)
        if match:
            return html.unescape(match.group(1))
    return ''


def is_noindex(source: str) -> bool:
    robots = _meta(source, 'robots').lower()
    return 'noindex' in {x.strip() for x in re.split(r'[,\s]+', robots) if x.strip()}


def is_self_canonical(url: str, canonical: str) -> bool:
    return not canonical or route_of_absolute(canonical) == (url.rstrip('/') or '/')


def candidate_files() -> list[str]:
    files = glob.glob('*.html') + glob.glob('blog/*/index.html')
    if os.path.exists('blog/index.html'):
        files.append('blog/index.html')
    return sorted(set(files))


def lees_paginas() -> dict[str, dict]:
    pages = {}
    for path in candidate_files():
        name = os.path.basename(path)[:-5]
        if name in OVERSLAAN:
            continue
        source = io.open(path, encoding='utf-8').read()
        if path == 'index.html':
            url = '/'
        elif path.endswith('/index.html'):
            url = '/' + path[:-len('index.html')]
        else:
            url = '/' + path[:-5]
        url = url.rstrip('/') or '/'
        canonical = _canonical(source)
        if is_noindex(source) or not is_self_canonical(url, canonical):
            continue
        main = re.search(r'<main\b[^>]*>([\s\S]*?)</main>', source, re.I)
        body = main.group(1) if main else source
        pages[url] = {
            'bestand': path,
            'ruw': source,
            'hoofd': body,
            'titel': html.unescape((re.search(r'<title>(.*?)</title>', source, re.S | re.I) or [None, ''])[1]),
            'meta': _meta(source, 'description'),
            'keyword': _meta(source, 'bg-keyword-cluster'),
            'h1': re.findall(r'<h1[^>]*>(.*?)</h1>', source, re.S | re.I),
            'h2': re.findall(r'<h2[^>]*>(.*?)</h2>', source, re.S | re.I),
            'canon': canonical,
            'og': bool(re.search(r'property=["\']og:title["\']', source, re.I)),
            'links': set((x.split('#')[0].split('?')[0].rstrip('/') or '/') for x in re.findall(r'href=["\'](?:https://www\.bedrijfsgeheugen\.nl)?(/[^"\']*)["\']', body, re.I)),
            'ankers': re.findall(r'<a [^>]*href=["\'](?:https://www\.bedrijfsgeheugen\.nl)?/[^"\']*["\'][^>]*>(.*?)</a>', body, re.S | re.I),
        }
    return pages


def orphan_severity(route: str, registry: dict[str, dict]) -> str:
    entry = registry.get(route)
    return 'hoog' if entry and entry.get('role') in {'pillar', 'money'} else 'midden'


def keyword_owner_finding(route: str, page: dict, primary_owner: dict[str, str]):
    """Fail closed on duplicate primary keywords except an exact supporting-owner relation."""
    projected = norm(page.get('keyword', ''))
    owner = primary_owner.get(projected)
    if not owner or owner == route:
        return None
    if page.get('intent_role') == 'supporting' and page.get('intent_owner') == owner:
        return None
    return 'keyword-cluster "%s" is owned door %s' % (page.get('keyword', ''), owner)


def main() -> int:
    registry = load_registry()
    pages = lees_paginas()
    findings = []

    primary_owner = {}
    for route, entry in registry.items():
        keyword = norm(entry.get('primary_keyword', ''))
        if keyword:
            primary_owner[keyword] = route
        page = pages.get(route)
        if not page:
            findings.append(('hoog', route, 'registry-owned SEO-pagina ontbreekt, is noindex of is niet self-canonical'))
            continue
        projected = norm(page.get('keyword', ''))
        if not projected:
            findings.append(('hoog', route, 'bg-keyword-cluster ontbreekt na production-build'))
        elif projected != keyword:
            findings.append(('hoog', route, 'bg-keyword-cluster "%s" wijkt af van registry "%s"' % (page['keyword'], entry.get('primary_keyword', ''))))

    support_owners = supporting_owner_map(registry)
    for route, page in pages.items():
        owner = support_owners.get(route)
        if owner:
            page['intent_role'] = 'supporting'
            page['intent_owner'] = owner
        finding = keyword_owner_finding(route, page, primary_owner)
        if finding:
            findings.append(('hoog', route, finding))

    for route, entry in registry.items():
        page = pages.get(route)
        if not page:
            continue
        for target in entry.get('supporting_routes', []):
            target_route = route_of_absolute(target)
            if target_route and target_route in pages and target_route not in page['links']:
                findings.append(('midden', route, 'mist registry-supportlink naar %s' % target_route))

    for route, page in sorted(pages.items()):
        title_len, meta_len = len(page['titel']), len(page['meta'])
        if not page['titel']:
            findings.append(('hoog', route, 'geen titel'))
        elif title_len > 65:
            findings.append(('midden', route, 'titel is %d tekens, Google kapt rond 65' % title_len))
        elif title_len < 25:
            findings.append(('laag', route, 'titel is maar %d tekens' % title_len))
        if not page['meta']:
            findings.append(('hoog', route, 'geen meta-omschrijving'))
        elif not 110 <= meta_len <= 165:
            findings.append(('laag', route, 'meta-omschrijving is %d tekens, streef naar 110 tot 165' % meta_len))
        if len(page['h1']) != 1:
            findings.append(('hoog', route, '%d keer een h1, er hoort er precies één te zijn' % len(page['h1'])))
        if not page['canon']:
            findings.append(('midden', route, 'geen canonical'))
        if not page['og']:
            findings.append(('laag', route, 'geen og:title voor social sharing'))
        if not page['h2']:
            findings.append(('laag', route, 'geen h2-structuur'))
        for block in re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', page['ruw'], re.S | re.I):
            try:
                json.loads(block)
            except ValueError as exc:
                findings.append(('hoog', route, 'ongeldige JSON-LD: %s' % exc))
        for anchor in page['ankers']:
            if norm(anchor) in SLECHTE_ANKERS:
                findings.append(('midden', route, 'niet-beschrijvende interne ankertekst "%s"' % norm(anchor)))
                break

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
            findings.append((orphan_severity(route, registry), route, 'weespagina — geen enkele andere canonical pagina linkt hierheen'))
        elif n_in < MIN_INKOMEND:
            findings.append(('midden', route, 'maar %d inkomende links, streef naar %d' % (n_in, MIN_INKOMEND)))
        n_out = len((page['links'] & set(pages)) - {route})
        if n_out < MIN_UITGAAND:
            findings.append(('laag', route, 'maar %d uitgaande interne links, streef naar %d' % (n_out, MIN_UITGAAND)))

    for route, page in sorted(pages.items()):
        text = norm(page['hoofd'])
        for word in sorted(VERBODEN_WOORDEN):
            if word in text:
                findings.append(('midden', route, 'merktaal: "%s" aangetroffen' % word))

    sitemap = set()
    if os.path.exists('sitemap.xml'):
        source = io.open('sitemap.xml', encoding='utf-8').read()
        for loc in re.findall(r'<loc>([^<]+)</loc>', source):
            route = route_of_absolute(loc)
            if route:
                sitemap.add(route)
    for route in sorted(pages):
        if route not in sitemap:
            findings.append(('hoog' if route in registry else 'midden', route, 'staat niet in sitemap.xml'))

    order = {'hoog': 0, 'midden': 1, 'laag': 2}
    findings = sorted(set(findings), key=lambda item: (order[item[0]], item[1], item[2]))
    totals = {level: sum(1 for item in findings if item[0] == level) for level in order}
    lines = ['# SEO-controle registry', '', "%d indexeerbare, self-canonical pagina's gecontroleerd; %d registry-owned SEO-surfaces." % (len(pages), len(registry)), '', '**%d hoog · %d midden · %d laag**' % (totals['hoog'], totals['midden'], totals['laag']), '']
    labels = {'hoog': 'Hoog — release blocker', 'midden': 'Midden — verbeteren', 'laag': 'Laag — hygiene'}
    for level in ('hoog', 'midden', 'laag'):
        group = [item for item in findings if item[0] == level]
        if not group:
            continue
        lines.append('## ' + labels[level])
        lines.extend('- `%s` — %s' % (route, text) for _, route, text in group)
        lines.append('')
    if not findings:
        lines.append('Geen bevindingen.')
    io.open('seo-rapport.md', 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print('\n'.join(lines))
    return 1 if totals['hoog'] else 0


if __name__ == '__main__':
    sys.exit(main())
