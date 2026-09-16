import os
from pathlib import Path
import pytest

SPEC = os.getenv('QUALITY_OPENAPI_SPEC', '').strip()


def test_openapi_contract_target_is_explicit():
    if not SPEC:
        pytest.skip('NOT_REGISTERED: no QUALITY_OPENAPI_SPEC; capability remains an explicit obligation, not green production proof')
    assert Path(SPEC).exists(), f'registered OpenAPI spec does not exist: {SPEC}'


def test_schemathesis_registered_spec():
    if not SPEC:
        pytest.skip('NOT_REGISTERED: Schemathesis requires a registered OpenAPI target')
    import schemathesis
    schema = schemathesis.openapi.from_path(SPEC)
    assert schema is not None
