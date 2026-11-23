import sqlite3,numpy as np
from scipy.stats import spearmanr
c=sqlite3.connect('../groot/ai_mkb.db')
ai={r[0]:(r[1],r[2],r[3]) for r in c.execute('select code,adopt_2025,small,large from country_ai')}
def latest(sid,seg=None,maxyr='2025',minyr='2022'):
    q="select region,period,value,segment from observations where series_id=? and region in (%s) and period<=? and period>=?"%','.join('?'*len(ai))
    d={}
    for reg,p,v,sg in c.execute(q,(sid,*ai.keys(),maxyr+'~',minyr)):
        if seg and seg not in sg: continue
        if reg not in d or p>d[reg][0]: d[reg]=(p,v)
    return {k:v[1] for k,v in d.items()}
tests=[('eurostat_nama_10_pc',None,'BBP per inwoner (EUR)'),('eurostat_une_rt_a',None,'Werkloosheid'),('eurostat_rd_e_gerdtot',None,'R&D (% BBP)'),('eurostat_lc_lci_lev',None,'Uurloonkosten'),('eurostat_earn_mw_cur',None,'Minimumloon'),('eurostat_nrg_pc_205',None,'Elektriciteitsprijs bedrijven'),('eurostat_nrg_ind_ren',None,'Aandeel hernieuwbaar'),('eurostat_gov_10dd_edpt1',None,'Overheidsschuld (% BBP)'),('eurostat_isoc_cicce_use','E_CC|',None),('eurostat_prc_hicp_aind',None,'Inflatie'),('eurostat_isoc_ci_ifp_iu',None,'Internetgebruik personen')]
res=[];rng=np.random.default_rng(11)
for sid,seg,lab in tests:
    x=latest(sid)
    if not lab: lab='Cloudgebruik bedrijven'
    ks=[k for k in ai if k in x]
    if len(ks)<15: print('skip',sid,len(ks));continue
    a=np.array([ai[k][0] for k in ks]);b=np.array([x[k] for k in ks])
    r,p=spearmanr(a,b);bs=[]
    for _ in range(3000):
        i=rng.integers(0,len(ks),len(ks))
        if len(set(a[i]))>1 and len(set(b[i]))>1: bs.append(spearmanr(a[i],b[i])[0])
    lo,hi=np.nanpercentile(bs,[2.5,97.5]);res.append((lab,r,lo,hi,p,len(ks)))
res.sort(key=lambda t:t[4])
m=len(res)
for i,(lab,r,lo,hi,p,n) in enumerate(res):
    holm=min(1,p*(m-i)); print(f'{lab:32s} rho {r:5.2f} [{lo:5.2f},{hi:5.2f}] p {p:.4f} holm {holm:.3f} n {n}')
    c.execute('insert into analysis_results(name,value,ci_low,ci_high,n,method,note) values (?,?,?,?,?,?,?)',('AI-gebruik 2025 vs '+lab+' (27 EU-landen)',float(r),float(lo),float(hi),n,'Spearman+bootstrap 3000; Holm over %d toetsen'%m,f'p={p:.4f}; Holm-gecorrigeerd p={holm:.3f}; correlatie, geen oorzaak'))
c.commit()
