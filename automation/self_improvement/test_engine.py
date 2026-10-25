import unittest
from engine import analyze

class EngineTests(unittest.TestCase):
    def test_empty(self):
        self.assertEqual(analyze([]), [])
    def test_deduplicated_and_ranked(self):
        row={"id":"1","source":"analytics","observed_at":"2026-10-25T00:00:00Z",
             "metric":"conversion.scan_completion","baseline":10,"candidate":12,
             "confidence":0.8,"evidence":"test snapshot"}
        result=analyze([row,row])
        self.assertEqual(len(result),1)
        self.assertTrue(result[0]["requires_review"])
    def test_no_secrets(self):
        with self.assertRaises(ValueError):
            analyze([{"token":"secret", "id":"1", "source":"x","observed_at":"now",
                     "metric":"conversion.x","baseline":0,"candidate":1,"confidence":1,"evidence":"x"}])
if __name__=="__main__":
    unittest.main()
