import sqlite3,json,numpy as np,pandas as pd
from scipy import stats
from scipy.cluster.hierarchy import linkage,fcluster
rng=np.random.default_rng(7);B=5000
c=sqlite3.connect('ai_mkb.db')
df=pd.read_sql('select * from country_ai',c)
R=[]  # name,value,lo,hi,n,method,note
def boot(x,y,fn):
    n=len(x);v=[]
    for _ in range(B):
        i=rng.integers(0,n,n)
        if np.std(x[i])==0 or np.std(y[i])==0:continue
        v.append(fn(x[i],y[i]))
    return np.percentile(v,[2.5,97.5])
def sp(a,b):return stats.spearmanr(a,b)[0]
def add(name,val,lo,hi,n,method,note=''):R.append((name,float(val),None if lo is None else float(lo),None if hi is None else float(hi),n,method,note))
def corr(name,x,y,note=''):
    x=np.asarray(x,float);y=np.asarray(y,float);r=sp(x,y);lo,hi=boot(x,y,sp);p=stats.spearmanr(x,y)[1]
    add(name,r,lo,hi,len(x),'Spearman rho + bootstrap 95%-interval (5000)',f'p={p:.4f}. {note}');return r,lo,hi,p
# A1 grootte
for col in('small','medium','large'):
    corr(f'totaal vs {col}',df.adopt_2025,df[col],'27 EU-landen, Eurostat 2025')
    add(f'variatiecoefficient {col}',df[col].std()/df[col].mean(),None,None,27,'SD/gemiddelde')
add('spreiding (SD, procentpunt) klein',df.small.std(),None,None,27,'SD');add('spreiding (SD, procentpunt) groot',df.large.std(),None,None,27,'SD')
df['ratio']=df.small/df.large
corr('totaal vs ratio klein/groot',df.adopt_2025,df.ratio,'hoe inclusief verspreiding')
sl=stats.linregress(df.small,df.adopt_2025);add('regressie totaal~klein: R2',sl.rvalue**2,None,None,27,'OLS')
sl2=stats.linregress(df.large,df.adopt_2025);add('regressie totaal~groot: R2',sl2.rvalue**2,None,None,27,'OLS')
nl=df[df.code=='NL'].iloc[0]
add('NL ratio klein/groot',nl.ratio,None,None,1,'');add('NL rang ratio',(df.ratio>nl.ratio).sum()+1,None,None,27,'rang (1=hoogste)')
add('EU-gemiddelde ratio klein/groot (ongewogen)',df.ratio.mean(),None,None,27,'')
# A3 doelen
d2=df.dropna(subset=['mkt','admin','acct','rd'])
for col,lab in(('mkt','marketing/verkoop'),('prod','productie'),('logi','logistiek'),('sec','ICT-beveiliging'),('admin','administratie/management'),('acct','boekhouding/financieel'),('rd','R&D')):
    d=df.dropna(subset=[col]);corr(f'totaal vs aandeel {lab}',d.adopt_2025,d[col],f'n={len(d)} (Frankrijk lage betrouwbaarheid uitgesloten waar leeg)')
d2=d2.assign(vol=(d2.admin+d2.acct)/d2.mkt)
corr('totaal vs (admin+boekhouding)/marketing',d2.adopt_2025,d2.vol,'volwassenheidsindex doelen')
# A4 inhaal
g=df[df.code!='NL'].copy();g['gr']=g.adopt_2025-g.adopt_2024;g['rel']=g.adopt_2025/g.adopt_2024
corr('groei 2024-25 (pp) vs niveau 2024',g.adopt_2024,g.gr,'excl. NL (reeksbreuk); 26 landen')
corr('relatieve groei vs niveau 2024',g.adopt_2024,g.rel,'excl. NL')
add('gemiddelde groei pp (laagste 10 landen 2024)',g.nsmallest(10,'adopt_2024').gr.mean(),None,None,10,'');add('gemiddelde groei pp (hoogste 10 landen 2024)',g.nlargest(10,'adopt_2024').gr.mean(),None,None,10,'')
add('gemiddelde relatieve groei x (laagste 10)',g.nsmallest(10,'adopt_2024').rel.mean(),None,None,10,'');add('gemiddelde relatieve groei x (hoogste 10)',g.nlargest(10,'adopt_2024').rel.mean(),None,None,10,'')
gap_open=g.nlargest(10,'adopt_2024').adopt_2025.mean()-g.nsmallest(10,'adopt_2024').adopt_2025.mean();gap_2024=g.nlargest(10,'adopt_2024').adopt_2024.mean()-g.nsmallest(10,'adopt_2024').adopt_2024.mean()
add('kloof boven/onder 10: 2024 (pp)',g.nlargest(10,'adopt_2024').adopt_2024.mean()-g.nsmallest(10,'adopt_2024').adopt_2024.mean(),None,None,10,'');add('kloof boven/onder 10: 2025 (pp, zelfde landen)',gap_open,None,None,10,'')
# A5 individu vs bedrijf
m=df.dropna(subset=['ms_individual_q2_2026'])
corr('bedrijfsadoptie vs individueel gen-AI-gebruik (Microsoft)',m.adopt_2025,m.ms_individual_q2_2026,f'n={len(m)} landen met data; Microsoft top-30 selectie')
# A6 NL positie
for col in('adopt_2025','small','medium','large','mkt','admin','acct','rd','prod','sec'):
    d=df.dropna(subset=[col]);z=(nl[col]-d[col].mean())/d[col].std();rk=(d[col]>nl[col]).sum()+1
    add(f'NL z-score {col}',z,None,None,len(d),f'rang {rk} van {len(d)}')
# A9 cluster doelen
d3=df.dropna(subset=['mkt','prod','logi','sec','admin','acct','rd']).copy()
X=d3[['mkt','prod','logi','sec','admin','acct','rd']].values;Z=(X-X.mean(0))/X.std(0)
L=linkage(Z,'ward');d3['cl']=fcluster(L,3,'maxclust')
cl=d3.groupby('cl')[['adopt_2025','mkt','prod','sec','admin','acct','rd']].mean().round(1)
for k,r in cl.iterrows():
    add(f'cluster {k}: gemiddelde adoptie',r.adopt_2025,None,None,int((d3.cl==k).sum()),'Ward, k=3',', '.join(d3[d3.cl==k].code))
nlc=int(d3[d3.code=='NL'].cl.iloc[0]);add('NL in cluster',nlc,None,None,1,'Ward k=3')
# A7 sector
s=pd.read_sql('select * from sector_ai',c)
s['gr']=s.cbs_2025-s.cbs_2023;s['x']=s.cbs_2025/s.cbs_2023
sc=s.dropna(subset=['cbs_2023'])
corr('sector: groei 2023-25 (pp) vs niveau 2023',sc.cbs_2023,sc.gr,'12 CBS-sectoren, 2+ medewerkers')
corr('sector: niveau 2025 vs niveau 2023',sc.cbs_2023,sc.cbs_2025,'persistentie van rangorde')
mm=s.dropna(subset=['exact_2026','cbs_2025']);mm=mm[mm.sector!='Accountancy'].copy();mm['kloof']=mm.exact_2026/mm.cbs_2025
for _,r in mm.iterrows():add(f'kloofindex {r.sector}',r.kloof,None,None,1,'Exact 2026 / CBS 2025',f'{r.exact_2026:.0f}% vs {r.cbs_2025:.0f}%')
add('rangcorrelatie Exact vs CBS (5 sectoren)',sp(mm.exact_2026,mm.cbs_2025),None,None,len(mm),'Spearman, n klein')
# A8 hype
add('CFO: gerapporteerd/omzet-geimpliceerd 2025',1.8/0.6,None,None,1,'verhouding');add('CFO: gerapporteerd/omzet-geimpliceerd 2026 (verwacht)',3.0/1.8,None,None,1,'verhouding')
# A10 NL meting-paradox
add('NL: Exact/CBS (2026 vs 2025, 2+)',70/17,None,None,1,'verhouding zelfrapportage/CBS')
add('NL: Eurostat 10+ / CBS 2+ (2025)',33.2/17,None,None,1,'verhouding; andere populatie en reeksbreuk')
c.execute('DROP TABLE IF EXISTS analysis_results');c.execute('CREATE TABLE analysis_results(id INTEGER PRIMARY KEY,name TEXT,value REAL,ci_low REAL,ci_high REAL,n INTEGER,method TEXT,note TEXT)')
c.executemany('INSERT INTO analysis_results(name,value,ci_low,ci_high,n,method,note) VALUES(?,?,?,?,?,?,?)',R);c.commit()
pd.set_option('display.width',250,'display.max_colwidth',90,'display.max_rows',200)
out=pd.read_sql('select name,round(value,3) v,round(ci_low,2) lo,round(ci_high,2) hi,n,substr(note,1,70) note from analysis_results',c);print(out.to_string())
print(cl)
