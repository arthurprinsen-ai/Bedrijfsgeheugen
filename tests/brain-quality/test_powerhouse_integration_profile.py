import os
import pytest

PROFILE = os.getenv('QUALITY_INTEGRATION_PROFILE', '').strip().lower()


def test_integration_profile_is_explicit():
    if not PROFILE:
        pytest.skip('NOT_REGISTERED: no QUALITY_INTEGRATION_PROFILE; real-service integration remains an explicit obligation')
    assert PROFILE in {'postgres'}, f'unsupported registered integration profile: {PROFILE}'


def test_registered_postgres_profile_uses_real_container():
    if PROFILE != 'postgres':
        pytest.skip('NOT_REGISTERED: postgres integration profile not selected')
    import psycopg
    from testcontainers.postgres import PostgresContainer

    with PostgresContainer('postgres:17-alpine') as postgres:
        dsn = postgres.get_connection_url().replace('postgresql+psycopg2://', 'postgresql://')
        with psycopg.connect(dsn) as connection:
            with connection.cursor() as cursor:
                cursor.execute('select 1')
                assert cursor.fetchone() == (1,)
