import csv,io,sqlite3,subprocess
c=sqlite3.connect('bulk2.db')
SL={'share-companies-using-artificial-intelligence':'digitaal','share-artificial-intelligence-job-postings':'arbeid','global-investment-in-generative-ai':'markt','private-investment-in-artificial-intelligence':'markt','corporate-investment-in-artificial-intelligence-by-type':'markt','computation-used-to-train-notable-artificial-intelligence-systems':'technologie','annual-scholarly-publications-on-artificial-intelligence':'innovatie','monthly-spending-data-center-us':'energie','test-scores-ai-capabilities-relative-human-performance':'technologie',
'fossil-fuel-price-index':'energie','natural-gas-prices':'energie','crude-oil-prices':'energie','coal-prices':'energie','levelized-cost-of-energy':'energie','trade-as-share-of-gdp':'handel','growth-of-global-trade':'handel','democracy-index-eiu':'politiek','electoral-democracy-index':'politiek','liberal-democracy-index':'politiek','political-regime':'politiek','migrant-stock-total':'arbeid','statutory-corporate-income-tax-rate':'politiek','revenue-from-corporate-income-taxes-gdp':'politiek','nvidia-quarterly-revenue-segment':'technologie','share-of-individuals-using-the-internet':'digitaal'}
for s,th in SL.items():
    t=subprocess.run(['curl','-s','-m','90',f'https://ourworldindata.org/grapher/{s}.csv?useColumnShortNames=true'],capture_output=True,text=True).stdout
    if t.startswith('{') or not t: print(s,'FAIL');continue
    rd=list(csv.DictReader(io.StringIO(t)));cols=list(rd[0].keys())
    ent='entity' if 'entity' in cols else cols[0]
    vcols=[k for k in cols if k not in('entity','code','year','day','owid_region')]
    n=0
    for r in rd:
        per=r.get('year') or r.get('day')
        for vc in vcols:
            try: v=float(r[vc])
            except: continue
            c.execute('insert or replace into observations values (?,?,?,?,?,?,?,?,?,?,?)',('owid_'+s,s.replace('-',' '),per,v,'',r.get('code') or r[ent],vc if len(vcols)>1 else 'totaal','OWID-'+s,'Our World in Data (afgeleid van brondata): '+s+' / '+vc,'2026-Q4','2026-11-18'));n+=1
    c.execute('insert or replace into sources values (?,?,?,?,?,?,?,?)',('OWID-'+s,s.replace('-',' '),'Our World in Data','2026-11-18','https://ourworldindata.org/grapher/'+s,'B','Wereld; oorspronkelijke bron per grafiek','Bewerking van derde bron; controleer de oorspronkelijke bron'))
    c.commit();print(s,n,flush=True)
