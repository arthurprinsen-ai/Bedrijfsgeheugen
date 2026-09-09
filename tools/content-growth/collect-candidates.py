#!/usr/bin/env python3
import json, os, urllib.request

TOKEN=os.environ.get('NOTION_TOKEN','')
DB=os.environ.get('NOTION_BLOG_DB','')
if not TOKEN or not DB:
    raise SystemExit('NOTION_TOKEN and NOTION_BLOG_DB are required')

req=urllib.request.Request(
    f'https://api.notion.com/v1/databases/{DB}/query',
    data=json.dumps({
        'filter': {'and': [
            {'property':'Status','select':{'equals':'Goedgekeurd'}},
        ]},
        'page_size': 100
    }).encode(),
    headers={
        'Authorization':'Bearer '+TOKEN,
        'Notion-Version':'2022-06-28',
        'Content-Type':'application/json'
    },
    method='POST'
)

def txt(props, name):
    v=props.get(name) or {}
    arr=v.get('rich_text') or v.get('title') or []
    return ''.join(x.get('plain_text','') for x in arr).strip()

out=[]
for row in json.load(urllib.request.urlopen(req)).get('results',[]):
    p=row.get('properties',{})
    slug=txt(p,'Slug')
    if not slug: continue
    out.append({
        'content_id': f'blog:{slug}',
        'slug': slug,
        'page_id': row['id'],
        'eligible': True,
        'score': 0,
        'exploration': False
    })
print(json.dumps(out, ensure_ascii=False))
