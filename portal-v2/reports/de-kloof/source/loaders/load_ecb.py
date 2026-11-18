import csv,io,sqlite3,subprocess
c=sqlite3.connect('bulk2.db')
S=[('EXR','M.USD.EUR.SP00.A','Wisselkoers EUR/USD (maandgemiddelde)','USD per EUR','markt'),('EXR','M.GBP.EUR.SP00.A','Wisselkoers EUR/GBP','GBP per EUR','markt'),('EXR','M.CNY.EUR.SP00.A','Wisselkoers EUR/CNY','CNY per EUR','geopolitiek'),
('FM','B.U2.EUR.4F.KR.MRR_FR.LEV','ECB-rente hoofdrefinanciering','%','financiering'),('FM','B.U2.EUR.4F.KR.DFR.LEV','ECB-depositorente','%','financiering'),
('ICP','M.U2.N.000000.4.ANR','Inflatie eurogebied (HICP, jaarmutatie)','%','macro'),('ICP','M.U2.N.NRGY00.4.ANR','Inflatie energie eurogebied','%','energie'),
('MIR','M.U2.B.A2A.A.R.0.2240.EUR.N','Rente nieuwe bedrijfsleningen tot 250k (eurogebied)','%','financiering'),('MIR','M.NL.B.A2A.A.R.0.2240.EUR.N','Rente nieuwe bedrijfsleningen tot 250k (NL)','%','financiering'),
('MIR','M.U2.B.A2A.A.R.A.2240.EUR.N','Rente nieuwe bedrijfsleningen tot 1 mln (eurogebied)','%','financiering'),
('BSI','M.U2.Y.U.A20T.A.1.U2.2240.Z01.E','Bankleningen aan niet-financiele bedrijven, eurogebied (stand)','EUR mln','financiering'),
('BSI','M.U2.Y.U.A20T.A.I.U2.2240.Z01.A','Groei bankleningen aan bedrijven eurogebied (jaarmutatie)','%','financiering'),
('LFSI','M.I9.S.UNEHRT.TOTAL0.15_74.T','Werkloosheid eurogebied','%','arbeid'),
('MNA','Q.Y.I9.W2.S1.S1.B.B1GQ._Z._Z._Z.EUR.LR.GY','BBP-groei eurogebied (kwartaal, jaarmutatie)','%','macro')]
for fl,key,lab,unit,th in S:
    u=f'https://data-api.ecb.europa.eu/service/data/{fl}/{key}?format=csvdata&startPeriod=2010'
    t=subprocess.run(['curl','-s','-m','60',u],capture_output=True,text=True).stdout
    if not t.startswith('KEY'): print(fl,key,'FAIL',t[:60].replace('\n',' '));continue
    rd=list(csv.DictReader(io.StringIO(t)));n=0
    sid='ecb_'+fl+'_'+key.replace('.','_')
    for r in rd:
        try:v=float(r['OBS_VALUE'])
        except:continue
        c.execute('insert or replace into observations values (?,?,?,?,?,?,?,?,?,?,?)',(sid,lab,r['TIME_PERIOD'],v,unit,key.split('.')[1] if fl in('MIR','EXR') else 'EA','totaal','ECB-'+fl,f'ECB {fl}/{key}','2026-Q4','2026-11-18'));n+=1
    c.execute('insert or replace into sources values (?,?,?,?,?,?,?,?)',('ECB-'+fl+'-'+key,lab,'ECB Data Portal','2026-11-18','https://data.ecb.europa.eu/data/datasets/'+fl,'A','Eurogebied/NL',f'thema {th}'))
    c.commit();print(sid,n)
