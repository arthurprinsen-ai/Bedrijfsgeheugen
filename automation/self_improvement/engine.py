#!/usr/bin/env python3
"""Evidence-first improvement analysis, without unsafe self-modifying deployment."""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path

WEIGHTS = {"revenue": 5, "conversion": 4, "reliability": 4, "security": 5, "cost": 2, "latency": 2, "quality": 3}
REQUIRED = {"id", "source", "observed_at", "metric", "baseline", "candidate", "confidence", "evidence"}
SENSITIVE = {"email", "phone", "name", "ip", "address", "token", "secret", "password"}

def analyze(data):
    assert isinstance(data, list), "expected a list of anonymized opportunities"
    seen, output = set(), []
    for item in data:
        missing = REQUIRED - set(item)
        if missing:
            raise ValueError("missing fields: " + ",".join(sorted(missing)))
        if any(k.lower() in SENSITIVE for k in item):
            raise ValueError("personal data or secret fields must be removed at source")
        if not (0 <= float(item["confidence"]) <= 1):
            raise ValueError("confidence must be within [0,1]")
        if not item["evidence"] or not item["source"]:
            raise ValueError("source and evidence are required")
        identity = hashlib.sha256(json.dumps([item["source"],item["metric"],item["candidate"]],sort_keys=True).encode()).hexdigest()[:16]
        if identity in seen:
            continue
        seen.add(identity)
        kind = str(item["metric"]).split(".")[0]
        impact = max(-100, min(100, float(item["candidate"]) - float(item["baseline"])))
        score = round(WEIGHTS.get(kind, 1) * max(0, impact) * float(item["confidence"]), 3)
        output.append({"fingerprint":identity,"opportunity_id":item["id"],"source":item["source"],
                       "metric":item["metric"],"score":score,"evidence":item["evidence"],
                       "proposal":"experiment","requires_review":True,
                       "next_step":"validate data freshness, permissions, security, tests and incremental causal impact"})
    return sorted(output,key=lambda x:(-x["score"],x["fingerprint"]))

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--input",default="automation/self_improvement/opportunities.json")
    parser.add_argument("--output",default="automation/self_improvement/report.json")
    args=parser.parse_args()
    source=Path(args.input)
    opportunities=json.loads(source.read_text()) if source.exists() else []
    report={"created_at":dt.datetime.now(dt.timezone.utc).isoformat(),"input_count":len(opportunities),
            "status":"no_evidence" if not opportunities else "candidates_for_validation",
            "production_deploy_verified":False,"improvements":analyze(opportunities)}
    Path(args.output).parent.mkdir(parents=True,exist_ok=True)
    Path(args.output).write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n")
    print(f"Reviewed {len(opportunities)} observations; {len(report['improvements'])} improvement candidates")
if __name__=="__main__":
    main()
