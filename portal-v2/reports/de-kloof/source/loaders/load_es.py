import sqlite3,sys,json
sys.path.insert(0,'.')
from es import get,parse
DB='/tmp/claude-0/-home-claude/01f1c6f3-5845-5e83-93d0-35c9370a3026/scratchpad/groot/ai_mkb.db'
SET=[
('une_rt_a','age=Y15-74&sex=T&unit=PC_ACT&sinceTimePeriod=2015','Werkloosheid 15-74 (% beroepsbevolking)','%','arbeid'),
('prc_hicp_aind','unit=RCH_A_AVG&coicop=CP00&sinceTimePeriod=2015','Inflatie HICP, jaargemiddelde','%','macro'),
('nama_10_gdp','na_item=B1GQ&unit=CLV_PCH_PRE&sinceTimePeriod=2015','BBP-volumegroei t.o.v. vorig jaar','%','macro'),
('nama_10_pc','na_item=B1GQ&unit=CP_EUR_HAB&sinceTimePeriod=2015','BBP per inwoner, lopende prijzen','EUR','macro'),
('gov_10dd_edpt1','na_item=GD&unit=PC_GDP&sector=S13&sinceTimePeriod=2015','Overheidsschuld (% BBP)','%','politiek'),
('earn_mw_cur','currency=EUR&sinceTimePeriod=2015','Minimumloon per maand (EUR)','EUR','arbeid'),
('lc_lci_lev','lcstruct=D1_D4_MD5&nace_r2=B-S_X_O&unit=EUR&sinceTimePeriod=2015','Uurloonkosten totaal (EUR)','EUR','arbeid'),
('rd_e_gerdtot','sectperf=TOTAL&unit=PC_GDP&sinceTimePeriod=2015','R&D-uitgaven (% BBP)','%','innovatie'),
('nrg_ind_ren','nrg_bal=REN&unit=PC&sinceTimePeriod=2015','Aandeel hernieuwbare energie','%','energie'),
('isoc_eb_ai','unit=PC_ENT&indic_is=E_AI_TANY&sinceTimePeriod=2021','AI-gebruik bedrijven, per grootteklasse','%','digitaal'),
('isoc_cicce_use','unit=PC_ENT&indic_is=E_CC&sinceTimePeriod=2018','Cloudgebruik bedrijven','%','digitaal'),
('isoc_ci_ifp_iu','unit=PC_IND&ind_type=IND_TOTAL&indic_is=I_IUX&sinceTimePeriod=2015','Internetgebruik personen (laatste 3 mnd)','%','digitaal'),
('demo_pjan','age=TOTAL&sex=T&sinceTimePeriod=2015','Bevolking 1 januari','aantal','macro'),
('nrg_pc_205','nrg_cons=MWH500-1999&tax=I_TAX&currency=EUR&unit=KWH&sinceTimePeriod=2019','Elektriciteitsprijs niet-huishoudens 500-2.000 MWh, incl. belasting','EUR/kWh','energie'),
('nrg_pc_203','nrg_cons=GJ1000-9999&tax=I_TAX&currency=EUR&unit=KWH&sinceTimePeriod=2019','Gasprijs niet-huishoudens, incl. belasting','EUR/kWh','energie'),
('bd_9ac_l_form_r2','indic_sb=V97020&nace_r2=B-S_X_O_S94&leg_form=TOTAL&sinceTimePeriod=2015','Bedrijfsgeboorten','aantal','markt'),
('tin00091','sinceTimePeriod=2015','Hoogopgeleide (tertiair) 25-34','%','arbeid'),
]
c=sqlite3.connect(DB)
res=[]
for code,q,label,unit,th in SET:
    try:
        ids,out,l=parse(get(code,q))
    except Exception as e:
        res.append((code,'FAIL',str(e)[:80]));continue
    n=0
    for r in out:
        extra=[r[d] for d in ids if d not in('geo','time','freq','unit','currency')]
        seg='|'.join(extra) if extra else 'totaal'
        c.execute('insert or replace into observations(series_id,label,period,value,unit,region,segment,source_id,definition,edition,retrieved_at) values (?,?,?,?,?,?,?,?,?,?,?)',(f'eurostat_{code}',label,r['time'],r['v'],unit,r['geo'],seg,'E-'+code,f'Eurostat {code}: {l}','2026-Q4','2026-11-18'));n+=1
    c.execute('insert or replace into sources values (?,?,?,?,?,?,?,?)',('E-'+code,l,'Eurostat','2026-11-18','https://ec.europa.eu/eurostat/databrowser/view/'+code,'A','EU-landen, zie reeks',f'thema {th}; eenheid {unit}'))
    res.append((code,n,l[:50]))
c.commit()
for r in res: print(r)
