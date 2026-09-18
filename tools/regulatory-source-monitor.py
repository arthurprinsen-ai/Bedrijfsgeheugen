#!/usr/bin/env python3
import argparse, hashlib, json, os, pathlib, re, sys, urllib.request
from datetime import datetime, timezone

UA='Bedrijfsgeheugen-Regulatory-Watch/1.0 (+https://www.bedrijfsgeheugen.nl)'
def stable_bytes(raw, content_type):
    if 'html' not in (content_type or '').lower():
        return raw
    text=raw.decode('utf-8','replace')
    text=re.sub(r'\s+',' ',text).strip()
    return text.encode('utf-8')

def fetch(source):
    request=urllib.request.Request(source['url'],headers={'User-Agent':UA,'Accept':'text/html,application/xhtml+xml,application/json,text/plain;q=0.9,*/*;q=0.1'})
    with urllib.request.urlopen(request,timeout=45) as response:
        raw=response.read()
        content_type=response.headers.get('Content-Type','')
        stable=stable_bytes(raw,content_type)
        return {
            'raw':raw,'stable':stable,'status':getattr(response,'status',200),
            'etag':response.headers.get('ETag'),'lastModified':response.headers.get('Last-Modified'),
            'contentType':content_type,'finalUrl':response.geturl()
        }

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--config',default='config/regulatory-sources.json')
    p.add_argument('--state',default='data/regulatory-source-state.json')
    p.add_argument('--raw-dir',default='artifacts/regulatory/raw')
    p.add_argument('--checks',default='artifacts/regulatory/checks.json')
    args=p.parse_args()
    config=json.load(open(args.config,encoding='utf-8'))
    state={'schemaVersion':1,'contract':'powerhouse-regulatory-source-state-v1','sources':{}}
    if os.path.exists(args.state):
        state=json.load(open(args.state,encoding='utf-8'))
    old=state.get('sources',{})
    now=datetime.now(timezone.utc).isoformat().replace('+00:00','Z')
    out={'schemaVersion':1,'contract':'powerhouse-regulatory-source-state-v1','checkedAt':state.get('checkedAt'),'sources':{}}
    changes=[]
    checks={'schemaVersion':1,'contract':'powerhouse-regulatory-check-run-v1','checkedAt':now,'sources':{}}
    pathlib.Path(args.raw_dir).mkdir(parents=True,exist_ok=True)
    for source in config['sources']:
        result=fetch(source)
        sha=hashlib.sha256(result['stable']).hexdigest()
        raw_sha=hashlib.sha256(result['raw']).hexdigest()
        previous=old.get(source['id'],{})
        changed=bool(previous.get('contentSha256') and previous.get('contentSha256')!=sha)
        record={
          'id':source['id'],'framework':source['framework'],'authority':source['authority'],'jurisdiction':source['jurisdiction'],
          'url':source['url'],'finalUrl':result['finalUrl'],'checkedAt':now,'httpStatus':result['status'],
          'contentType':result['contentType'],'contentSha256':sha,'rawSha256':raw_sha,'bytes':len(result['raw']),
          'etag':result['etag'],'lastModified':result['lastModified'],'previousSha256':previous.get('contentSha256'),
          'changed':changed,'firstObservation':not bool(previous.get('contentSha256'))
        }
        checks['sources'][source['id']]=record
        first=record['firstObservation']
        if changed or first:
            out['sources'][source['id']]=record
            out['checkedAt']=now
            if changed: changes.append(record)
            raw_path=pathlib.Path(args.raw_dir)/source['id']/(raw_sha+'.bin')
            raw_path.parent.mkdir(parents=True,exist_ok=True)
            raw_path.write_bytes(result['raw'])
        else:
            out['sources'][source['id']]=previous
    pathlib.Path(args.checks).parent.mkdir(parents=True,exist_ok=True)
    pathlib.Path(args.checks).write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    pathlib.Path(args.state).parent.mkdir(parents=True,exist_ok=True)
    pathlib.Path(args.state).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'checkedAt':now,'sources':len(checks['sources']),'changes':changes},ensure_ascii=False))
    return 0
if __name__=='__main__': sys.exit(main())
