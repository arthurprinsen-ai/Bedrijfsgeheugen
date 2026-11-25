import sqlite3, csv, json
c=sqlite3.connect('ai_mkb.db')
ED='2026-Q4'; RET='2026-11-18'
src=[
('M18','CBS Conjunctuurenquête: bedrijven zetten meer in op automatisering door personeelstekort','CBS (met KVK, EIB, MKB-Nederland, VNO-NCW)','2026-06-03','https://www.cbs.nl/nl-nl/nieuws/2026/23/bedrijven-zetten-meer-in-op-automatisering-door-personeelstekort','A','NL bedrijven excl. financieel/nutsbedrijven, april 2026; kleinbedrijf = 5-50 wp','Enquête, "automatisering" = o.a. robotisering of AI-ondersteuning; geen AI-gebruik an sich'),
('M19','CBS Arbeidsproductiviteit commerciële sector stijgt met 2,5 procent','CBS','2026-10-07','https://www.cbs.nl/nl-nl/nieuws/2026/41/arbeidsproductiviteit-commerciele-sector-stijgt-met-2-5-procent','A','NL commerciële sector, 2000-2025','2024 en 2025 voorlopig; geen causaal verband met AI aantoonbaar'),
('M20','CBS Faillissementen oktober 2026','CBS','2026-11','https://www.cbs.nl/nl-nl/nieuws/2026/46/in-oktober-27-procent-meer-faillissementen-dan-een-jaar-eerder','A','NL bedrijven en instellingen + eenmanszaken, zittingsdaggecorrigeerd','Maandcijfers volatiel; cumulatief is eigen optelling'),
('M21','Microsoft: The continued state of global AI diffusion in 2026','Microsoft AI Economy Institute','2026-09-21','https://blogs.microsoft.com/on-the-issues/2026/09/21/the-continued-state-of-global-ai-diffusion-in-2026/','B','Personen 15-64, telemetrie, gecorrigeerd voor OS-marktaandeel en internetpenetratie, Q2 2026','Telemetrie van eigen producten; meetmethode wijzigt volgende editie'),
('M22','CBS AI in de samenleving: ervaringen en opinies','CBS','2026','https://www.cbs.nl/nl-nl/longread/diversen/2026/ai-in-de-samenleving-ervaringen-en-opinies','A','Belevingenonderzoek 2025, n=3.834 18-plussers; ICT-enquête 2025','Zelfrapportage; mensen, geen bedrijven'),
]
for s in src: c.execute('insert or replace into sources values (?,?,?,?,?,?,?,?)',s)
c.execute('''create table if not exists observations(id integer primary key autoincrement, series_id text, label text, period text, value real, unit text, region text, segment text, source_id text, definition text, edition text, retrieved_at text, unique(series_id,period,region,segment,edition))''')
rows=[]
def o(sid,label,per,val,unit,reg,seg,src_,defn): rows.append((sid,label,per,val,unit,reg,seg,src_,defn,ED,RET))
# from country_ai
for code,country,a25,sm,me,la,a24,ms in c.execute('select code,country,adopt_2025,small,medium,large,adopt_2024,ms_individual_q2_2026 from country_ai'):
    d='Eurostat: bedrijven 10+ wp die AI gebruiken'
    o('eu_ai_adopt_total','AI-gebruik bedrijven 10+ wp','2025',a25,'%',code,'totaal','M17',d)
    if a24 is not None: o('eu_ai_adopt_total','AI-gebruik bedrijven 10+ wp','2024',a24,'%',code,'totaal','M17',d)
    o('eu_ai_adopt_size','AI-gebruik bedrijven 10+ wp','2025',sm,'%',code,'klein 10-49','M17',d)
    o('eu_ai_adopt_size','AI-gebruik bedrijven 10+ wp','2025',me,'%',code,'midden 50-249','M17',d)
    o('eu_ai_adopt_size','AI-gebruik bedrijven 10+ wp','2025',la,'%',code,'groot 250+','M17',d)
    if ms is not None: o('ms_ai_users_pop','Aandeel 15-64 dat gen-AI gebruikt (Microsoft)','2026-Q2',ms,'%',code,'bevolking','M21','Telemetrie, gecorrigeerd')
for sec,a,b,cc,ex in c.execute('select sector,cbs_2023,cbs_2024,cbs_2025,exact_2026 from sector_ai'):
    d='CBS: bedrijven 10+ wp die AI gebruiken'
    for p,v in (('2023',a),('2024',b),('2025',cc)):
        if v is not None: o('nl_ai_adopt_sector','AI-gebruik NL per sector',p,v,'%','NL',sec,'(CBS StatLine, zie M-bronnen sector)',d)
    if ex is not None: o('nl_ai_exact_sector','AI-gebruik volgens Exact MKB Barometer',"2026",ex,'%','NL',sec,'(Exact)','Zelfrapportage MKB-klanten Exact')
# new verified
for p,v in zip(range(2000,2026),[4.0,1.4,1.0,1.7,2.0,2.6,1.6,1.6,1.3,-2.4,2.2,1.3,-0.2,1.2,1.1,1.2,0.1,0.5,-0.3,0.0,-0.2,3.1,2.0,-2.0,-0.4,2.5]):
    o('nl_labour_productivity_growth','Arbeidsproductiviteit commerciële sector, groei t.o.v. vorig jaar',str(p),v,'%','NL','commerciële sector','M19','Toegevoegde waarde per gewerkt uur')
for lab,v25,v26 in [('totaal',24.7,29.7),('Informatie en communicatie',28.5,44.1),('Zakelijke dienstverlening',28.8,35.6),('Groothandel',29.6,32.4),('Bouwnijverheid',25.2,31.1),('Industrie',25.4,29.1),('Verhuur en handel onroerend goed',19.9,28.2),('Vervoer en opslag',25.4,27.9),('Landbouw',26.2,27.5),('Detailhandel',19.0,27.0),('Autohandel',18.0,19.8),('Horeca',13.8,14.2),('Cultuur, sport, recreatie',17.7,13.1)]:
    for p,v in (('2025-04',v25),('2026-04',v26)):
        o('nl_automation_as_staff_shortage_measure','Bedrijven die meer automatiseren als maatregel tegen personeelstekort',p,v,'%','NL',lab,'M18','Max. 2 antwoorden; automatisering = o.a. robotisering/AI-ondersteuning')
for seg,v in [('klein 5-50',20.1),('midden 50-250',28.1),('groot 250+',40.4)]:
    o('nl_automation_as_staff_shortage_measure','Bedrijven die meer automatiseren als maatregel tegen personeelstekort','2026-04',v,'%','NL',seg,'M18','Max. 2 antwoorden')
for seg,v in [('totaal',40.4),('klein 5-50',28.0),('midden 50-250',39.8),('groot 250+',53.2)]:
    o('nl_productivity_measure_tech','Bedrijven die technologie/automatisering inzetten voor productiviteit','2026-04',v,'%','NL',seg,'M18','Max. 2 antwoorden')
o('nl_staff_shortage','Bedrijven met personeelstekort','2026-04',64,'%','NL','totaal','M18','Conjunctuurenquête')
for p,v in [('2026-09',321),('2026-10',322),('2025-10',253)]:
    o('nl_bankruptcies_monthly','Faillissementen per maand (bedrijven+eenmanszaken)',p,v,'aantal','NL','totaal','M20','Zittingsdaggecorrigeerd')
for p,v in [('2025-10',6.6),('2026-10',8.1)]:
    o('nl_bankruptcy_rate','Faillissementsgraad per 100.000 bedrijven',p,v,'per 100k','NL','totaal','M20','Niet gecorrigeerd voor zittingsdagen')
for p,v in [('2026-01..10',2983),('2025-01..10',3063)]:
    o('nl_bankruptcies_cum','Faillissementen jan-okt (eigen optelling)',p,v,'aantal','NL','totaal','M20','Eigen optelling maandcijfers')
for sec,a,b in [('Horeca',23.3,25.1),('Industrie',19.5,24.8),('Handel',11.5,14.2),('Bouwnijverheid',14.0,12.5),('Informatie en communicatie',5.6,8.7)]:
    for p,v in (('2025-10',a),('2026-10',b)): o('nl_bankruptcy_rate_sector','Faillissementsgraad per 100.000 bedrijven',p,v,'per 100k','NL',sec,'M20','Niet gecorrigeerd')
o('ms_ai_users_world','Aandeel 15-64 dat gen-AI gebruikt (wereld)','2026-Q2',18.8,'%','WORLD','totaal','M21','Telemetrie')
for reg,v in [('AE',73.3),('SG',64.3)]: o('ms_ai_users_pop','Aandeel 15-64 dat gen-AI gebruikt (Microsoft)','2026-Q2',v,'%',reg,'bevolking','M21','Telemetrie')
for seg,v in [('Noord',28.8),('Zuid',16.2)]: o('ms_ai_users_world','Aandeel 15-64 dat gen-AI gebruikt (wereld)','2026-Q2',v,'%','WORLD',seg,'M21','Telemetrie')
for seg,v in [('werkenden totaal',42.9),('hbo/wo',55.5),('basis/vmbo/mbo1',19.7),('25-45 jaar',51.3),('65+',24.4)]:
    o('nl_ai_use_for_work_persons','AI gebruikt voor eigen werk (werkenden)','2025',v,'%','NL',seg,'M22','Belevingenonderzoek 2025')
o('nl_ai_use_3m_adults','AI gebruikt laatste 3 maanden (18+)','2025',39,'%','NL','18+','M22','ICT-enquête 2025')
o('nl_work_replaceable_belief','Denkt dat eigen werk deels/geheel vervangbaar is door AI','2025',45,'%','NL','werkenden','M22','Zelfrapportage')
c.executemany('insert or replace into observations(series_id,label,period,value,unit,region,segment,source_id,definition,edition,retrieved_at) values (?,?,?,?,?,?,?,?,?,?,?)',rows)
c.commit()
import os
os.makedirs('trendbank',exist_ok=True)
cur=c.execute('select series_id,label,period,value,unit,region,segment,source_id,definition,edition,retrieved_at from observations order by series_id,region,segment,period')
data=cur.fetchall(); cols=[d[0] for d in cur.description]
w=csv.writer(open('trendbank/observations.csv','w',newline='')); w.writerow(cols); w.writerows(data)
json.dump([dict(zip(cols,r)) for r in data],open('trendbank/observations.json','w'),ensure_ascii=False)
print(len(data),'obs;',c.execute('select count(distinct series_id) from observations').fetchone()[0],'series')
# NL-meetverschillen (wie meet wat)
c=sqlite3.connect('ai_mkb.db')
add=[('nl_ai_measures_2025','Bedrijven met AI, CBS 2+ wp','2025',17.0,'%','NL','CBS alle bedrijven 2+','S02','Statistiek'),
('nl_ai_measures_2025','Bedrijven met AI, CBS micro 2-10 wp','2025',13.8,'%','NL','CBS micro 2-10','M02','Statistiek'),
('nl_ai_measures_2025','Bedrijven met AI, CBS mkb 10-250','2025',29.8,'%','NL','CBS mkb 10-250','M02','Statistiek'),
('nl_ai_measures_2025','Bedrijven met AI, Eurostat/CBS 10+','2025',33.2,'%','NL','10+','M12','Statistiek'),
('nl_ai_measures_2025','Bedrijven met AI, CBS groot 250+','2025',66.2,'%','NL','CBS groot','M02','Statistiek'),
('nl_ai_measures_2025','Mkb zegt AI te gebruiken, Exact 2-250','2026',70.0,'%','NL','Exact 2-250 (zelfrapportage)','S04','Zelfrapportage klanten Exact'),
('nl_ai_measures_2025','Personen 15-64 gen-AI, Microsoft','2026-Q2',43.5,'%','NL','personen','S11','Telemetrie'),
('nl_ai_measures_2025','Werkenden AI voor werk, CBS','2025',42.9,'%','NL','werkenden','M22','Zelfrapportage')]
for r in add: c.execute('insert or replace into observations(series_id,label,period,value,unit,region,segment,source_id,definition,edition,retrieved_at) values (?,?,?,?,?,?,?,?,?,?,?)',r+(ED,RET))
c.commit()
cur=c.execute('select series_id,label,period,value,unit,region,segment,source_id,definition,edition,retrieved_at from observations order by series_id,region,segment,period')
data=cur.fetchall(); cols=[d[0] for d in cur.description]
w=csv.writer(open('trendbank/observations.csv','w',newline='')); w.writerow(cols); w.writerows(data)
json.dump([dict(zip(cols,r)) for r in data],open('trendbank/observations.json','w'),ensure_ascii=False)
print(len(data))
