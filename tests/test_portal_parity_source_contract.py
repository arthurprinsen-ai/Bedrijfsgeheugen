from __future__ import annotations

import importlib.util
import unittest
from contextlib import redirect_stderr
from io import StringIO
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / ".github" / "scripts" / "portal_parity.py"
spec = importlib.util.spec_from_file_location("portal_parity", SCRIPT)
portal_parity = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(portal_parity)


class SourceDerivedPortalParityTests(unittest.TestCase):
    def test_derives_editable_fields_inside_protected_panels(self):
        html = """
        <section id="p-profiel">
          <input id="mw" type="number">
          <input id="s-tech" type="range">
          <select id="brancheKeuze"><option>demo</option></select>
        </section>
        """
        fields = portal_parity.derive_legacy_editable_fields(html)
        self.assertEqual(fields["profiel"], {"mw", "s-tech", "brancheKeuze"})

    def test_accepts_exact_and_explicit_wildcard_field_contracts(self):
        html = """
        <section id="p-profiel">
          <input id="mw" type="number">
          <input id="s-tech" type="range">
        </section>
        """
        inventory = """
        profiel: capability('profiel', [
          ...ids('mw'),
          frozen({legacyFieldId:'s-*', type:'range-1-5'})
        ], [], [], [], []),
        """
        count = portal_parity.check_source_derived_field_parity(html, inventory)
        self.assertEqual(count, 2)

    def test_fails_closed_when_legacy_field_has_no_v2_contract(self):
        html = """
        <section id="p-profiel">
          <input id="mw" type="number">
          <input id="forgottenLegacyField" type="text">
        </section>
        """
        inventory = """
        profiel: capability('profiel', ids('mw'), [], [], [], []),
        """
        stderr = StringIO()
        with redirect_stderr(stderr), self.assertRaises(SystemExit):
            portal_parity.check_source_derived_field_parity(html, inventory)
        self.assertIn("profiel.forgottenLegacyField", stderr.getvalue())


if __name__ == "__main__":
    unittest.main()
