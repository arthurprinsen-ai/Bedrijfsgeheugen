import json,sqlite3,subprocess,sys
cat=json.load(open('cbs_cat.json'))
IDS=['85612NED','81234ned','83599NED','84765NED','83131NED','82244NED','85081NED','85614NED']
c=sqlite3.connect('bulk2.db')
def cu(u):
    r=subprocess.run(['curl','-s','-m','120',u],capture_output=True,text=True).stdout
    return json.loads(r)
B='https://opendata.cbs.nl/ODataApi/odata/'
for tid in IDS:
    try:
        info=cu(B+tid+'/TableInfos')['value'][0];title=info['Title']
        props=cu(B+tid+'/DataProperties')['value']
        meas={p['Key']:(p['Title'],p.get('Unit') or '') for p in props if p['Type']=='Topic'}
        dims=[p['Key'] for p in props if p['Type'] in('Dimension','GeoDimension')]
        tdim=[p['Key'] for p in props if p['Type']=='TimeDimension']
        maps={}
        for d in dims+tdim:
            maps[d]={x['Key'].strip():x['Title'] for x in cu(B+tid+'/'+d)['value']}
        url=B+tid+'/TypedDataSet?$top=2000';n=0;skip=0
        while url and n<400000:
            j=cu(url)
            if not j['value']: break
            for r in j['value']:
                per=maps[tdim[0]].get(str(r.get(tdim[0],'')).strip(),r.get(tdim[0])) if tdim else ''
                seg='|'.join(maps[d].get(str(r.get(d,'')).strip(),str(r.get(d,''))) for d in dims) or 'totaal'
                for mk,(mt,mu) in meas.items():
                    v=r.get(mk)
                    if v is None or isinstance(v,str): continue
                    c.execute('insert or replace into observations values (?,?,?,?,?,?,?,?,?,?,?)',(f'cbs_{tid.upper()}_{mk}',mt,per,float(v),mu,'NL',seg[:200],'CBS-'+tid.upper(),f'CBS StatLine {tid}: {title}','2026-Q4','2026-11-18'));n+=1
            skip+=2000;url=B+tid+f'/TypedDataSet?$top=2000&$skip={skip}'
        c.execute('insert or replace into sources values (?,?,?,?,?,?,?,?)',('CBS-'+tid.upper(),title,'CBS','2026-11-18','https://opendata.cbs.nl/#/CBS/nl/dataset/'+tid.replace('NED','').replace('ned','')+'/table','A','Nederland',info.get('Summary','')[:150]))
        c.commit();print(tid,n,title[:50],flush=True)
    except Exception as e:
        print(tid,'FAIL',str(e)[:70],flush=True)
