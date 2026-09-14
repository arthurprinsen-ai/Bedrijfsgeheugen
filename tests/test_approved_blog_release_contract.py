#!/usr/bin/env python3
import json
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import publish_approved_blog_v2 as v2


class ApprovedBlogReleaseContractTest(unittest.TestCase):
    def setUp(self):
        self.q = {
            'source': 'powerhouse:2026-09-14:blog',
            'slug': 'zoekverkeer-stijgt-omzet-niet',
            'title': 'Organisch zoekverkeer kwalificeren: van verkeer naar omzet',
            'keyword': 'organisch zoekverkeer kwalificeren',
            'meta': 'Organisch zoekverkeer kwalificeren begint bij probleemherkenning. Ontdek waarom meer verkeer niet vanzelf leidt tot meer serieuze aanvragen en omzet.',
            'blogtext': '''Organisch zoekverkeer kwalificeren begint bij de vraag of de juiste bezoeker zijn probleem herkent en een logische volgende stap ziet.

## Organisch zoekverkeer kwalificeren: van verkeer naar vraag

Hier staat uitleg over de kwalificatiestap en waarom herkenning nodig is.

## Waarom zichtbaarheid alleen niet genoeg is

Verkeer en commerciële relevantie zijn verschillende signalen.

## Drie plekken waar kwalificatie weglekt

Hier staat een concrete diagnose van taal, specificiteit en CTA.

## Wat je eerst moet meten

Hier staat hoe je gedrag en uitkomsten observeert.

## Veelgestelde vragen

FAQ: Wat betekent organisch zoekverkeer kwalificeren? || Je kijkt niet alleen naar verkeer, maar ook naar probleemherkenning en een passende vervolgstap.

FAQ: Betekent weinig aanvragen dat SEO niet werkt? || Nee. Verkeer, herkenning en conversie zijn verschillende stappen.''',
        }

    def test_valid_source_contract_passes(self):
        v2.release_contract(self.q)

    def test_bad_title_or_missing_keyword_fails_closed(self):
        bad = dict(self.q, title='Een veel te lange titel ' + ('x' * 70))
        with self.assertRaises(SystemExit):
            v2.release_contract(bad)

    def test_enrichment_adds_faq_schema_and_two_accessible_figures(self):
        html = '''<!doctype html><html lang="nl"><head><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"BlogPosting"},{"@type":"BreadcrumbList"}]}</script></head><body><main><article class="artikel"><h1>Organisch zoekverkeer kwalificeren: van verkeer naar omzet</h1><p>Organisch zoekverkeer kwalificeren helpt.</p><h2>Organisch zoekverkeer kwalificeren: van verkeer naar vraag</h2><p>A</p><h2>Waarom zichtbaarheid alleen niet genoeg is</h2><p>B</p><h2>Drie plekken waar kwalificatie weglekt</h2><p>C</p><h2>Wat je eerst moet meten</h2><p>D</p><h2>Veelgestelde vragen</h2><p>FAQ: Wat betekent organisch zoekverkeer kwalificeren? || Je kijkt naar herkenning.</p><p>FAQ: Betekent weinig aanvragen dat SEO niet werkt? || Nee.</p></article></main></body></html>'''
        out = v2.enhance_release_contract(html, self.q)
        self.assertGreaterEqual(out.count('<figure'), 2)
        self.assertGreaterEqual(out.count('role="img"'), 2)
        self.assertGreaterEqual(out.count('<figcaption'), 2)
        self.assertIn('<title>', out)
        blocks = __import__('re').findall(r'<script type="application/ld\+json">(.*?)</script>', out, __import__('re').S)
        types = set()
        for block in blocks:
            data = json.loads(block)
            nodes = data.get('@graph', []) if isinstance(data, dict) else []
            for node in nodes:
                if isinstance(node, dict):
                    t = node.get('@type')
                    if isinstance(t, list): types.update(t)
                    elif t: types.add(t)
        self.assertIn('FAQPage', types)


if __name__ == '__main__':
    unittest.main()
