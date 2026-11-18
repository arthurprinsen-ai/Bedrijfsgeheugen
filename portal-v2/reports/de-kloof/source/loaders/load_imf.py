import json,sqlite3,subprocess
c=sqlite3.connect('bulk2.db')
c.execute('create table if not exists observations(series_id,label,period,value,unit,region,segment,source_id,definition,edition,retrieved_at,primary key(series_id,period,region,segment,edition))')
c.execute('create table if not exists sources(id primary key,name,publisher,published,url,tier,population,caveat)')
def cu(u):
    return subprocess.run(['curl','-s','-m','90',u],capture_output=True,text=True).stdout
ind=json.loads(cu('https://www.imf.org/external/datamapper/api/v1/indicators'))['indicators']
print(len(ind))
tot=0
for code,m in ind.items():
    try:
        j=json.loads(cu(f'https://www.imf.org/external/datamapper/api/v1/{code}'))['values'][code]
    except Exception as e:
        print(code,'FAIL');continue
    n=0
    for iso,ser in j.items():
        for yr,v in ser.items():
            if v is None: continue
            c.execute('insert or replace into observations values (?,?,?,?,?,?,?,?,?,?,?)',('imf_'+code,m['label'],yr,v,m.get('unit',''),iso,'totaal','I-'+code,'IMF DataMapper (WEO/Fiscal Monitor/etc.): '+m['label']+(' | '+m.get('description','')[:120] if m.get('description') else ''),'2026-Q4','2026-11-18'));n+=1
    c.execute('insert or replace into sources values (?,?,?,?,?,?,?,?)',('I-'+code,m['label'],'IMF DataMapper','2026-11-18','https://www.imf.org/external/datamapper/'+code,'A','Alle landen, historisch + prognose tot ~2031','Prognosejaren zijn IMF-schattingen'))
    c.commit();tot+=n;print(code,n,flush=True)
print('total',tot)
