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
    args=p.parse_args()
    url=(os.getenv('BG_PORTAL_EU_SUPABASE_URL') or os.getenv('SUPABASE_URL') or '').strip()
    key=(os.getenv('BG_PORTAL_EU_SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_ROLE_KEY') or '').strip()
    if not url or not key:
        print('REGULATORY_BRAIN_CREDENTIALS_MISSING',file=sys.stderr); return 2
    state=json.load(open(args.state,encoding='utf-8'))
    written=0
    for path in pathlib.Path(args.raw_dir).glob('*/*.bin'):
        source_id=path.parent.name
        meta=state.get('sources',{}).get(source_id)
        if not meta: continue
        raw=path.read_bytes()
        compressed=gzip.compress(raw,mtime=0)
        evidence={
          'contract':'powerhouse-regulatory-source-observation-v1',
          'source_id':source_id,'framework':meta.get('framework'),'authority':meta.get('authority'),
          'jurisdiction':meta.get('jurisdiction'),'source_url':meta.get('url'),'final_url':meta.get('finalUrl'),
          'http_status':meta.get('httpStatus'),'content_type':meta.get('contentType'),
          'content_sha256':meta.get('contentSha256'),'raw_sha256':meta.get('rawSha256'),
          'raw_encoding':'gzip+base64','raw_body_gzip_base64':base64.b64encode(compressed).decode(),
          'etag':meta.get('etag'),'last_modified':meta.get('lastModified'),
          'previous_sha256':meta.get('previousSha256'),'first_observation':meta.get('firstObservation',False),
          'change_detected':meta.get('changed',False)
        }
        dedupe='regulatory:'+source_id+':'+str(meta.get('rawSha256'))
        payload={'p_source_key':'regulatory-'+source_id,'p_dedupe_key':dedupe,'p_external_event_id':str(meta.get('rawSha256')),
                 'p_observed_at':meta.get('checkedAt') or datetime.now(timezone.utc).isoformat(),'p_evidence':evidence}
        rpc(url,key,payload); written+=1
    print(json.dumps({'contract':'powerhouse-regulatory-brain-ingest-v1','written':written}))
    return 0
if __name__=='__main__': sys.exit(main())
