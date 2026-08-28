#!/usr/bin/env python3
import datetime as dt, html, json, os, pathlib, re, sys, urllib.request
API='https://api.notion.com/v1'; VER='2025-09-03'
QUEUE='70706495-cc0c-44ed-84bc-493df00651f1'
TEMPLATE=pathlib.Path('blog/bedrijfsopvolging-begin-bij-het-geheugen/index.html')
INDEX=pathlib.Path('blog/index.html'); RSS=pathlib.Path('blog/rss.xml'); SITEMAP=pathlib.Path('sitemap.xml')

def fail(m): print(f'::error::{m}',file=sys.stderr); raise SystemExit(1)
def req(path,method='GET',body=None):
 t=os.getenv('NOTION_TOKEN','').strip()
 if not t: fail('NOTION_TOKEN ontbreekt')
 r=urllib.request.Request(API+path,data=None if body is None else json.dumps(body).encode(),method=method,headers={'Authorization':f'Bearer {t}','Notion-Version':VER,'Content-Type':'application/json'})
 with urllib.request.urlopen(r,timeout=30) as x:return json.load(x)
def txt(p,n):
 a=(p.get(n)or{}).get('rich_text') or (p.get(n)or{}).get('title') or []
 return ''.join(x.get('plain_text','') for x in a).strip()
def uid(p,n):
 v=p.get(n)or{}; u=v.get('unique_id')or{}
 if u and u.get('number') is not None:
  prefix=str(u.get('prefix')or'').strip(); number=str(u['number']); return f'{prefix}-{number}' if prefix else number
 return txt(p,n)
def sel(p,n): return ((((p.get(n)or{}).get('select')or{}).get('name'))or'').strip()
def chk(p,n): return bool((p.get(n)or{}).get('checkbox'))
def url(p,n): return str((p.get(n)or{}).get('url')or'').strip()
def num(p,n): return (p.get(n)or{}).get('number') or 0
def pid(u):
 m=re.search(r'([0-9a-fA-F]{32})(?:\?|$)',u.replace('-',''))
 if not m: fail('Bronpagina bevat geen geldige Notion page-id')
 s=m.group(1).lower(); return f'{s[:8]}-{s[8:12]}-{s[12:16]}-{s[16:20]}-{s[20:]}'

def get_queue(force=''):
 c=[{'property':'Status','select':{'equals':'Gepland'}},{'property':'Source Mode','select':{'equals':'Approved central article'}},{'property':'Dispatch status','select':{'equals':'Pending'}},{'property':'Autopublish toegestaan','checkbox':{'equals':True}},{'property':'Quality gate','select':{'equals':'Geslaagd'}},{'property':'Herzien','select':{'equals':'Goedgekeurd'}}]
 if force:c.append({'property':'Slug','rich_text':{'equals':force}})
 rows=req(f'/data_sources/{QUEUE}/query','POST',{'filter':{'and':c},'sorts':[{'property':'Publicatiedatum','direction':'ascending'}],'page_size':2}).get('results')or[]
 if not rows:return None
 if force and len(rows)!=1:fail(f'Geforceerde slug is niet uniek; gevonden={len(rows)}')
 return rows[0]
def queue_contract(row):
 p=row.get('properties')or{}; q={'page':row['id'],'slug':txt(p,'Slug'),'source':txt(p,'Bron Content ID'),'cmd':txt(p,'Publish Command ID'),'source_page':url(p,'Bronpagina'),'attempt':int(num(p,'Dispatch attempt'))}
 if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',q['slug']):fail('Queue bevat ongeldige slug')
 if q['cmd'].replace('\\|','|')!=f"seo-publish|{q['source']}|{q['slug']}":fail('Publish Command ID mismatch')
 if not q['source_page']:fail('Bronpagina ontbreekt')
 if q['attempt']>=2:fail('Maximaal twee dispatchpogingen toegestaan')
 return q
def source_contract(page,q):
 p=page.get('properties')or{}; s={'content_id':uid(p,'Content ID'),'title':txt(p,'Titel'),'blogtext':txt(p,'Blogtekst'),'slug':txt(p,'SEO Slug'),'keyword':txt(p,'SEO focuszoekwoord'),'meta':txt(p,'SEO metaomschrijving')}
 checks={'content_id':s['content_id']==q['source'],'type':sel(p,'Contenttype')=='Artikel','approved':sel(p,'Herzien')=='Goedgekeurd','gate':sel(p,'Publicatiecheck')=='Gereed','status':sel(p,'Make status')=='Publiceren','narrative':sel(p,'Rode-draadcheck')=='Klopt','generate':not chk(p,'Genereren'),'test':not chk(p,'Testmodus'),'unpublished':not url(p,'Publicatielink'),'slug':s['slug']==q['slug'],'title':bool(s['title']),'text':bool(s['blogtext']),'keyword':bool(s['keyword']),'meta':120<=len(s['meta'])<=170}
 bad=[k for k,v in checks.items() if not v]
 if bad:fail('Centrale bron faalt toelatingspoort: '+', '.join(bad))
 return s

def inline(x):
 x=html.escape(x,quote=False); x=re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)',r'<a href="\2">\1</a>',x); return re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',x)
def render(raw):
 raw=raw.replace('\r\n','\n').replace('<br><br>','\n\n').replace('<br>','\n'); out=[]; first=True
 for b in [x.strip() for x in re.split(r'\n\s*\n',raw) if x.strip()]:
  if b.startswith('## '):out.append(f'    <h2>{inline(b[3:].strip())}</h2>');continue
  ls=[x.strip() for x in b.splitlines() if x.strip()]
  if ls and all(re.match(r'^-\s+',x) for x in ls):out.append('    <ul>'+''.join(f"<li>{inline(re.sub(r'^-\s+','',x))}</li>" for x in ls)+'</ul>');continue
  if ls and all(re.match(r'^\d+\.\s+',x) for x in ls):out.append('    <ol>'+''.join(f"<li>{inline(re.sub(r'^\d+\.\s+','',x))}</li>" for x in ls)+'</ol>');continue
  out.append(f'    <p{" class=\"lead\"" if first else ""}>'+ '<br>'.join(inline(x) for x in ls)+'</p>'); first=False
 return '\n\n'.join(out)
def one(pat,repl,text,flags=0):
 x,n=re.subn(pat,repl,text,count=1,flags=flags)
 if n!=1:fail('Templatecontract faalde: '+pat[:50])
 return x
def article(template,s):
 slug,title,meta,kw=s['slug'],s['title'],s['meta'],s['keyword']; can=f'https://www.bedrijfsgeheugen.nl/blog/{slug}/'; today=dt.date.today().isoformat()
 main='<main>\n<div class="wrap">\n<nav class="bgkruim" aria-label="Kruimelpad"><a href="/">Home</a><span aria-hidden="true">&rsaquo;</span><a href="/blog/">Blog</a><span aria-hidden="true">&rsaquo;</span><span aria-current="page">'+html.escape(title)+'</span></nav>\n<div class="voortgang" id="vg"></div>\n<article class="artikel"><div class="artikelkop"><span class="eyebrow">Kennisborging · Bedrijfscontinuïteit</span><h1>'+html.escape(title)+'</h1><div class="artikelmeta"><span>'+dt.date.today().strftime('%d-%m-%Y')+'</span> · <span>Arthur Prinsen</span></div></div>\n'+render(s['blogtext'])+'\n</article></div>\n</main>'
 ld={'@context':'https://schema.org','@graph':[{'@type':'BlogPosting','headline':title,'description':meta,'datePublished':today,'dateModified':today,'inLanguage':'nl-NL','mainEntityOfPage':can,'author':{'@type':'Person','name':'Arthur Prinsen','url':'https://www.bedrijfsgeheugen.nl/over-ons'},'publisher':{'@id':'https://www.bedrijfsgeheugen.nl/#org'},'articleSection':'Kennisborging','keywords':kw},{'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Home','item':'https://www.bedrijfsgeheugen.nl/'},{'@type':'ListItem','position':2,'name':'Blog','item':'https://www.bedrijfsgeheugen.nl/blog/'},{'@type':'ListItem','position':3,'name':title,'item':can}]}]}
 t=template
 for pat,repl in [(r'<title>.*?</title>',f'<title>{html.escape(title)}</title>'),(r'<meta name="description" content="[^"]*">',f'<meta name="description" content="{html.escape(meta,quote=True)}">'),(r'<link rel="canonical" href="[^"]*">',f'<link rel="canonical" href="{can}">'),(r'<meta name="bg-zoekwoord" content="[^"]*">',f'<meta name="bg-zoekwoord" content="{html.escape(kw,quote=True)}">'),(r'<meta property="og:title" content="[^"]*">',f'<meta property="og:title" content="{html.escape(title,quote=True)}">'),(r'<meta property="og:description" content="[^"]*">',f'<meta property="og:description" content="{html.escape(meta,quote=True)}">'),(r'<meta property="og:url" content="[^"]*">',f'<meta property="og:url" content="{can}">')]:t=one(pat,repl,t,re.S)
 t=one(r'<script type="application/ld\+json">.*?</script>','<script type="application/ld+json">'+json.dumps(ld,ensure_ascii=False,separators=(',',':'))+'</script>',t,re.S); return one(r'<main>.*?</main>',main,t,re.S)
def updates(s):
 href=f"/blog/{s['slug']}/"; text=INDEX.read_text(encoding='utf-8')
 if href not in text:
  plain=re.sub(r'<[^>]+>',' ',render(s['blogtext'])); plain=re.sub(r'\s+',' ',html.unescape(plain)).strip(); teaser=plain[:180].rsplit(' ',1)[0]+'…'; card=f'  <a class="kaart" href="{href}"><span class="tag">Kennisborging</span><h2>{html.escape(s["title"])}</h2><p>{html.escape(teaser)}</p><span class="lees">Lees het artikel &rarr;</span><span class="datum">{dt.date.today().strftime("%d-%m-%Y")} &middot; nieuw</span></a>\n\n'; marker='<div class="artikelen">\n'
  if marker not in text:fail('Blogindex mist artikelen-marker')
  INDEX.write_text(text.replace(marker,marker+'\n'+card,1),encoding='utf-8')
 sm=SITEMAP.read_text(encoding='utf-8'); full='https://www.bedrijfsgeheugen.nl'+href
 if full not in sm:
  if '</urlset>' not in sm:fail('sitemap.xml mist </urlset>')
  SITEMAP.write_text(sm.replace('</urlset>',f'  <url><loc>{full}</loc><lastmod>{dt.date.today().isoformat()}</lastmod></url>\n</urlset>',1),encoding='utf-8')
 rs=RSS.read_text(encoding='utf-8')
 if full not in rs:
  if '<channel>' not in rs:fail('rss.xml mist <channel>')
  pub=dt.datetime.now(dt.timezone.utc).strftime('%a, %d %b %Y %H:%M:%S +0000'); item=f'<item><title>{html.escape(s["title"])}</title><link>{full}</link><guid>{full}</guid><pubDate>{pub}</pubDate><description>{html.escape(s["meta"])}</description></item>\n'; RSS.write_text(rs.replace('<channel>','<channel>\n'+item,1),encoding='utf-8')
def mark(q): req(f"/pages/{q['page']}",'PATCH',{'properties':{'Dispatch status':{'select':{'name':'Dispatched'}},'Dispatch attempt':{'number':q['attempt']+1},'Dispatched At':{'date':{'start':dt.datetime.now(dt.timezone.utc).isoformat()}}}})
def main():
 force=sys.argv[1].strip() if len(sys.argv)>1 else ''
 if force and not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',force):fail('Ongeldige geforceerde slug')
 row=get_queue(force)
 if not row:print('NO_ACTION: geen Pending Approved central article');return
 q=queue_contract(row); target=pathlib.Path('blog')/q['slug']/'index.html'
 if target.exists():fail('Doelslug bestaat al; verificatie vereist in plaats van tweede commit')
 s=source_contract(req(f"/pages/{pid(q['source_page'])}"),q)
 if not TEMPLATE.exists():fail(f'Template ontbreekt: {TEMPLATE}')
 target.parent.mkdir(parents=True,exist_ok=True); target.write_text(article(TEMPLATE.read_text(encoding='utf-8'),s),encoding='utf-8'); updates(s); mark(q)
 print(json.dumps({'status':'RENDERED','slug':q['slug'],'content_id':s['content_id'],'command_id':q['cmd']},ensure_ascii=False))
if __name__=='__main__':main()
