import json
from pathlib import Path
from hypothesis import given, strategies as st

CONTRACT = json.loads(Path('powerhouse/assurance/quality-intelligence.json').read_text())


def normalize_repo_path(value: str) -> str:
    return value.strip().replace('\\', '/').removeprefix('./')


def impacted(path: str):
    candidate = normalize_repo_path(path)
    suites = set()
    for rule in CONTRACT['impact_rules']:
        if candidate.startswith(rule['prefix']):
            suites.update(rule['suites'])
    return tuple(sorted(suites))


@given(st.text(alphabet=st.characters(blacklist_categories=('Cs',)), max_size=120))
def test_path_normalization_is_idempotent(value):
    assert normalize_repo_path(normalize_repo_path(value)) == normalize_repo_path(value)


@given(st.sampled_from(['portal-v2/app.js', 'netlify/functions/example.mjs', 'supabase/functions/x/index.ts', 'brain/core.mjs']))
def test_registered_backend_frontend_paths_always_map_deterministically(path):
    assert impacted(path) == impacted('./' + path)
    assert len(impacted(path)) > 0


def test_backend_contract_contains_all_failure_prevention_dimensions():
    required = {'property','api_contract','integration','performance','security','supply_chain','misconfiguration','resilience','data_integrity'}
    assert required.issubset(set(CONTRACT['dimensions']['backend']))
    assert CONTRACT['backend']['unregistered_target_status'] == 'not_registered_obligation_not_green'
