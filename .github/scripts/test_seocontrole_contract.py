# -*- coding: utf-8 -*-
"""Regressiecontracten voor de Pagina/SEO-diagnose.

Deze tests beschermen twee bewezen oorzaken van de 2026-09-17 false-positive
baseline: expliciete zoekwoord-ownership moet leidend zijn en uitgefaseerde
prototypepagina's horen niet als publieke SEO-pagina te worden beoordeeld.
"""
import importlib.util
from pathlib import Path

SCRIPT = Path(__file__).with_name('seocontrole.py')
spec = importlib.util.spec_from_file_location('seocontrole', SCRIPT)
seo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(seo)


def test_explicit_bg_keyword_is_authoritative():
    pagina = {
        'zoekwoord': 'ai governance mkb',
        'titel': 'Heldere afspraken voor AI | Bedrijfsgeheugen',
        'h1': ['Zo houd je grip op AI'],
    }
    assert seo.claimt('ai governance mkb', pagina), (
        'Een exact passende bg-zoekwoord-meta is de expliciete ownership-claim; '
        'titel/h1 blijven presentatiecopy en mogen die claim niet ontkennen.'
    )


def test_retired_prototype_is_not_public_seo_surface():
    assert 'prototype-v18-stable' in seo.OVERSLAAN, (
        'prototype-v18-stable is door de canonical production builder uitgesloten '
        'en mag daarom niet als publieke SEO-pagina orphan/sitemap-fouten produceren.'
    )


if __name__ == '__main__':
    test_explicit_bg_keyword_is_authoritative()
    test_retired_prototype_is_not_public_seo_surface()
    print('SEO diagnostic contract tests: PASS')
