import json,sqlite3,subprocess,sys
DB='../groot/ai_mkb.db'
IND={
'NY.GDP.MKTP.CD':('BBP, lopende USD','USD','macro'),'NY.GDP.MKTP.KD.ZG':('BBP-groei','%','macro'),'NY.GDP.PCAP.PP.CD':('BBP per inwoner, PPP','USD','macro'),
'FP.CPI.TOTL.ZG':('Inflatie (CPI)','%','macro'),'SL.UEM.TOTL.ZS':('Werkloosheid (ILO)','%','arbeid'),'SL.TLF.CACT.ZS':('Arbeidsparticipatie','%','arbeid'),
'IT.NET.USER.ZS':('Internetgebruikers','% bevolking','digitaal'),'IT.CEL.SETS.P2':('Mobiele abonnementen','per 100','digitaal'),'IT.NET.BBND.P2':('Vast breedband','per 100','digitaal'),
'IT.NET.SECR.P6':('Beveiligde internetservers','per miljoen','digitaal'),'GB.XPD.RSDV.GD.ZS':('R&D-uitgaven','% BBP','innovatie'),'SP.POP.SCIE.RD.P6':('Onderzoekers','per miljoen','innovatie'),
'TX.VAL.TECH.MF.ZS':('Hoogtechnologische export','% van maakindustrie-export','handel'),'TX.VAL.ICTG.ZS.UN':('ICT-goederenexport','% goederenexport','handel'),'BX.GSR.CCIS.ZS':('ICT-dienstenexport','% dienstenexport','handel'),
'IC.BUS.NDNS.ZS':('Nieuwe bedrijven per 1.000 mensen 15-64','per 1.000','markt'),'IC.REG.DURS':('Dagen om bedrijf te starten','dagen','markt'),'FS.AST.PRVT.GD.ZS':('Binnenlandse krediet aan private sector','% BBP','financiering'),
'EG.ELC.ACCS.ZS':('Toegang tot elektriciteit','% bevolking','energie'),'EG.FEC.RNEW.ZS':('Hernieuwbaar aandeel energieverbruik','%','energie'),'EG.USE.PCAP.KG.OE':('Energiegebruik per inwoner','kg olie-eq','energie'),
'EN.GHG.CO2.PC.CE.AR5':('CO2 per inwoner','t','energie'),'NE.TRD.GNFS.ZS':('Handel','% BBP','handel'),'BX.KLT.DINV.WD.GD.ZS':('FDI-instroom','% BBP','geopolitiek'),
'MS.MIL.XPND.GD.ZS':('Militaire uitgaven','% BBP','geopolitiek'),'PV.EST':('Politieke stabiliteit (WGI)','index -2,5..2,5','politiek'),'GE.EST':('Overheidseffectiviteit (WGI)','index','politiek'),
'RQ.EST':('Regelkwaliteit (WGI)','index','politiek'),'RL.EST':('Rechtsstaat (WGI)','index','politiek'),'CC.EST':('Corruptiebeheersing (WGI)','index','politiek'),'VA.EST':('Inspraak en verantwoording (WGI)','index','politiek'),
'SP.POP.TOTL':('Bevolking','aantal','macro'),'SP.URB.TOTL.IN.ZS':('Stedelijke bevolking','%','macro'),'SP.POP.1564.TO.ZS':('Bevolking 15-64','%','macro'),'SE.TER.ENRR':('Tertiair onderwijs bruto inschrijving','%','arbeid'),
'IP.PAT.RESD':('Octrooiaanvragen residenten','aantal','innovatie'),'NV.SRV.TOTL.ZS':('Diensten','% BBP','macro'),'NV.IND.MANF.ZS':('Maakindustrie','% BBP','macro'),'GC.TAX.TOTL.GD.ZS':('Belastingopbrengst','% BBP','politiek'),
'LP.LPI.OVRL.XQ':('Logistics Performance Index','1-5','handel'),'SL.AGR.EMPL.ZS':('Werkgelegenheid landbouw','%','arbeid'),'SL.SRV.EMPL.ZS':('Werkgelegenheid diensten','%','arbeid'),
'FX.OWN.TOTL.ZS':('Bankrekening (15+)','%','financiering'),'NY.GNS.ICTR.ZS':('Bruto spaarquote','% BBP','macro'),'GC.DOD.TOTL.GD.ZS':('Centrale overheidsschuld','% BBP','politiek'),
'IS.SHP.GOOD.TD':('Containerhavenverkeer (TEU)','TEU','handel'),'SH.XPD.CHEX.GD.ZS':('Gezondheidsuitgaven','% BBP','macro'),
}
import time
c=sqlite3.connect(DB)
tot=0
done={r[0] for r in c.execute("select distinct series_id from observations where series_id like 'wb_%'")}
for code,(lab,unit,th) in IND.items():
    if 'wb_'+code in done: continue
    url=f'https://api.worldbank.org/v2/country/all/indicator/{code}?format=json&per_page=20000&date=2010:2026'
    try:
        rows=None
        for t in range(4):
            r=subprocess.run(['curl','-s','-m','120','-A','Mozilla/5.0',url],capture_output=True,text=True).stdout
            try:
                j=json.loads(r);rows=j[1] or [];break
            except Exception: time.sleep(4)
        if rows is None: raise Exception('retries')
    except Exception as e:
        print(code,'FAIL',str(e)[:60]);continue
    n=0
    for x in rows:
        if x['value'] is None or not x['countryiso3code']: continue
        c.execute('insert or replace into observations(series_id,label,period,value,unit,region,segment,source_id,definition,edition,retrieved_at) values (?,?,?,?,?,?,?,?,?,?,?)',('wb_'+code,lab,x['date'],x['value'],unit,x['countryiso3code'],'totaal','W-'+code,f"World Bank {code}: {x['indicator']['value']}",'2026-Q4','2026-11-18'));n+=1
    c.execute('insert or replace into sources values (?,?,?,?,?,?,?,?)',('W-'+code,lab,'World Bank','2026-11-18','https://data.worldbank.org/indicator/'+code,'A','Alle landen en aggregaten, 2010-2026',f'thema {th}; eenheid {unit}'))
    c.commit();tot+=n;print(code,n)
print('total',tot)
