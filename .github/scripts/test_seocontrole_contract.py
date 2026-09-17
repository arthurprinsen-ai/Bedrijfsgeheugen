# -*- coding: utf-8 -*-
"""Regressiecontracten voor de registry-driven Pagina/SEO-diagnose."""
import importlib.util
from pathlib import Path

SCRIPT = Path(__file__).with_name('seocontrole_v2.py')
spec = importlib.util.spec_from_file_location('seocontrole_v2', SCRIPT)
seo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(seo)


def test_self_canonical_contract():
    assert seo.is_self_canonical('/ai-governance', 'https://www.bedrijfsgeheugen.nl/ai-governance')
    assert not seo.is_self_canonical('/blog/afas-koppeling', 'https://www.bedrijfsgeheugen.nl/afas-koppeling')


def test_registry_owner_is_only_blocking_orphan_type():
    registry = {
        '/money': {'role': 'money'},
        '/pillar': {'role': 'pillar'},
        '/support': {'role': 'support'},
    }
    assert seo.orphan_severity('/money', registry) == 'hoog'
    assert seo.orphan_severity('/pillar', registry) == 'hoog'
    assert seo.orphan_severity('/support', registry) == 'midden'
    assert seo.orphan_severity('/utility', registry) == 'midden'


def test_retired_prototype_is_not_public_seo_surface():
    assert 'prototype-v18-stable' in seo.OVERSLAAN


if __name__ == '__main__':
    test_self_canonical_contract()
    test_registry_owner_is_only_blocking_orphan_type()
    test_retired_prototype_is_not_public_seo_surface()
    print('SEO diagnostic contract tests: PASS')
