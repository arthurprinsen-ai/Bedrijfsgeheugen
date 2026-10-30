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

def unverified_response_reason(result):
    """An HTTP challenge/accepted page is not an authoritative legal text revision."""
    status=result.get('status')
    if status != 200:
        return 'HTTP_STATUS_NOT_200'
    raw=result.get('raw') or b''
    if not raw.strip():
        return 'EMPTY_SOURCE_BODY'
    content_type=(result.get('contentType') or '').lower()
    if 'html' in content_type:
        preview=raw[:8192].decode('utf-8','replace').lower()
        if re.search(r'just a moment|enable javascript and cookies|verify you are human|checking your browser|captcha|bot protection|access denied',preview):
            return 'HTML_CHALLENGE_NOT_AUTHORITY'
    return None

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
        source_id=source.get('id')
        if not isinstance(source_id,str) or not re.fullmatch(r'[a-z][a-z0-9-]{0,62}',source_id):
            raise ValueError('REGULATORY_SOURCE_ID_INVALID')
        result=fetch(source)
        sha=hashlib.sha256(result['stable']).hexdigest()
        raw_sha=hashlib.sha256(result['raw']).hexdigest()
        previous=old.get(source_id,{})
        unverified_reason=unverified_response_reason(result)
        trusted=unverified_reason is None
        # Fail closed: never interpret HTTP 202/challenge/empty bodies as a legal change.
        changed=bool(trusted and previous.get('contentSha256') and previous.get('contentSha256')!=sha)
        first=bool(trusted and not previous.get('contentSha256'))
        record={
          'id':source_id,'framework':source['framework'],'authority':source['authority'],'jurisdiction':source['jurisdiction'],
          'url':source['url'],'finalUrl':result['finalUrl'],'checkedAt':now,'httpStatus':result['status'],
          'contentType':result['contentType'],'contentSha256':sha,'rawSha256':raw_sha,'bytes':len(result['raw']),
          'etag':result['etag'],'lastModified':result['lastModified'],'previousSha256':previous.get('contentSha256'),
          'changed':changed,'firstObservation':first,
          'observationTrusted':trusted,'unverifiedReason':unverified_reason
        }
        checks['sources'][source_id]=record
        if not trusted:
            # Keep previous authoritative baseline intact. Only status, hash
            # and rejection reason enter Brain; do not persist untrusted HTML
            # in a writer path or treat it as legal source content.
            if previous:
                out['sources'][source_id]=previous
            continue
        if changed or first:
            out['sources'][source_id]=record
            out['checkedAt']=now
            if changed: changes.append(record)
            raw_path=pathlib.Path(args.raw_dir)/source_id/(raw_sha+'.bin')
            raw_path.parent.mkdir(parents=True,exist_ok=True)
            raw_path.write_bytes(result['raw'])
        else:
            out['sources'][source_id]=previous
    pathlib.Path(args.checks).parent.mkdir(parents=True,exist_ok=True)
    pathlib.Path(args.checks).write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    pathlib.Path(args.state).parent.mkdir(parents=True,exist_ok=True)
    pathlib.Path(args.state).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'checkedAt':now,'sources':len(checks['sources']),'changes':changes},ensure_ascii=False))
    return 0
if __name__=='__main__': sys.exit(main())
