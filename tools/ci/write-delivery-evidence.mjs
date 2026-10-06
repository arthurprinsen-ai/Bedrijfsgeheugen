#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const required = ["obligation_id","source_sha","artifact_hash","contract_version","provider","provider_object_id","started_at","completed_at","result"];
const input = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const i = arg.indexOf("=");
  return i === -1 ? [arg, ""] : [arg.slice(0, i), arg.slice(i + 1)];
}));
for (const key of required) {
  if (!input[key]) throw new Error(`missing required evidence field: ${key}`);
}
if (!/^[0-9a-f]{40,64}$/.test(input.source_sha)) throw new Error("invalid source_sha");
if (!/^sha256:[0-9a-f]{64}$/.test(input.artifact_hash)) throw new Error("invalid artifact_hash");
if (!["pass","fail"].includes(input.result)) throw new Error("invalid result");

const envelope = {
  obligation_id: input.obligation_id,
  source_sha: input.source_sha,
  artifact_hash: input.artifact_hash,
  contract_version: input.contract_version,
  provider: input.provider,
  provider_object_id: input.provider_object_id,
  started_at: input.started_at,
  completed_at: input.completed_at,
  result: input.result,
  proof: input.proof_json ? JSON.parse(input.proof_json) : {}
};
const canonical = JSON.stringify(envelope);
const evidenceHash = crypto.createHash("sha256").update(canonical).digest("hex");
const dir = path.join(process.cwd(), "artifacts", "delivery-evidence");
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `${evidenceHash}.json`);
const serialized = JSON.stringify(envelope, null, 2);
try {
  fs.writeFileSync(file, serialized + "\n", { flag: "wx" });
} catch (error) {
  if (error?.code !== "EEXIST") throw error;
  const existing = fs.readFileSync(file, "utf8").trim();
  if (existing !== serialized) throw new Error("content-address collision");
}
console.log(JSON.stringify({ evidence_hash: `sha256:${evidenceHash}`, path: file, envelope }, null, 2));
