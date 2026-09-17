# -*- coding: utf-8 -*-
"""Regressiecontracten voor de registry-driven Pagina/SEO-diagnose."""
import importlib.util
from pathlib import Path

SCRIPT = Path(__file__).with_name('seocontrole_registry_v2.py')
spec = importlib.util.spec_from_file_location('seocontrole_registry_v2', SCRIPT)
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


def test_supporting_page_may_project_owner_keyword_when_owner_matches():
    primary_owner = {'systemen koppelen mkb': '/systemen-koppelen'}
    page = {
        'keyword': 'systemen koppelen mkb',
        'intent_role': 'supporting',
        'intent_owner': '/systemen-koppelen',
    }
    assert seo.keyword_owner_finding('/blog/wat-kost-een-afas-koppeling', page, primary_owner) is None


def test_supporting_page_fails_closed_when_owner_does_not_match():
    primary_owner = {'systemen koppelen mkb': '/systemen-koppelen'}
    page = {
        'keyword': 'systemen koppelen mkb',
        'intent_role': 'supporting',
        'intent_owner': '/afas-koppeling',
    }
    finding = seo.keyword_owner_finding('/blog/wat-kost-een-afas-koppeling', page, primary_owner)
    assert finding is not None
    assert '/systemen-koppelen' in finding


def test_non_supporting_duplicate_keyword_remains_blocking():
    primary_owner = {'systemen koppelen mkb': '/systemen-koppelen'}
    page = {
        'keyword': 'systemen koppelen mkb',
        'intent_role': '',
        'intent_owner': '',
    }
    assert seo.keyword_owner_finding('/andere-pagina', page, primary_owner) is not None


def test_retired_prototype_is_not_public_seo_surface():
    assert 'prototype-v18-stable' in seo.OVERSLAAN


def test_blog_index_is_in_candidate_set_when_present():
    assert 'blog/index.html' in seo.candidate_files()


if __name__ == '__main__':
    test_self_canonical_contract()
    test_registry_owner_is_only_blocking_orphan_type()
    test_supporting_page_may_project_owner_keyword_when_owner_matches()
    test_supporting_page_fails_closed_when_owner_does_not_match()
    test_non_supporting_duplicate_keyword_remains_blocking()
    test_retired_prototype_is_not_public_seo_surface()
    test_blog_index_is_in_candidate_set_when_present()
    print('SEO diagnostic contract tests: PASS')
