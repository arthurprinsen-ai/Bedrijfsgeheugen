import csv,io,sqlite3,urllib.request,sys
DB='../groot/ai_mkb.db'
SET=[('OECD.SDD.TPS','DSD_PDB@DF_PDB_GR','1.0','Productiviteitsgroei (OECD)','2015','productiviteit'),
('OECD.SDD.TPS','DSD_PDB@DF_PDB_LV','1.0','Productiviteitsniveau (OECD)','2015','productiviteit'),
('OECD.STI.DEP','DSD_ICT_B@DF_BUSINESSES','1.1','ICT en AI-gebruik door bedrijven (OECD)','2015','digitaal'),
('OECD.STI.DEP','DSD_DIGITAL_TRADE@DF_DIGITAL_TRADE','1.0','Digitale handel, experimentele schatting','2015','handel'),
('OECD.TAD.TPD','DSD_STRI@DF_STRI_DIGITAL','1.0','Digital Services Trade Restrictiveness Index','2015','politiek'),
('OECD.STI.PIE','DSD_TIVA_MAINSH@DF_MAINSH','1.2','Trade in Value Added, aandelen','2015','handel'),
('OECD.DAF.INV','DSD_FDI@DF_FDI_AGGR_SUMM','1.0','Buitenlandse directe investeringen, hoofdaggregaten','2015','geopolitiek'),
('OECD.SDD.STES','DSD_STES@DF_CLI','4.1','Samengestelde voorlopende indicator','2023','markt'),
('OECD.SDD.STES','DSD_KEI@DF_KEI','4.0','Kortetermijn-indicatoren','2023','macro'),
('OECD.CFE.SMEE','DSD_SMEE_FINANCING@DF_SMEE_SCOREBOARD','1.1','Financiering van mkb (OECD-scoreboard)','2007','financiering'),
('OECD.ECO.MAD','DSD_EO@DF_EO','1.5','OECD Economic Outlook 119 (prognoses)','2023','macro'),
('OECD.STI.STP','DSD_RDS_BERD@DF_BERD_SOF_SIZE','1.0','R&D bedrijven naar grootteklasse','2012','innovatie'),
]
c=sqlite3.connect(DB)
for ag,fid,ver,label,start,th in SET:
    u=f'https://sdmx.oecd.org/public/rest/data/{ag},{fid},{ver}?startPeriod={start}&format=csvfile'
    try:
        t=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'curl/8.5.0','Accept':'text/csv'}),timeout=120).read().decode('utf-8','replace')
    except Exception as e:
        print(fid,'FAIL',str(e)[:80]);continue
    rd=list(csv.DictReader(io.StringIO(t)))
    if not rd: print(fid,'empty');continue
    cols=rd[0].keys()
    skip={'DATAFLOW','REF_AREA','TIME_PERIOD','OBS_VALUE','UNIT_MEASURE','FREQ','OBS_STATUS','UNIT_MULT','DECIMALS','BASE_PER','CONF_STATUS','TIME_FORMAT','COMMENT_OBS'}
    dims=[k for k in cols if k not in skip and not k.endswith('_LABEL') and not k.startswith('COMMENT')]
    # keep only varying dims
    var=[k for k in dims if len({r[k] for r in rd[:2000]})>1]
    n=0
    for r in rd:
        try: v=float(r['OBS_VALUE'])
        except: continue
        seg='|'.join(r[k] for k in var) or 'totaal'
        c.execute('insert or replace into observations(series_id,label,period,value,unit,region,segment,source_id,definition,edition,retrieved_at) values (?,?,?,?,?,?,?,?,?,?,?)',('oecd_'+fid.split('@')[1].lower(),label,r['TIME_PERIOD'],v,r.get('UNIT_MEASURE',''),r.get('REF_AREA',''),seg[:200],'O-'+fid.split('@')[1],f'OECD {fid}','2026-Q4','2026-11-18'));n+=1
    c.execute('insert or replace into sources values (?,?,?,?,?,?,?,?)',('O-'+fid.split('@')[1],label,'OECD','2026-11-18','https://sdmx.oecd.org/public/rest/data/'+ag+','+fid,'A','OECD- en partnerlanden',f'thema {th}; dims {",".join(var)}'))
    c.commit();print(fid,n,var)
