from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "supabase" / "migrations"
ENGINE = ROOT / "supabase" / "functions" / "powerhouse-predictive-engine" / "index.ts"
CALIBRATOR = ROOT / "supabase" / "functions" / "powerhouse-forecast-calibrator" / "index.ts"

CANONICAL = [
    "20260914081052_predictive_intelligence_first_mover_v1.sql",
    "20260914081911_predictive_first_mover_contract_v1_hardening.sql",
    "20260914082435_predictive_first_mover_obligations_and_guard_v1.sql",
    "20260914082625_predictive_first_mover_daily_schedule_v1.sql",
]


def test_exact_production_migration_identities_are_source_controlled():
    for name in CANONICAL:
        assert (MIGRATIONS / name).is_file(), name


def test_obsolete_pr_1481_timestamp_alias_is_absent():
    assert not list(MIGRATIONS.glob("20260914152000*predictive*"))


def test_live_predictive_sources_are_fail_closed_and_not_publishers():
    engine = ENGINE.read_text()
    calibrator = CALIBRATOR.read_text()
    for source in (engine, calibrator):
        assert "x-powerhouse-token" in source
        assert "powerhouse_daily_scheduler_token" in source
        assert "UNAUTHORIZED" in source
        assert "buffer" not in source.lower()
    assert "brain_ai_governance_registry" in engine
    assert "evidence_keys" in engine
    assert "revenue_learning_obligations" in calibrator
    assert "uncertain" in calibrator
