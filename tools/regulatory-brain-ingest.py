#!/usr/bin/env python3
import argparse, base64, gzip, json, os, pathlib, sys, urllib.request
from datetime import datetime, timezone

def rpc(url,key,payload):
    endpoint=url.rstrip('/')+'/rest/v1/rpc/powerhouse_record_source_observation_v1'
    body=json.dumps(payload,separators=(',',':')).encode()
    req=urllib.request.Request(endpoint,data=body,method='POST',headers={
      'apikey':key,'authorization':'Bearer '+key,'content-type':'application/json','accept':'application/json'
    })
    with urllib.request.urlopen(req,timeout=60) as r:
        return r.read().decode('utf-8','replace')

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--state',default='data/regulatory-source-state.json')
    p.add_argument('--raw-dir',default='artifacts/regulatory/raw')
    p.add_argument('--checks',default='artifacts/regulatory/checks.json')
    args=p.parse_args()
    url=(os.getenv('BG_PORTAL_EU_SUPABASE_URL') or os.getenv('SUPABASE_URL') or '').strip()
    key=(os.getenv('BG_PORTAL_EU_SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_ROLE_KEY') or '').strip()
    if not url or not key:
        print('REGULATORY_BRAIN_CREDENTIALS_MISSING',file=sys.stderr); return 2
    checks=json.load(open(args.checks,encoding='utf-8'))
    written=0
    raw_written=0
    for source_id,meta in checks.get('sources',{}).items():
        checked_at=meta.get('checkedAt') or checks.get('checkedAt') or datetime.now(timezone.utc).isoformat()
        heartbeat={
          'contract':'powerhouse-regulatory-source-check-v1',
          'source_id':source_id,'framework':meta.get('framework'),'authority':meta.get('authority'),
          'jurisdiction':meta.get('jurisdiction'),'source_url':meta.get('url'),'final_url':meta.get('finalUrl'),
          'http_status':meta.get('httpStatus'),'content_type':meta.get('contentType'),
          'content_sha256':meta.get('contentSha256'),'raw_sha256':meta.get('rawSha256'),
          'bytes':meta.get('bytes'),'etag':meta.get('etag'),'last_modified':meta.get('lastModified'),
          'previous_sha256':meta.get('previousSha256'),'first_observation':meta.get('firstObservation',False),
          'change_detected':meta.get('changed',False),'freshness_heartbeat':True
        }
        heartbeat_key='regulatory-check:'+source_id+':'+checked_at
        rpc(url,key,{'p_source_key':'regulatory-'+source_id,'p_dedupe_key':heartbeat_key,
                     'p_external_event_id':str(meta.get('contentSha256')),'p_observed_at':checked_at,'p_evidence':heartbeat})
        written+=1

        raw_sha=str(meta.get('rawSha256') or '')
        raw_path=pathlib.Path(args.raw_dir)/source_id/(raw_sha+'.bin')
        if not raw_sha or not raw_path.exists():
            continue
        raw=raw_path.read_bytes()
        compressed=gzip.compress(raw,mtime=0)
        evidence={
          'contract':'powerhouse-regulatory-source-observation-v1',
          'source_id':source_id,'framework':meta.get('framework'),'authority':meta.get('authority'),
          'jurisdiction':meta.get('jurisdiction'),'source_url':meta.get('url'),'final_url':meta.get('finalUrl'),
          'http_status':meta.get('httpStatus'),'content_type':meta.get('contentType'),
          'content_sha256':meta.get('contentSha256'),'raw_sha256':raw_sha,
          'raw_encoding':'gzip+base64','raw_body_gzip_base64':base64.b64encode(compressed).decode(),
          'etag':meta.get('etag'),'last_modified':meta.get('lastModified'),
          'previous_sha256':meta.get('previousSha256'),'first_observation':meta.get('firstObservation',False),
          'change_detected':meta.get('changed',False)
        }
        dedupe='regulatory-content:'+source_id+':'+raw_sha
        rpc(url,key,{'p_source_key':'regulatory-'+source_id,'p_dedupe_key':dedupe,'p_external_event_id':raw_sha,
                     'p_observed_at':checked_at,'p_evidence':evidence})
        written+=1
        raw_written+=1
    print(json.dumps({'contract':'powerhouse-regulatory-brain-ingest-v1','written':written,'heartbeats':len(checks.get('sources',{})),'raw_observations':raw_written}))
    return 0
if __name__=='__main__': sys.exit(main())
