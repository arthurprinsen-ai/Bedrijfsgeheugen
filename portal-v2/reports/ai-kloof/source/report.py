import re
import sqlite3,html,os,sys
import pandas as pd,numpy as np
from playwright.sync_api import sync_playwright
c=sqlite3.connect('ai_mkb.db');e=html.escape
df=pd.read_sql('select * from country_ai',c);S=pd.read_sql('select * from sources',c).set_index('id')
A={r['name']:r for _,r in pd.read_sql('select * from analysis_results',c).iterrows()}
def nl(x,d=1):
    s=f"{x:.{d}f}" if d else f"{x:.0f}";return s.replace('.',',')
def fv(metric,region=None,year=None,size=None,source=None):
    q="select value from facts where metric=?";a=[metric]
    for col,v in(('region',region),('year',year),('size_class',size),('source_id',source)):
        if v is not None:q+=f" and {col}=?";a.append(v)
    r=c.execute(q,a).fetchall()
    assert len(r)==1,(metric,region,year,size,source,len(r));return r[0][0]
def sup(*ids):return "<sup class='sup'>["+",".join(i.replace('S','') for i in ids)+"]</sup>"
TIER={'A':'tA','B':'tB','C':'tC','D':'tD'}
def tier(t):return f"<span class='tier {TIER[t]}' title='bewijskracht {t}'>{t}</span>"
def src(*ids):return "<div class='src'>Bron: "+" · ".join(f"[{i[1:]}] {e(S.loc[i,'publisher'])} ({S.loc[i,'published']}){''}" for i in ids)+"</div>"
NL=df[df.code=='NL'].iloc[0]
# ---------- afgeleide getallen ----------
rank_small=int((df.small>NL.small).sum()+1);rank_tot=int((df.adopt_2025>NL.adopt_2025).sum()+1)
rank_ratio=int(A['NL rang ratio']['value'])
sm_x=df.small.max()/df.small.min();lg_x=df.large.max()/df.large.min()
top10_gr=A['gemiddelde groei pp (hoogste 10 landen 2024)']['value'];bot10_gr=A['gemiddelde groei pp (laagste 10 landen 2024)']['value']
gap24=A['kloof boven/onder 10: 2024 (pp)']['value'];gap25=A['kloof boven/onder 10: 2025 (pp, zelfde landen)']['value']
rel_top=A['gemiddelde relatieve groei x (hoogste 10)']['value'];rel_bot=A['gemiddelde relatieve groei x (laagste 10)']['value']
rho_gr=A['groei 2024-25 (pp) vs niveau 2024'];rho_ind=A['bedrijfsadoptie vs individueel gen-AI-gebruik (Microsoft)']
rho_sec=A['sector: groei 2023-25 (pp) vs niveau 2023']
# ---------- SVG helpers ----------
def svg_dumbbell(d):
    d=d.sort_values('large',ascending=True);W=520;rh=10.2;T=22;L=88;n=len(d);H=T+n*rh+26;X=lambda v:L+v/90*(W-L-16)
    o=f"<svg viewBox='0 0 {W} {H}' width='100%'>"
    for g in range(0,91,10):o+=f"<line x1='{X(g)}' x2='{X(g)}' y1='{T-6}' y2='{H-20}' stroke='#DCDFE6' stroke-width='.6'/><text x='{X(g)}' y='{H-8}' font-size='7' fill='#5C646E' text-anchor='middle'>{g}%</text>"
    for i,(_,r) in enumerate(d.iterrows()):
        y=T+i*rh+rh/2;hl=r.code=='NL'
        o+=f"<line x1='{X(r.small)}' x2='{X(r.large)}' y1='{y}' y2='{y}' stroke='{'#FF4F17' if hl else '#B9C3F3'}' stroke-width='{2.2 if hl else 1.4}'/>"
        o+=f"<circle cx='{X(r.small)}' cy='{y}' r='3.3' fill='#2742D6'/><circle cx='{X(r.large)}' cy='{y}' r='3.3' fill='#14171A'/>"
        o+=f"<text x='{L-6}' y='{y+2.6}' font-size='7.6' text-anchor='end' fill='{'#FF4F17' if hl else '#14171A'}' font-weight='{800 if hl else 400}'>{e(r.country)}</text>"
    o+=f"<circle cx='{L+4}' cy='9' r='3.3' fill='#2742D6'/><text x='{L+11}' y='11.5' font-size='7.6'>klein (10–49)</text><circle cx='{L+90}' cy='9' r='3.3' fill='#14171A'/><text x='{L+97}' y='11.5' font-size='7.6'>groot (250+)</text></svg>"
    return o
def svg_scatter(P,xr,yr,xt,yt,line=True,colors=None,hl=(),W=520,H=300,lab=True):
    L,Rm,T,Bm=40,14,12,36;X=lambda v:L+(v-xr[0])/(xr[1]-xr[0])*(W-L-Rm);Y=lambda v:H-Bm-(v-yr[0])/(yr[1]-yr[0])*(H-Bm-T)
    o=f"<svg viewBox='0 0 {W} {H}' width='100%'>"
    for gx in np.linspace(xr[0],xr[1],6):o+=f"<line x1='{X(gx)}' x2='{X(gx)}' y1='{T}' y2='{H-Bm}' stroke='#EEF0F4' stroke-width='.6'/><text x='{X(gx)}' y='{H-Bm+11}' font-size='7' fill='#5C646E' text-anchor='middle'>{gx:.0f}</text>"
    for gy in np.linspace(yr[0],yr[1],6):o+=f"<line x1='{L}' x2='{W-Rm}' y1='{Y(gy)}' y2='{Y(gy)}' stroke='#EEF0F4' stroke-width='.6'/><text x='{L-5}' y='{Y(gy)+2.5}' font-size='7' fill='#5C646E' text-anchor='end'>{gy:.0f}</text>"
    o+=f"<text x='{(L+W-Rm)/2}' y='{H-6}' font-size='7.6' text-anchor='middle' fill='#14171A'>{e(xt)}</text><text transform='translate(9 {(T+H-Bm)/2}) rotate(-90)' font-size='7.6' text-anchor='middle'>{e(yt)}</text>"
    if line:
        xs=np.array([p[1] for p in P]);ys=np.array([p[2] for p in P]);b,a=np.polyfit(xs,ys,1);x0,x1=xs.min(),xs.max()
        o+=f"<line x1='{X(x0)}' y1='{Y(a+b*x0)}' x2='{X(x1)}' y2='{Y(a+b*x1)}' stroke='#FF4F17' stroke-width='1.2' stroke-dasharray='4 3'/>"
    for p in P:
        lbl,x,y=p[0],p[1],p[2];col=(colors or {}).get(lbl,'#2742D6');h=lbl in hl
        o+=f"<circle cx='{X(x)}' cy='{Y(y)}' r='{4.6 if h else 3.4}' fill='{'#FF4F17' if h else col}' fill-opacity='.9'/>"
        if lab:o+=f"<text x='{X(x)+5}' y='{Y(y)-4}' font-size='{8 if h else 6.6}' fill='{'#FF4F17' if h else '#14171A'}' font-weight='{800 if h else 400}'>{e(lbl)}</text>"
    return o+"</svg>"
def bars(rows,mx,suf="%",hl=(),w=52):
    return "".join(f"<div class='br'><span class='bl' style='width:{w}mm'>{e(r[0])}</span><span class='bt'><i class='{'y' if i in hl else 'n'}' style='width:{min(r[1]/mx*100,100):.1f}%'></i></span><b>{nl(r[1],0 if float(r[1]).is_integer() else 1)}{suf}</b></div>" for i,r in enumerate(rows))
def dumb2(rows,mx=100):
    o="<svg viewBox='0 0 520 %d' width='100%%'>"%(24+len(rows)*24)
    X=lambda v:130+v/mx*370
    for g in range(0,101,20):o+=f"<line x1='{X(g)}' x2='{X(g)}' y1='14' y2='{12+len(rows)*24}' stroke='#DCDFE6' stroke-width='.6'/><text x='{X(g)}' y='{22+len(rows)*24}' font-size='7' fill='#5C646E' text-anchor='middle'>{g}%</text>"
    for i,(lab,a,b) in enumerate(rows):
        y=26+i*24;o+=f"<line x1='{X(b)}' x2='{X(a)}' y1='{y}' y2='{y}' stroke='#FFE86B' stroke-width='5'/><circle cx='{X(a)}' cy='{y}' r='4.5' fill='#2742D6'/><circle cx='{X(b)}' cy='{y}' r='4.5' fill='#14171A'/><text x='122' y='{y+3}' font-size='8.4' text-anchor='end'>{e(lab)}</text><text x='{X(a)+7}' y='{y-5}' font-size='7.4' fill='#2742D6' font-weight='700'>{a:.0f}%</text><text x='{X(b)-7}' y='{y-5}' font-size='7.4' text-anchor='end' fill='#14171A' font-weight='700'>{b:.0f}%</text>"
    return o+"</svg>"
# ---------- pagina's ----------
EB={};HL={};P=[]
PORTAL="https://www.bedrijfsgeheugen.nl/frisse-blik?utm_source=rapport&utm_medium=pdf&utm_campaign=ai-kloof-2026q4"
CLAIMS={"Tien bevindingen die je niet vaak hoort":("Tien bevindingen, één conclusie: meten wint van gebruiken","meten"),
"Wereld, Europa en Nederland naast elkaar":("Nederland staat bovenaan bij bedrijven, onderaan bij vertrouwen","vertrouwen"),
"De Nederlandse paradox":("Nederland gebruikt AI het meest en gelooft er het minst in","minst"),
"Waarom drie cijfers allemaal kloppen":("Drie cijfers, drie verschillende vragen","verschillende vragen"),
"De kleine bedrijven maken het verschil":("Tussen landen verschilt de kleine ondernemer, niet de grote","kleine"),
"De kloof groeit, in procentpunten":("Wie voorop loopt, loopt verder uit","verder uit"),
"Er is geen vast adoptiepad":("Er is geen vaste route naar AI-volwassenheid","geen vaste route"),
"Van gebruik naar resultaat":("Van 88% gebruik blijft 6% topresultaat over","6%"),
"Hoe AI geld verdient":("AI verdient geld per taak, niet per bedrijf","per taak"),
"Wat AI gaat kosten, en wat niet":("De prijs daalt 10× per jaar, de leercurve niet","leercurve"),
"BI, data en software: kansen en risico’s":("Je data en software zijn je grootste hefboom en je grootste valkuil","hefboom"),
"Waarom AI niet van de grond komt":("AI strandt op mensen, niet op techniek","mensen"),
"Hoe je de mens meeneemt":("Zeven blokkades, zeven eerste acties","zeven eerste acties"),
"Mens, proces, data en techniek":("Vier lagen, en één cultuur die alles bepaalt","cultuur"),
"Risico’s die er echt toe doen":("De grootste risico’s zijn gedragsrisico’s","gedragsrisico’s"),
"Regels en datums":("Regels schuiven op, je A4 met afspraken niet","A4"),
"Kansenkaart voor het mkb":("Begin waar fouten goedkoop zijn en regels duidelijk","goedkoop"),
"Case: inkoopfacturen voorsorteren":("Case: facturen voorsorteren in zeven stappen","zeven stappen"),
"Case: een bedrijfshandleiding in een middag":("Case: je bedrijfshandleiding in een middag","middag")}
BW={"Wereld, Europa en Nederland naast elkaar":('A','27 landen'),"De Nederlandse paradox":('B',''),"Waarom drie cijfers allemaal kloppen":('A','5 sectoren'),
"De kleine bedrijven maken het verschil":('A','n = 27'),"De kloof groeit, in procentpunten":('A','n = 26'),"Er is geen vast adoptiepad":('A','n = 27'),
"Van gebruik naar resultaat":('C','n = 1.719'),"Hoe AI geld verdient":('B','n = 5.179'),"Wat AI gaat kosten, en wat niet":('C',''),"BI, data en software: kansen en risico’s":('C',''),
"Waarom AI niet van de grond komt":('C',''),"Hoe je de mens meeneemt":('O',''),"Mens, proces, data en techniek":('O',''),"Risico’s die er echt toe doen":('O',''),
"Regels en datums":('A',''),"Kansenkaart voor het mkb":('O',''),"Case: inkoopfacturen voorsorteren":('O',''),"Case: een bedrijfshandleiding in een middag":('O','')}
ZET=[0]
TRIAL="https://www.bedrijfsgeheugen.nl/afsluiten?plan=starter&trial=1&code=KLOOF-Q4"
CODE="KLOOF-Q4"
import segno,io
def qrsvg(u,dark='#14171A'):
    b=io.BytesIO();segno.make(u,error='m').save(b,kind='svg',scale=4,border=0,dark=dark,light=None,omitsize=True,xmldecl=False);return b.getvalue().decode()
def fld(name,w=24):return f"<span class='fld' data-f='{name}' style='width:{w}mm'></span>"
def page(eb,hlw,body,h=None,cls=''):
    n=len(P)+1;EB[n]=eb;h0=h
    if h in CLAIMS:h,hlw=CLAIMS[h]
    zet=''
    m=re.search(r"<div class='card[^']*'><h3>(?:Wat je nu doet|Wat je morgenochtend doet)</h3>(.*?)</div>",body,re.S)
    if m:
        body=body.replace(m.group(0),'');ZET[0]+=1
        inner=re.sub(r"</?(p|li|ol|ul)[^>]*>"," ",m.group(1))
        inner=re.sub(r"\s+"," ",inner).strip()
        zet=f"<a class='zet' href='{PORTAL}'><span class='zl'>ZET<b>{ZET[0]}</b></span><span class='zt'>{inner}</span><span class='zp'>Samen met je portaal →</span></a>"
    if h:body=f"<h2>{h.replace(hlw,'<span class=hl>'+hlw+'</span>',1) if hlw and hlw in h else h}</h2>"+body
    cm=re.search(r"Hoofdstuk (\d+)",eb);num=cm.group(1) if cm else '·'
    t,nn=BW.get(h0,('',''))
    meter=''.join(f"<i class='{'on' if t==k else ''}'>{k}</i>" for k in 'ABCDO') if t else ''
    lab=e(eb.split(' · ')[-1])
    rail=f"<div class='rail'><div class='rn'>{num}</div><div class='rt'>{lab}</div><div class='bm'>{('<small>bewijs</small>'+meter+'<small>'+nn+'</small>') if t else ''}</div></div>"
    P.append(f"<div class='p v3 {cls}'><div class='top'><span class='geel'>Bedrijfs<b>geheugen</b></span></div>{rail}<div class='eb'>{e(eb)}</div>{body}{zet}<div class='foot'><span>Bedrijfsgeheugen · bedrijfsgeheugen.nl</span><span>De AI-kloof in het mkb · 2026-Q4 · {n}</span></div></div>")
def find(n,t,b):return f"<div class='find'><div class='stepn'>{n}</div><div><h3>{t}</h3><div class='mini' style='font-size:9.2pt'>{b}</div></div></div>"
def card(t,b,cls=''):return f"<div class='card {cls}'><h3>{t}</h3>{b}</div>"
# 1 VOORBLAD
def kloofkaart(W=520,H=330):
    d=df.sort_values('large',ascending=False).reset_index(drop=True);n=len(d);L=30;R=8;T=26;B=34
    X=lambda i:L+(i+.5)*(W-L-R)/n;Y=lambda v:H-B-v/85*(H-B-T)
    o=f"<svg viewBox='0 0 {W} {H}' width='100%'>"
    for g in (0,20,40,60,80):
        o+=f"<line x1='{L}' x2='{W-R}' y1='{Y(g)}' y2='{Y(g)}' stroke='#2b313a' stroke-width='.7'/><text x='{L-5}' y='{Y(g)+2.6}' font-size='7' fill='#8b93a1' text-anchor='end'>{g}%</text>"
    for i,r in d.iterrows():
        x=X(i);hl=r.code=='NL';col='#FF4F17' if hl else '#FFE86B'
        o+=f"<line x1='{x:.1f}' x2='{x:.1f}' y1='{Y(r.small):.1f}' y2='{Y(r.large):.1f}' stroke='{col}' stroke-width='{5.2 if hl else 3.6}' stroke-linecap='round' opacity='{1 if hl else .78}'/>"
        o+=f"<circle cx='{x:.1f}' cy='{Y(r.small):.1f}' r='{4.2 if hl else 3.2}' fill='#B9C3F3'/><circle cx='{x:.1f}' cy='{Y(r.large):.1f}' r='{4.2 if hl else 3.2}' fill='#FBFAF7'/>"
        o+=f"<text x='{x:.1f}' y='{H-B+11}' font-size='6.4' fill='{'#FF4F17' if hl else '#8b93a1'}' text-anchor='middle' font-weight='{800 if hl else 400}'>{r.code}</text>"
        if hl:o+=f"<text x='{x+8:.1f}' y='{Y(r.large)-8:.1f}' font-size='9.5' font-family='Bricolage Grotesque' font-weight='800' fill='#FF4F17'>Nederland</text><text x='{x+8:.1f}' y='{Y(r.small)+14:.1f}' font-size='7.4' fill='#FF4F17'>klein {NL.small:.0f}% · groot {NL.large:.0f}%</text>"
    o+=f"<circle cx='{L+6}' cy='9' r='3.4' fill='#FBFAF7'/><text x='{L+14}' y='12' font-size='7.6' fill='#DCDFE6'>groot bedrijf (250+)</text><circle cx='{L+112}' cy='9' r='3.4' fill='#B9C3F3'/><text x='{L+120}' y='12' font-size='7.6' fill='#DCDFE6'>klein bedrijf (10–49)</text><line x1='{L+224}' x2='{L+240}' y1='9' y2='9' stroke='#FFE86B' stroke-width='3.6' stroke-linecap='round'/><text x='{L+246}' y='12' font-size='7.6' fill='#DCDFE6'>de kloof</text></svg>"
    return o
def brug(W=520,H=230):
    o=f"<svg viewBox='0 0 {W} {H}' width='100%'><defs><pattern id='hb' width='6' height='6' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'><line x1='0' y1='0' x2='0' y2='6' stroke='#FFE86B' stroke-width='1.2'/></pattern></defs>"
    o+=f"<rect x='150' y='118' width='220' height='100' fill='url(#hb)' opacity='.32'/><rect x='0' y='118' width='150' height='100' rx='4' fill='#B9C3F3'/><rect x='370' y='118' width='150' height='100' rx='4' fill='#FFE86B'/>"
    o+="<text x='12' y='150' font-size='11' font-weight='800' font-family='Bricolage Grotesque' fill='#14171A'>Nu</text><text x='12' y='172' font-size='26' font-weight='800' font-family='Bricolage Grotesque' fill='#14171A'>17%</text><text x='12' y='190' font-size='7.6' fill='#14171A'>AI echt ingebouwd (CBS)</text>"
    o+="<text x='382' y='150' font-size='11' font-weight='800' font-family='Bricolage Grotesque' fill='#14171A'>Voorloper</text><text x='382' y='172' font-size='26' font-weight='800' font-family='Bricolage Grotesque' fill='#14171A'>70%</text><text x='382' y='190' font-size='7.6' fill='#14171A'>zegt AI te gebruiken (Exact)</text>"
    st=["Regels","Taak","Meet","Test","Mens","Leer","Breid uit"]
    import math
    for i,t in enumerate(st):
        x=170+i*(180/6);y=108-math.sin(math.pi*i/6)*66
        o+=f"<circle cx='{x:.1f}' cy='{y:.1f}' r='13' fill='#FBFAF7'/><text x='{x:.1f}' y='{y+4:.1f}' font-size='11' font-weight='800' font-family='Bricolage Grotesque' text-anchor='middle' fill='#14171A'>{i+1}</text><text x='{x:.1f}' y='{y-18:.1f}' font-size='7.6' text-anchor='middle' fill='#DCDFE6'>{t}</text>"
    return o+"</svg>"
P.append(f"""<div class='p cover'><div class='top'><span class='geel'>Bedrijfs<b>geheugen</b></span><span style='margin-left:auto;font-size:8pt;letter-spacing:.16em;color:#8b93a1'>EDITIE 2026-Q4</span></div>
<div class='eb' style='margin-top:12mm'>Onderzoeksrapport · Wereld · Europa · Nederland</div>
<div class='big' style='font-size:60pt'>De AI-<span style='background:linear-gradient(transparent 55%,#FFE86B 55%,#FFE86B 92%,transparent 92%);color:var(--p)'>kloof</span><br>in het mkb</div>
<p class='lead' style='color:#DCDFE6;margin-top:5mm;font-size:12pt;max-width:150mm'>Waarom kleine bedrijven in het ene Europese land ruim negen keer zo vaak AI gebruiken als in het andere, wat dat kost, en wat je er maandag aan doet.</p>
<div style='margin-top:9mm'>{kloofkaart()}</div>
<p style='margin-top:3mm;font-size:8.4pt;color:#8b93a1;max-width:150mm'>Elke stok is één EU-land. De stok loopt van het AI-gebruik van kleine bedrijven (onder) naar grote bedrijven (boven). Hoe langer de stok, hoe groter de kloof. Bron: Eurostat 2025.</p>
<div style='position:absolute;left:16mm;right:16mm;bottom:22mm;display:flex;gap:9mm;color:#DCDFE6;font-size:9pt;border-top:1px solid #3a4150;padding-top:4mm'><span><b style='color:#fff;font-size:15pt;font-family:Bric'>27</b><br>bronnen gelezen</span><span><b style='color:#fff;font-size:15pt;font-family:Bric'>145</b><br>feiten in database</span><span><b style='color:#fff;font-size:15pt;font-family:Bric'>27</b><br>EU-landen geanalyseerd</span><span><b style='color:#fff;font-size:15pt;font-family:Bric'>57</b><br>analyses opgeslagen</span></div>
<div class='foot' style='color:#8b93a1;border-top:none'><span>Bedrijfsgeheugen · bedrijfsgeheugen.nl</span><span>AI-gedreven. Menselijk gericht.</span></div></div>""")

# 2 INHOUD + LEESWIJZER
page("Voor je begint","leest",f"""<p class='lead' style='font-size:11pt'>Dit rapport is geschreven voor ondernemers die willen beslissen, niet voor mensen die willen bladeren. Elke pagina eindigt met iets wat je kunt doen.</p>
<div class='grid2'><div class='card'><h3>Inhoud</h3><table class='mini' style='font-size:8.8pt'>
<tr><td>4</td><td>Wereld, Europa, Nederland naast elkaar</td></tr><tr><td>5</td><td>De Nederlandse paradox</td></tr><tr><td>6</td><td>Waarom drie cijfers allemaal kloppen</td></tr><tr><td>7–9</td><td>Waar landen verschillen (analyse)</td></tr>
<tr><td>10–12</td><td>Waarde en kosten: waar verdient AI geld</td></tr><tr><td>13</td><td>BI, data en software</td></tr><tr><td>14–16</td><td>Mens, proces, cultuur</td></tr><tr><td>17–18</td><td>Risico’s en regels</td></tr><tr><td>19</td><td>Kansenkaart</td></tr><tr><td>20–21</td><td>Twee cases, stap voor stap</td></tr><tr><td>22–25</td><td>Zelftest, 90 dagen, meetblad, portaal</td></tr><tr><td>26–31</td><td>Methode, bronnen, data, bijlage</td></tr></table></div>
<div><div class='card'><h3>Zo lees je de labels</h3><p class='mini'><span class='lab lf'>Feit</span> gemeten en herleidbaar naar een bron.<br><span class='lab lv'>Verband</span> onze eigen analyse op de data. Zegt niets over oorzaak.<br><span class='lab lp'>Voorspelling</span> een verwachting van een derde.<br><span class='lab la'>Ons oordeel</span> onze eigen inschatting.</p></div>
<div class='card'><h3>Bewijskracht</h3><p class='mini'>{tier('A')} officiële statistiek<br>{tier('B')} wetenschappelijk of grote enquête met methode<br>{tier('C')} adviesbureau of leverancier, methode deels bekend<br>{tier('D')} leverancierscase, niet geverifieerd</p></div></div></div>
{card('Zo is dit gemaakt',"<p class='mini'>Alle cijfers staan met bron, jaar en populatie in een database (27 bronnen, 145 feiten, 27 landen). De analyses zijn daaroverheen gedraaid met bootstrap-intervallen, zodat je ziet hoe zeker iets is. Waar het aantal landen klein is (maximaal 27) zeggen we dat erbij. Een verband is nooit een bewijs van oorzaak.</p>",'cr')}
{card('Eén ding vooraf',"<p class='mini'>Bronnen meten verschillende dingen: bedrijven of personen, 2+ of 10+ medewerkers, gebruik of inzet. We tellen cijfers daarom nooit bij elkaar op en zetten ze alleen naast elkaar waar dat eerlijk kan.</p>")}""",h="Hoe je dit rapport leest")
# 3 BEVINDINGEN
F10=[("Drie antwoorden, één land",f"CBS meldt 17% (2+ medewerkers), Eurostat 33,2% (10+) en Exact 70% (zelfrapportage). Het zijn drie lagen: bedrijfsinzet, bedrijfsinzet bij grotere bedrijven en persoonlijk gebruik. {tier('A')}"),
("Nederland: voorop bij bedrijven, sceptisch in de zaal",f"Rang {rank_tot} van 27 in de EU, maar slechts 36% ziet AI als meer nuttig dan schadelijk. KPMG meldt het laagste regelmatig gebruik van 47 landen. {tier('B')}"),
("Het verschil tussen landen zit bij de kleine bedrijven",f"Tussen landen verschilt het gebruik door kleine bedrijven {nl(sm_x,1)} keer (laagste tot hoogste), bij grote {nl(lg_x,1)} keer. <span class='lab lv'>Verband</span>"),
("De kloof groeit",f"De top-10 landen groeiden {nl(top10_gr)} procentpunt, de onderste 10 {nl(bot10_gr)}. Relatief groeit iedereen ongeveer even snel. <span class='lab lv'>Verband</span>"),
("Er is geen vast adoptiepad",f"Landen met meer AI gebruiken het niet voor andere doelen (alle verbanden zijn niet aantoonbaar). Begin dus waar jouw pijn zit. <span class='lab lv'>Verband</span>"),
("Mensen gebruiken AI, bedrijven niet automatisch",f"Landen waar mensen vaak AI gebruiken zijn niet de landen waar bedrijven het inzetten (rho {nl(rho_ind['value'],2)}, niet aantoonbaar). <span class='lab lv'>Verband</span>"),
("Gebruik is geen resultaat",f"88% gebruikt AI, 44% schaalt, 37% ziet effect op de winst, 6% haalt veel. BCG: 60% ziet nauwelijks waarde. {tier('C')}"),
("Gemeten winst is kleiner dan beloofd",f"CFO’s melden 1,8% productiviteitswinst; de omzet laat 0,6% zien. Drie keer zo weinig. {tier('B')}"),
("Het geld zit in werkprocessen en mensen",f"High performers herontwierpen werkprocessen in 75% van de gevallen, de rest in 25%. Een steunende manager: 2,1 keer vaker gebruik. {tier('C')}"),
("Geld is niet de rem, kennis wel",f"De prijs van AI daalt ongeveer 10 keer per jaar. 70% van de bedrijven noemt gebrek aan kennis, 38% de kosten. {tier('C')}")]
page("Samenvatting","bevindingen",f"<div class='g2'><div>{''.join(find(i+1,t,b) for i,(t,b) in enumerate(F10[:5]))}</div><div>{''.join(find(i+6,t,b) for i,(t,b) in enumerate(F10[5:]))}</div></div>"+card("Wat je hiermee doet","<p class='mini' style='font-size:9.5pt'>Kies één taak die elke week terugkomt. Leg vast hoe je die nu doet. Laat AI de eerste versie maken, laat een mens beslissen en meet na 30 dagen. De rest van dit rapport laat zien waarom dat werkt en waar het misgaat.</p>",'cr'),h="Tien bevindingen die je niet vaak hoort")
# 4 WERELD EU NL
rows=[("Bedrijven die AI inzetten","Wereld: 78% (2024) tot bijna 90% (2026), vooral grote bedrijven"+sup('S10','S06'),"EU: 20,0% (10+)"+sup('S01'),"NL: 33,2% (10+), 17% (2+)"+sup('S01','S02')),
("Bedrijfsbreed opgeschaald","44%, grote bedrijven 54%, kleinere circa 33%"+sup('S06'),"geen EU-cijfer gevonden","geen NL-cijfer gevonden"),
("Mensen die gen-AI gebruiken",f"{nl(fv('personen 15-64 die generatieve AI gebruiken','Wereld','2026-Q2'),1)}% (15–64)"+sup('S11'),f"32,7% (laatste 3 maanden)"+sup('S01'),f"{nl(fv('personen 15-64 die generatieve AI gebruiken','NL','2026-Q2'),1)}% (15–64), rang 9"+sup('S11')),
("Kleine bedrijven (10–49)","—","17,0%"+sup('S01'),"28,8%, rang "+str(rank_small)+sup('S01')),
("Grote bedrijven (250+)","—","55,0%"+sup('S01'),"67,6%"+sup('S01')),
("AI als meer nuttig dan schadelijk","China 83%, VS 39%"+sup('S10'),"—","36%, laagste groep"+sup('S10')),
("Data-analyse in bedrijven","—","40%"+sup('S22'),"56%"+sup('S22')),
("Basis digitale vaardigheden","—","60%"+sup('S22'),"84%"+sup('S22')),
("Private AI-investeringen (2024)","VS 109,1 mld, China 9,3 mld"+sup('S10'),"VK 4,5 mld"+sup('S10'),"—")]
tbl="<table><tr><th>Wat</th><th>Wereld</th><th>Europa</th><th>Nederland</th></tr>"+"".join(f"<tr><td><b>{a}</b></td><td>{b}</td><td>{c_}</td><td class='nl'>{d_}</td></tr>" for a,b,c_,d_ in rows)+"</table>"
page("Hoofdstuk 1 · De vergelijking","naast",f"<p>Eén tabel, zodat je ziet waar Nederland staat. Een streepje betekent dat we geen betrouwbaar cijfer vonden.</p>{tbl}{card('Wat valt op',f'<ul class=tight><li>Nederland scoort boven het EU-gemiddelde op bijna alles wat met werken te maken heeft: bedrijven, digitale vaardigheden, data-analyse.</li><li>Maar het vertrouwen is laag. Op de kernvraag “doet AI meer goed dan kwaad” staat Nederland onderaan.</li><li>De VS investeert ongeveer 24 keer zoveel privaat geld in AI als het VK, het hoogste Europese cijfer dat we hebben ({nl(109.1/4.5,0)}×).</li></ul>')}{src('S01','S06','S10','S11','S22')}",h="Wereld, Europa en Nederland naast elkaar")
# 5 PARADOX
page("Hoofdstuk 2 · De paradox","paradox",f"""<div class='grid2'>{card("Wat Nederland goed doet",f"<ul class=tight><li>Rang {rank_tot} van 27 EU-landen bij bedrijven (33,2%){sup('S01')}</li><li>Rang 9 wereldwijd bij personen (43,5%){sup('S11')}</li><li>84% heeft basis digitale vaardigheden, EU 60%{sup('S22')}</li><li>Kleine bedrijven rang {rank_small} van 27{sup('S01')}</li></ul>")}
{card("Waar het wringt",f"<ul class=tight><li>36% ziet AI als meer nuttig dan schadelijk, de laagste groep{sup('S10')}</li><li>Laagste regelmatig gebruik van 47 landen (43%, KPMG){sup('S09')}</li><li>48% vindt het spannend medewerkers met bedrijfsdata in AI te laten werken{sup('S26')}</li><li>47% weet niet goed hoe AI te gebruiken{sup('S04')}</li></ul>",'cr')}</div>
{card("Waarom dit ertoe doet","<p>Een land dat veel gebruikt maar weinig vertrouwt, heeft een bijzonder risico: gebruik zonder regels. Mensen proberen AI uit, maar organisaties leggen niet vast wat mag. De Autoriteit Persoonsgegevens meldt tientallen datalekken waarbij medewerkers bedrijfsgegevens in openbare chatbots zetten"+sup('S24')+". KPMG laat zien dat bijna de helft van de medewerkers wereldwijd AI gebruikt op een manier die tegen beleid ingaat, en dat maar twee op vijf zeggen dat er beleid is"+sup('S09')+".</p>")}
{card("Ons oordeel","<p><span class='lab la'>Ons oordeel</span> De kans in Nederland is niet meer mensen aan het gebruiken krijgen. Die kans is: gebruik veilig, zichtbaar en meetbaar maken. Wie dat regelt, gebruikt AI sneller en met minder risico dan het gemiddelde bedrijf.</p>",'lbg')}
{card("Wat je nu doet","<p class='mini' style='font-size:9.5pt'>Schrijf op één A4: welke gegevens mogen in AI-hulpmiddelen en welke nooit. Dat is precies wat de Autoriteit Persoonsgegevens adviseert"+sup('S24')+". Deel het met je team deze week.</p>",'cr')}{src('S01','S04','S09','S10','S11','S24','S26')}""",h="De Nederlandse paradox")
# 6 DRIE CIJFERS
mm=pd.read_sql("select * from sector_ai where exact_2026 is not null and cbs_2025 is not null and sector!='Accountancy'",c)
mm['kl']=mm.exact_2026/mm.cbs_2025;mm=mm.sort_values('kl',ascending=False)
def dumb3(rows):
    o="<svg viewBox='0 0 520 %d' width='100%%'>"%(40+len(rows)*19);X=lambda v:130+v/100*370
    for g in range(0,101,20):o+=f"<line x1='{X(g)}' x2='{X(g)}' y1='28' y2='{30+len(rows)*19}' stroke='#DCDFE6' stroke-width='.6'/><text x='{X(g)}' y='{40+len(rows)*19}' font-size='7' fill='#5C646E' text-anchor='middle'>{g}%</text>"
    o+="<circle cx='134' cy='10' r='4.5' fill='#2742D6'/><text x='142' y='13' font-size='8'>zegt AI te gebruiken (Exact, ondernemers)</text><circle cx='330' cy='10' r='4.5' fill='#14171A'/><text x='338' y='13' font-size='8'>heeft AI ingebouwd (CBS, gemeten)</text>"
    for i,(lab,a,b) in enumerate(rows):
        y=44+i*19;o+=f"<line x1='{X(a)}' x2='{X(b)}' y1='{y}' y2='{y}' stroke='#FFE86B' stroke-width='6'/><circle cx='{X(a)}' cy='{y}' r='4.5' fill='#14171A'/><circle cx='{X(b)}' cy='{y}' r='4.5' fill='#2742D6'/><text x='122' y='{y+3}' font-size='8.4' text-anchor='end'>{e(lab)}</text><text x='{X(a)-7}' y='{y-5}' font-size='7.4' text-anchor='end' font-weight='700'>{a:.0f}%</text><text x='{X(b)+7}' y='{y+3}' font-size='7.4' fill='#2742D6' font-weight='700'>{b:.0f}%</text>"
    return o+"</svg>"
def q3(n,ttl,vraag,wie,bet,lab):
    return f"<div class='card' style='flex:1;margin:0'><div class='kpi' style='font-size:34pt'>{n}</div><h3 style='font-size:10.5pt'>{ttl}</h3><p class='mini' style='font-size:8.8pt'><b>De vraag:</b> {vraag}</p><p class='mini' style='font-size:8.8pt'><b>Wie telt mee:</b> {wie}</p><p class='mini' style='font-size:8.8pt'><b>Betekent:</b> {bet}</p><span class='lab {lab}'>{'Feit' if lab=='lf' else 'Zelfrapportage'}</span></div>"
page("Hoofdstuk 3 · Meten is weten","kloppen",f"""<p class='lead' style='font-size:10.5pt'>Stel je vraagt hoeveel mensen sporten. Wie antwoordt “ik heb een abonnement en ga elke week” krijgt een heel ander cijfer dan wie antwoordt “ik loop wel eens een rondje”. Beide kloppen. Zo is het ook met AI.</p>
<div style='display:flex;gap:3mm;margin:3mm 0'>{q3('17%','Echt ingebouwd','Gebruikt uw bedrijf AI in het werk, volgens een vaste definitie van het CBS?','alle bedrijven vanaf 2 medewerkers (ook de kleinste)',f'AI zit in het werk. Dit is de strengste meting.{sup('S02')}','lf')}{q3('33%','Idem, grotere bedrijven','Dezelfde vraag, maar alleen aan bedrijven vanaf 10 medewerkers.','bedrijven vanaf 10 medewerkers (grotere bedrijven gebruiken meer AI)',f'Hoger omdat de kleinste bedrijven niet meetellen.{sup('S01')}','lf')}{q3('70%','Zegt AI te gebruiken','Gebruikt u AI?, een enquête onder 1.719 mkb-ondernemers.','ondernemers die zelf antwoorden, ook als ze alleen af en toe een chattool openen',f'Zegt wat mensen doen, niet wat het bedrijf heeft ingebouwd.{sup('S04')}','lv')}</div>
<h3>Waar zit het verschil? Geel is het gat, per sector</h3>
{dumb3([(r.sector.replace('Specialistische zakelijke diensten','Zakelijke diensten'),r.cbs_2025,r.exact_2026) for _,r in mm.iterrows()][::-1])}
<div class='g2'>{card('Voorbeeld: de bouw',f"<p class='mini'>Van de bouwondernemers zegt 69% AI te gebruiken. Het CBS telt 7% bouwbedrijven dat AI heeft ingebouwd. Dat is {nl(mm[mm.sector=='Bouwnijverheid'].kl.iloc[0],0)} keer zoveel. Veel ondernemers proberen een chattool, weinig bedrijven hebben er een vaste werkwijze van gemaakt. <span class='lab la'>Ons oordeel</span></p>")}{card('Let op',"<p class='mini'>De groepen en jaren verschillen (Exact: 2 tot 250 medewerkers, 2026; CBS: vanaf 2 medewerkers, 2025, voorlopig). Het patroon klopt, de exacte factor niet. Het gaat om vijf sectoren.</p>",'cr')}</div>
{card("Wat je nu doet",f"<p class='mini' style='font-size:9.5pt'>Vraag je niet “gebruiken wij AI?” maar “zit AI in een vaste stap van ons werk?” Zo niet, dan zit je bij de meeste bedrijven. Er is niets verloren.</p>",'lbg')}{src('S01','S02','S04')}""",h="Waarom drie cijfers allemaal kloppen")
# 7 DUMBBELL
page("Hoofdstuk 4 · Landen vergeleken","groter",f"""<p>Gebruik van AI door kleine (10–49) en grote (250+) bedrijven, per EU-land, 2025. Gesorteerd op grote bedrijven.</p>{svg_dumbbell(df)}{src('S01')}
<div class='g2'>{card("Wat de analyse laat zien",f"<ul class=tight style='font-size:9pt'><li>Grote bedrijven: van 21% (Roemenië) tot 79% (Finland).</li><li>Kleine bedrijven verschillen veel meer: van 4% (Roemenië) tot 38% (Denemarken), een factor {nl(sm_x,1)}. Bij grote bedrijven is dat {nl(lg_x,1)}.</li><li>Nederland: kleine bedrijven 28,8% (rang {rank_small}), grote 67,6%. De kleine bedrijven halen {nl(NL.small/NL.large*100,0)}% van het niveau van de grote, rang {rank_ratio}, EU-gemiddelde {nl(A['EU-gemiddelde ratio klein/groot (ongewogen)']['value']*100,0)}%.</li></ul><span class='lab lv'>Verband</span>")}
{card("Hoe zeker is dit?","<p class='mini'>27 landen, officiële statistiek (Eurostat). Het totaal hangt bijna één-op-één samen met het aandeel van kleine bedrijven (rho 1,00). Dat is deels rekenkundig: kleine bedrijven zijn de meeste bedrijven. De stelling “verschil zit bij de kleine” gaat daarom over de spreiding per grootteklasse, niet over de correlatie. Nederland heeft een reeksbreuk, dus kijk naar de orde van grootte.</p>",'cr')}</div>
{card("Wat je nu doet","<p class='mini' style='font-size:9.5pt'>Ben je klein, kijk dan niet naar wat grote bedrijven doen. Zij hebben afdelingen, data en budget. Kijk naar een kleiner bedrijf dat één taak automatiseerde en kopieer die stap.</p>",'lbg')}""",h="De kleine bedrijven maken het verschil")
# 8 KLOOF GROEIT
g=df[df.code!='NL'];pts=[(r.country,r.adopt_2024,r.adopt_2025-r.adopt_2024) for _,r in g.iterrows()]
page("Hoofdstuk 5 · Beweging","groeit",f"""<p>Elk punt is een EU-land (zonder Nederland, door de reeksbreuk). Horizontaal het niveau in 2024, verticaal de groei in procentpunt in 2025.</p>{svg_scatter(pts,(0,30),(0,16),'Aandeel bedrijven met AI in 2024 (%)','Groei 2024→2025 (procentpunt)',H=240)}{src('S01','S03')}
<div class='g2'>{card("Wat de data laat zien",f"<ul class=tight style='font-size:9pt'><li>Wie voorop liep, groeide harder: de top-10 +{nl(top10_gr)} procentpunt, de onderste 10 +{nl(bot10_gr)}.</li><li>Het verband tussen niveau en groei: rho {nl(rho_gr['value'],2)} (95%-interval {nl(rho_gr['ci_low'],2)} tot {nl(rho_gr['ci_high'],2)}), duidelijk positief.</li><li>De kloof tussen top-10 en onderste 10 ging van {nl(gap24)} naar {nl(gap25)} procentpunt.</li><li>Maar in verhouding groeide iedereen ongeveer even snel ({nl(rel_top,2)}× top, {nl(rel_bot,2)}× onderkant; geen verband, rho {nl(A['relatieve groei vs niveau 2024']['value'],2)}).</li></ul><span class='lab lv'>Verband</span>")}
{card("Hetzelfde patroon per sector",f"<p class='mini'>Ook tussen sectoren: wie in 2023 voorop liep, won meer procentpunten tot 2025 (rho {nl(rho_sec['value'],2)}, interval {nl(rho_sec['ci_low'],2)} tot {nl(rho_sec['ci_high'],2)}, 12 sectoren). Informatie en communicatie groeide +26 procentpunt, vervoer +0.{sup('S02')} <span class='lab lv'>Verband</span></p>",'cr')}</div>
{card("Wat dit voor jou betekent","<p class='mini' style='font-size:9.5pt'>Dit is geen wedstrijd waarin achterblijvers vanzelf inhalen. Kennis en gewoontes stapelen op: wie al werkt met AI, leert sneller. Het gevaar van wachten is dus niet dat AI duurder wordt (het wordt goedkoper), maar dat de leercurve zich tegen je opstapelt.</p>",'lbg')}
<p class='note'>Voorbehoud: de 2024-waarden komen uit de CBS-landentabel (Eurostat), de 2025-waarden uit Eurostat 2026; ze sluiten op elkaar aan (Denemarken 27,6 en 27,5 afgeleid). Twee meetmomenten, dus geen trend.</p>""",h="De kloof groeit, in procentpunten")
# 9 ADOPTIEPAD
d3=df.dropna(subset=['mkt','admin']).copy()
clm={'BG':1,'CZ':1,'EE':1,'CY':1,'LV':1,'LT':1,'PL':1,'PT':1,'RO':1,'EL':2,'SI':2}
colors={r.country:('#FF4F17' if clm.get(r.code)==1 else '#FFB020' if clm.get(r.code)==2 else '#2742D6') for _,r in d3.iterrows()}
pts=[(r.country,r.mkt,r.adopt_2025) for _,r in d3.iterrows()]
page("Hoofdstuk 6 · Adoptiepad","adoptiepad",f"""<p>Waarvoor zetten landen AI in? Horizontaal het aandeel gebruikers dat AI voor marketing en verkoop inzet, verticaal het totale gebruik. Oranje: marketing-gedreven cluster, geel: beveiligingsgedreven, blauw: de rest.</p>{svg_scatter(pts,(15,65),(0,45),'AI voor marketing/verkoop (% van gebruikers)','Bedrijven met AI (%)',line=False,colors=colors,hl=('Nederland',),H=230)}{src('S01')}
<div class='g2'>{card("De uitkomst die niemand verwacht",f"<p class='mini'>Er is <b>geen aantoonbaar verband</b> tussen het gebruiksdoel en het totale gebruik. Alle zeven doelen: de intervallen omvatten nul (marketing rho {nl(A['totaal vs aandeel marketing/verkoop']['value'],2)}, boekhouding {nl(A['totaal vs aandeel boekhouding/financieel']['value'],2)}). Er is dus geen vaste route waarlangs landen volwassen worden. <span class='lab lv'>Verband</span></p>")}
{card("Wat er wel zichtbaar is",f"<p class='mini'>Een cluster van 9 landen (vooral Oost-Europa, Baltische staten en Portugal) is marketing-gedreven (gemiddeld 46% voor marketing) en heeft lage adoptie (13%). Het cluster met Nederland (15 landen) zit op 26%. Dit is een verkennende clustering, geen bewijs. <span class='lab lv'>Verband</span></p>",'cr')}</div>
{card("Het Nederlandse profiel",f"<p class='mini'>Nederland ligt bij administratie en management ({nl(NL.admin)}%, {nl(A['NL z-score admin']['value'],1)} standaarddeviatie boven het gemiddelde) en R&D ({nl(NL.rd)}%) hoog. Bij marketing zit Nederland op het gemiddelde ({nl(NL.mkt)}%). Nederlandse bedrijven gebruiken AI dus relatief vaak voor het interne werk. <span class='lab lv'>Verband</span></p>",'lbg')}
{card("Wat je nu doet","<p class='mini' style='font-size:9.5pt'>Kopieer geen route. Kies de taak die jou de meeste tijd kost, niet de taak waar anderen mee begonnen zijn. Dat is statistisch even goed als welke andere startplek ook.</p>",'cr')}""",h="Er is geen vast adoptiepad")
# 10 WAARDE FUNNEL
fun=[("Gebruikt AI regelmatig",88),("Schaalt bedrijfsbreed",44),("Ziet effect op winst (EBIT)",37),("High performer (≥5% van winst)",6)]
page("Hoofdstuk 7 · Waarde","waarde",f"""<p>De trechter van gebruik naar resultaat, wereldwijd, 2026 (McKinsey, 1.719 deelnemers, 97 landen, vooral grote bedrijven).</p>{bars(fun,100,hl=(3,),w=62)}{src('S06')}
<div class='grid3'>{card("5%","<p class='mini'>van de bedrijven is “future-built” en haalt vijf keer meer omzetgroei en drie keer meer kostenreductie dan de rest. 35% schaalt, 60% ziet nauwelijks waarde."+sup('S07')+"</p>",'lbg')}{card("75% tegenover 25%","<p class='mini'>van de high performers herontwierp werkprocessen fundamenteel, tegen ongeveer een kwart van de rest. Vorig jaar was dat 55%."+sup('S06')+"</p>",'lbg')}{card("2×","<p class='mini'>vaker senior leiderschapssteun en vaste meting van de impact bij high performers."+sup('S06')+"</p>",'lbg')}</div>
{card("De bewezen verschillen tussen winnen en verliezen",f"<ul class=tight style='font-size:9.2pt'><li><b>Herontwerp</b> van het werk, niet een tool er bovenop ({tier('C')}).</li><li><b>Meten</b> van het effect in vaste cijfers.</li><li><b>Leiderschap</b> dat het zelf gebruikt en erover praat.</li><li><b>Geld</b>: high performers besteden meer dan 15% van het ICT-budget aan AI.</li></ul>",'cr')}
<div class='note'>Let op: dit zijn wereldwijde cijfers en de steekproef is zwaar vertegenwoordigd door grote bedrijven. 36% van de deelnemers werkt bij een bedrijf met meer dan $1 miljard omzet. Voor het mkb geldt dezelfde richting, niet dezelfde getallen.</div>
{card("Wat je nu doet","<p class='mini' style='font-size:9.5pt'>Schrijf bij je eerste taak één meetgetal op: minuten per stuk, fouten per honderd of doorlooptijd in dagen. Zonder getal ben je voor altijd in de groep “gebruikt het, ziet het niet”.</p>",'lbg')}""",h="Van gebruik naar resultaat")
# 11 HOE VERDIENT AI GELD
hv=[("Klantenservice, gemiddeld",14),("Klantenservice, beginners",34)]
page("Hoofdstuk 8 · Verdienmodellen","verdient",f"""<div class='grid2'>{card("Waar AI kosten bespaart",f"<p class='mini'>Kostenreductie wordt het vaakst gemeld in <b>supply chain, serviceprocessen en productie</b>{sup('S06')}. Voorbeelden: planning, voorraad, storingen, klantvragen afhandelen.</p>")}{card("Waar AI omzet oplevert",f"<p class='mini'>Omzetwinst wordt het vaakst gemeld in <b>marketing en sales, productontwikkeling en software</b>{sup('S06')}. Voorbeelden: sneller offreren, betere opvolging, sneller bouwen.</p>",'cr')}</div>
<h3>Productiviteit: wat er echt gemeten is</h3>{bars(hv,40,w=48)}<p class='note'>Meer opgeloste vragen per uur, 5.179 klantenservicemedewerkers. Beginners profiteren het meest, ervaren medewerkers nauwelijks.{sup('S12')} {tier('B')}</p>
<h3>De hypekloof <span class='lab lv'>Verband</span></h3>{bars([("Gerapporteerd door CFO’s (2025)",1.8),("Omzet-geïmpliceerd (2025)",0.6),("Gerapporteerd verwacht 2026",3.0),("Omzet-geïmpliceerd 2026",1.8)],3.2,w=62)}<p class='note'>Productiviteitswinst door AI in %, Amerikaanse bedrijven (circa 750 CFO’s). Wat bedrijven zeggen te winnen is drie keer zo groot als wat de omzet laat zien. In 2026 verwacht men 1,7 keer.{sup('S13')} {tier('B')}</p>
{card("Rabobank: waar de winst zit per sector",f"<p class='mini'>Verwacht: informatie en communicatie groeit 3,6% per jaar tegen 1,3% voor de economie, door AI en krapte. Specialistische zakelijke diensten: productiviteitswinst, maar ook risico voor bureaus (vertalen, reclame) waarvan klanten het werk zelf met AI doen. Bouw: ruim een op de vier noemt personeelsgebrek de grootste rem.{sup('S20')} <span class='lab lp'>Voorspelling</span></p>")}
{card("Wat dit betekent",f"<p class='mini' style='font-size:9.5pt'>Reken niet op een percentage dat je ergens leest. Reken op wat jij meet. Realistisch, volgens de CFO-cijfers: een bedrijfsbrede winst van een paar procent in jaar één, meer in het tweede jaar als werk herontworpen is. Taak-niveau kan veel hoger liggen, zoals bij klantenservice. <span class='lab la'>Ons oordeel</span></p>",'lbg')}""",h="Hoe AI geld verdient")
# 12 KOSTEN
page("Hoofdstuk 9 · Kosten","kosten",f"""<div class='grid3'>{card("10× per jaar",f"<p class='mini'>daalt de prijs van een gelijkwaardig taalmodel (a16z, 2021–2024). GPT-3-niveau kostte $60 per miljoen tokens, nu $0,06.{sup('S14')} {tier('C')}</p>",'lbg')}{card("280×",f"<p class='mini'>goedkoper werd een systeem op GPT-3.5-niveau tussen november 2022 en oktober 2024.{sup('S10')} {tier('B')}</p>",'lbg')}{card("30% per jaar",f"<p class='mini'>dalen hardwarekosten, de energie-efficiëntie verbetert 40% per jaar.{sup('S10')}</p>",'lbg')}</div>
<h3>Wat dat betekent voor jou</h3>
<div class='find'><div class='stepn'>1</div><div><h3>Wachten loont voor de prijs, niet voor de kennis</h3><div class='mini' style='font-size:9.2pt'>De techniek wordt goedkoper. Maar 70,3% van de EU-bedrijven noemt gebrek aan kennis als reden, tegen 38,4% de kosten.{sup('S01')} Wie nu leert, heeft die kennis straks nodig bij goedkope AI.</div></div></div>
<div class='find'><div class='stepn'>2</div><div><h3>De rekening komt ergens anders</h3><div class='mini' style='font-size:9.2pt'>Ongeveer 20% van de organisaties zegt dat AI-bedrijfskosten (tokens) hun gebruik beperken.{sup('S06')} Met agenten die veel doen stijgt het verbruik. Zet een maandplafond.</div></div></div>
<div class='find'><div class='stepn'>3</div><div><h3>Klein begint klein</h3><div class='mini' style='font-size:9.2pt'>Een klein Amerikaans bedrijf verwacht in 2026 een mediaan van $12.500 aan AI-uitgaven, een groot bedrijf $300.000. Kleine bedrijven geven per medewerker meer uit en gebruiken meer lopende kosten dan investeringen.{sup('S13')}</div></div></div>
<div class='find'><div class='stepn'>4</div><div><h3>Bouwen of kopen verandert</h3><div class='mini' style='font-size:9.2pt'>32% van de organisaties besloot software niet te kopen omdat ze het zelf konden bouwen met AI-codeerhulpen. Bij high performers bijna de helft.{sup('S06')} Voor leveranciers is dit een risico, voor jou een kans, met onderhoud als verborgen kostenpost.</div></div></div>
{card("Rekenvoorbeeld: wat kost een uur wachten? <span class='chip'>fictief</span>","<p class='mini'>Stel: 8 kantoormedewerkers besteden elk 4 uur per week aan terugkerend werk dat AI voorsorteert. Als dat 40% sneller gaat: 8 × 4 × 40% = 12,8 uur per week, circa 590 uur per jaar. Tegen €50 per uur is dat ruim €29.000 aan capaciteit. Vul je eigen getallen in: medewerkers × uren × percentage × uurtarief.</p>",'lbg')}
{card("Wat je nu doet","<p class='mini' style='font-size:9.5pt'>Reken je eigen uur-voorbeeld uit met de formule hierboven en schrijf het bedrag op. Dat bedrag is je besluitmoment.</p>",'cr')}
{src('S01','S06','S10','S13','S14')}""",h="Wat AI gaat kosten, en wat niet")
# 13 BI
page("Hoofdstuk 10 · BI, data en software","software",f"""<div class='grid3'>{card("56% vs 40%","<p class='mini'>van de Nederlandse bedrijven gebruikt data-analyse, EU-gemiddeld 40%."+sup('S22')+"</p>",'lbg')}{card("84% vs 60%","<p class='mini'>basis digitale vaardigheden, Nederland tegenover EU."+sup('S22')+"</p>",'lbg')}{card("36% van gebruikers","<p class='mini'>gebruikt AI voor inzicht in bedrijfsresultaten (Exact, 2026)."+sup('S04')+"</p>",'lbg')}</div>
<h3>Kansen</h3><ul class=tight style='font-size:8.6pt'><li><b>Vraag in gewone taal aan je cijfers.</b> Nederlandse bedrijven hebben de data en de vaardigheden. De stap van rapport naar vraag-en-antwoord is klein.</li><li><b>Semantiek.</b> Gartner verwacht dat het vastleggen van betekenis in je data de nauwkeurigheid tot 80% kan verhogen en de kosten tot 60% kan verlagen.{sup('S16')} <span class='lab lp'>Voorspelling</span> Leg dus eerst vast wat “omzet”, “klant” en “open order” betekenen.</li><li><b>AI-agenten.</b> Gartner verwacht dat agenten in 2027 ongeveer de helft van de zakelijke beslissingen ondersteunen of automatiseren.{sup('S16')} <span class='lab lp'>Voorspelling</span></li><li><b>Zelf bouwen.</b> {tier('C')} Een kleine rapportage of koppeling bouw je nu met AI-codeerhulpen in dagen, niet maanden.</li></ul>
<h3>Risico’s</h3><ul class=tight style='font-size:8.6pt'><li><b>Slechte data in, slechte antwoorden uit.</b> 43,5% van de EU-bedrijven noemt datakwaliteit als rem.{sup('S01')} 41,6% noemt dat het niet past bij bestaande systemen.</li><li><b>Pilots die niet doorgroeien.</b> Gartner verwacht dat meer dan 40% van de agentic-AI-projecten eind 2027 wordt geschrapt.{sup('S27')} <span class='lab lp'>Voorspelling</span> Alleen de kop van dat bericht is door ons gelezen.</li><li><b>Zelfbouw die aan één persoon hangt.</b> Dat is precies het kennisprobleem dat je wilde oplossen. Leg vast hoe het werkt.</li><li><b>Licentiekosten die blijven lopen</b> voor tools die je weinig gebruikt. Tel per jaar wat je betaalt en wat je gebruikt.</li></ul>
{card("Een eenvoudig besluitschema",f"<table class='mini tight'><tr><th>Situatie</th><th>Kies</th></tr><tr><td>Taak komt wekelijks terug, regels zijn duidelijk</td><td>Standaardtool, vaste prompt, mens controleert</td></tr><tr><td>Je gebruikt maar een klein deel van een duur pakket</td><td>Test of je dat deel zelf kunt bouwen; behoud boekhouding en salaris</td></tr><tr><td>Data ligt verspreid over systemen</td><td>Eerst één bron van waarheid, dan pas AI erbovenop</td></tr><tr><td>Fout kan schade doen (geld, privacy, wet)</td><td>Mens beslist altijd; log wat er gebeurde</td></tr></table>",'cr')}
{card("Wat je nu doet","<p class='mini' style='font-size:9.5pt'>Maak een lijst van je vijf duurste softwarepakketten. Schrijf bij elk op welk deel je echt gebruikt. Dat is je eerste bouw-of-koop-gesprek.</p>",'lbg')}{src('S01','S04','S16','S22','S27')}""",h="BI, data en software: kansen en risico’s")
# 14 BLOKKADES
B7=[("1 · Weten niet hoe","47% van de Nederlandse ondernemers weet niet goed hoe AI te gebruiken"+sup('S04')+"; 70,3% van de EU-bedrijven noemt kennis"+sup('S01')),
("2 · Niet getraind","Slechts een derde van de medewerkers zegt goed getraind te zijn"+sup('S08')),
("3 · Geen leiderschap","Zonder leiderschapssteun is 15% positief, met 55%. Maar een kwart van de frontline ervaart die steun"+sup('S08')),
("4 · Manager ontbreekt","Een actief ondersteunende manager: 2,1 keer vaker frequent gebruik; slechts 28% heeft die manager (VS)"+sup('S17')),
("5 · Angst","46% maakt zich zorgen om zijn baan bij herontwerp van werk; 48% van de mkb-ondernemers vindt data in AI spannend"+sup('S08','S26')),
("6 · Geen regels","Twee op vijf zeggen dat er beleid is; bijna de helft gebruikt AI tegen beleid in"+sup('S09')),
("7 · Schaduw-AI","Meer dan de helft van wie geen tools heeft, zoekt zelf alternatieven"+sup('S08')+"; schaduw-AI kost gemiddeld $670.000 extra per datalek"+sup('S15'))]
page("Hoofdstuk 11 · De mens","mens",f"""<p>Technologie is zelden het probleem. Zeven menselijke blokkades komen steeds terug in de bronnen.</p><div class='g2'>{''.join(card(t,f"<p class='mini'>{b}</p>",'cr' if i%2 else '') for i,(t,b) in enumerate(B7))}{card("Het verband",f"<p class='mini'>Gebruik zonder kennis, training en regels leidt tot twee uitkomsten: wie voorzichtig is, doet niets; wie nieuwsgierig is, gebruikt AI buiten het zicht van de organisatie. Beide zijn kostbaar. <span class='lab la'>Ons oordeel</span></p>",'lbg')}</div>
{card("Wat opvalt in de cijfers",f"<ul class=tight style='font-size:9.2pt'><li>Bij frontline-medewerkers stagneert regelmatig gebruik op 51%, bij managers gebruikt meer dan driekwart AI wekelijks.{sup('S08')} De kloof binnen een bedrijf is groter dan tussen bedrijven.</li><li>66% gebruikt AI-antwoorden zonder te controleren, meer dan de helft maakte fouten door AI.{sup('S09')}</li><li>47% van de midden-managers en medewerkers meldt minstens één negatief effect, tegen 31% van de directie.{sup('S06')} Wie het werk doet, ervaart het anders dan wie erover beslist.</li></ul>",'lbg')}{src('S01','S04','S06','S08','S09','S15','S17','S26')}""",h="Waarom AI niet van de grond komt")
# 15 AANPAK
rows=[("Weten niet hoe","Eén taak, één sessie van 30 minuten, samen met iemand die het al deed. Leg stappen vast."),("Niet getraind","Minimaal vijf uur oefenen op echt werk, met een coach. Dit hangt in de BCG-cijfers samen met meer gebruik."),
("Geen leiderschap","De eigenaar gebruikt AI zichtbaar voor eigen werk en vertelt wat misging."),("Manager ontbreekt","Maak elke teamleider eigenaar van één AI-taak, met tijd ervoor."),
("Angst","Zeg expliciet wat AI niet doet en wat er met tijdwinst gebeurt: klantwerk, kwaliteit, geen ontslagen? Beloof alleen wat je kunt waarmaken."),
("Geen regels","Eén A4: wat mag erin, wat nooit, wie beslist, wat doe je bij een fout."),("Schaduw-AI","Geef het team goede tools. Verbieden werkt niet: wie geen tools krijgt, zoekt zelf.")]
page("Hoofdstuk 12 · Aanpak","adoptieprotocol",f"""<p>Per blokkade een eerste actie, geordend op wat het snelst verschil maakt.</p><table><tr><th style='width:34mm'>Blokkade</th><th>Wat je doet deze maand</th></tr>{''.join(f"<tr><td><b>{a}</b></td><td>{b}</td></tr>" for a,b in rows)}</table>
<div class='g2'>{card("Het vier-weken-protocol",f"<ol class=tight style='font-size:9.2pt'><li><b>Week 1:</b> kies één taak en meet nu.</li><li><b>Week 2:</b> schrijf de regels en de AI-afspraken op één A4.</li><li><b>Week 3:</b> laat twee mensen oefenen met een coach.</li><li><b>Week 4:</b> meet opnieuw en deel wat je leerde, ook de fouten.</li></ol>",'lbg')}{card("Wat je meet",f"<ul class=tight style='font-size:9.2pt'><li>Minuten per stuk, voor en na</li><li>Fouten per honderd</li><li>Aantal medewerkers dat het wekelijks gebruikt</li><li>Aantal gemelde incidenten (liefst meer, in het begin)</li></ul>",'cr')}</div>
{card("Waarom dit werkt","<p class='mini'>Het sluit aan op wat in de data verschil maakt: steunende leidinggevenden (2,1 keer vaker gebruik) en leiderschapssteun (positief van 15% naar 55%), training en herontwerp van werk."+sup('S06','S08','S17')+" We hebben dit protocol niet als geheel getest. Elk onderdeel steunt op een bron, de combinatie is ons oordeel. <span class='lab la'>Ons oordeel</span></p>")}{src('S06','S08','S17')}""",h="Hoe je de mens meeneemt")
# 16 PROCES TECH CULTUUR
page("Hoofdstuk 13 · Vier lagen","lagen",f"""<p>AI strandt zelden op één laag. Het strandt op de combinatie. Per laag wat de data zegt en wat je controleert.</p>
<div class='grid2'>{card("Mensen",f"<p class='mini'>Kennis, training, vertrouwen. 70,3% noemt kennis als rem.{sup('S01')}<br><b>Controle:</b> kan elke medewerker in twee zinnen uitleggen wat AI hier doet?</p>")}{card("Proces",f"<p class='mini'>Herontwerp is het grootste onderscheid: 75% bij high performers.{sup('S06')}<br><b>Controle:</b> staat de taak op papier, met een eigenaar en een meetgetal?</p>",'cr')}{card("Data",f"<p class='mini'>43,5% noemt data beschikbaar of slecht.{sup('S01')} Nederland doet het relatief goed (56% data-analyse).{sup('S22')}<br><b>Controle:</b> weet je waar de bron van waarheid ligt?</p>",'cr')}{card("Techniek",f"<p class='mini'>41,6% zegt: past niet bij bestaande systemen.{sup('S01')} De prijs daalt 10× per jaar.{sup('S14')}<br><b>Controle:</b> werkt het naast je huidige systemen zonder grote koppeling?</p>")}</div>
{card("Cultuur: de vijfde laag die alles bepaalt","<p class='mini'>Cultuur is geen aparte laag maar de som: laat een fout zien, leer ervan. Bij frontline-medewerkers stagneert gebruik op 51%, bij managers is het driekwart."+sup('S08')+"</p><ul class=tight style='font-size:8.8pt'><li>Fouten bespreekbaar maken: wie een fout meldt, krijgt een compliment.</li><li>Tijd inruimen: 80% zegt te weinig tijd of energie te hebben, dus oefenen moet in werktijd."+sup('S23')+"</li><li>Delen: één wekelijks kwartier waarin iemand laat zien wat werkte.</li></ul>",'lbg')}
{card("Volwassenheidsladder <span class='chip'>ons model</span>",f"<table class='mini tight'><tr><th>Stap</th><th>Kenmerk</th><th>Volgende stap</th></tr><tr><td>1</td><td>Geen gebruik</td><td>Eén taak kiezen</td></tr><tr><td>2</td><td>Losse tools per persoon</td><td>Regels op één A4</td></tr><tr><td>3</td><td>Vaste werkwijze vastgelegd</td><td>Koppelen aan systemen</td></tr><tr><td>4</td><td>Gekoppeld aan systemen</td><td>Meten en bijhouden</td></tr><tr><td>5</td><td>Bijgehouden en gemeten</td><td>Nieuwe taak</td></tr></table><p class='note'>Wij schatten dat de meeste mkb-bedrijven op stap 1 of 2 zitten. Dat is een oordeel, geen meting, want geen bron meet dit zo.</p>",'cr')}{src('S01','S06','S08','S14','S22','S23')}""",h="Mens, proces, data en techniek")
# 17 RISICO
rk=[("Datalek via openbare chatbots",3,3,"Medewerkers plakken bedrijfsdata in chatbots. AP: tientallen meldingen"+sup('S24'),"AI-regels, zakelijke tools"),
("Schaduw-AI",3,3,"Bijna de helft gebruikt AI tegen beleid in; kost $670.000 extra per datalek"+sup('S09','S15'),"Goede tools, beleid, toegang"),
("Ongecontroleerde fouten",3,2,"Twee op drie gebruikt AI-uitkomsten zonder te controleren; meer dan de helft maakte fouten"+sup('S09'),"Mens controleert, steekproef"),
("Geen aantoonbare waarde",3,2,"60% ziet nauwelijks waarde; gerapporteerde winst 3× te hoog"+sup('S07','S13'),"Meten vóór en ná"),
("Kennis in één hoofd (zelfbouw)",2,3,"Zelf bouwen is toegenomen; 32% kocht geen software"+sup('S06'),"Documenteer, tweede persoon"),
("Pilots die stranden",3,1,"Gartner verwacht >40% agentic-projecten geschrapt eind 2027"+sup('S27'),"Klein beginnen, einddatum"),
("Verkeerde verwachtingen mensen",2,2,"46% zorgt zich om zijn baan bij herontwerp"+sup('S08'),"Eerlijk communiceren"),
("Regelgeving en aansprakelijkheid",1,2,"Hoog-risico regels uitgesteld tot dec 2027; transparantieregels dec 2026"+sup('S18'),"Weet wat jouw toepassing is")]
heat=lambda v:f"<span class='heat h{v}'>{['','L','M','H'][v]}</span>"
page("Hoofdstuk 14 · Risico’s","Risico’s",f"""<p>Acht risico’s, geordend op onze inschatting van kans en impact voor een mkb-bedrijf. <span class='lab la'>Ons oordeel</span> L = laag, M = middel, H = hoog.</p><table class='risk'><tr><th>Risico</th><th>Kans</th><th>Impact</th><th>Wat de bronnen zeggen</th><th>Maatregel</th></tr>{''.join(f"<tr><td><b>{a}</b></td><td>{heat(b)}</td><td>{heat(c_)}</td><td style='font-size:8.3pt'>{d_}</td><td style='font-size:8.3pt'>{e_}</td></tr>" for a,b,c_,d_,e_ in rk)}</table>
{card("Wat het patroon zegt",f"<p class='mini'>De risico’s met de grootste kans en impact (datalek, schaduw-AI) zijn geen technische risico’s maar gedragsrisico’s. De maatregel kost weinig: een A4 met regels en goede tools. De duurste maatregel is het risico negeren: een datalek kost gemiddeld $4,44 miljoen, schaduw-AI telt daar gemiddeld $670.000 bij, en 97% van de organisaties met een AI-inbreuk had geen toegangscontrole.{sup('S15')} Dit zijn wereldwijde cijfers van 600 organisaties; voor een klein bedrijf zijn de bedragen lager, het patroon blijft.</p>",'cr')}
{card("Wat je nu doet","<p class='mini' style='font-size:9.5pt'>Kies de twee hoogste risico’s en schrijf bij elk één regel. Voorbeeld: “Klantgegevens gaan nooit in een openbare chatbot. Voor klantwerk gebruiken we alleen onze zakelijke omgeving.”</p>",'lbg')}{src('S06','S07','S08','S09','S13','S15','S18','S24','S27')}""",h="Risico’s die er echt toe doen")
# 18 REGELS
page("Hoofdstuk 15 · Regels","regels",f"""<p>De Europese AI-verordening is in 2026 aangepast door de Digitale Omnibus (Verordening (EU) 2026/1744).{sup('S18')} Dit zijn de datums die voor jou ertoe doen.</p>
<table><tr><th>Datum</th><th>Wat</th></tr><tr><td><b>2 december 2026</b></td><td>Transparantie voor synthetische content (bestaande systemen) en nieuwe verboden, zoals AI die niet-consensuele intieme beelden maakt</td></tr><tr><td><b>2 december 2027</b></td><td>Hoog-risico-verplichtingen (Annex III) uitgesteld van 2 augustus 2026</td></tr><tr><td><b>2 augustus 2028</b></td><td>Hoog-risico-verplichtingen voor producten onder sectorwetgeving (Annex I)</td></tr><tr><td><b>2 augustus 2030</b></td><td>Systemen voor overheden</td></tr></table>
<div class='g2'>{card("Wat dit voor het mkb betekent",f"<p class='mini'>De mkb-verlichting geldt nu ook voor “small mid-caps” (minder dan 750 medewerkers en maximaal €150 miljoen omzet): eenvoudiger documentatie, evenredig kwaliteitssysteem en maximumboetes op maat.{sup('S18')}</p>")}
{card("Wat we niet hebben kunnen verifiëren",f"<p class='mini'>De bronnen die we lazen behandelen de verplichting tot AI-geletterdheid en de regels voor algemene AI-modellen niet. Controleer die bij je adviseur voordat je erover beslist.</p>",'cr')}</div>
{card("Privacy: wat de Autoriteit Persoonsgegevens adviseert",f"<ul class=tight style='font-size:9.2pt'><li>Leg vast welke gegevens wel en niet in AI-systemen mogen.{sup('S24')}</li><li>Geef medewerkers training en duidelijke richtlijnen.</li><li>Let op gratis versies van chatbots: ingevoerde gegevens kunnen worden bewaard en gebruikt voor training.</li></ul><p class='note'>Dit is geen juridisch advies. Het is een samenvatting van gelezen bronnen.</p>",'lbg')}
{card("Jouw checklist deze maand",f"<ul class=tight style='font-size:9.2pt'><li>☐ Ik weet welke AI-tools mijn team nu gebruikt (vraag het hardop).</li><li>☐ Er staat een A4 met wat wel en niet mag.</li><li>☐ Klantgegevens gaan niet in gratis chatbots.</li><li>☐ Ik weet of een toepassing van mij onder “hoog risico” kan vallen (selectie, kredietbeoordeling, werving) en vraag zo nodig advies.</li></ul>",'cr')}{src('S18','S24')}""",h="Regels en datums")
# 19 KANSENKAART
op=[("Offertes en antwoorden op aanvragen als concept","Laag","Hoog","Marketing/verkoop: 35% van de gebruikers",1),
("Notulen, mails en actielijsten","Laag","Middel","Administratie: 32%",1),
("Veelgestelde klantvragen beantwoorden","Laag","Hoog","Klantenservice +14%, beginners +34%",1),
("Facturen voorsorteren (zie case 1)","Middel","Middel","Boekhouding: 17%",2),
("Bedrijfshandleiding als geheugen (zie case 2)","Laag","Hoog","Kennis vastleggen, geen persoonsgegevens",1),
("Planning en voorraad slimmer","Hoog","Hoog","Kostenreductie: supply chain",3),
("Rapportage in gewone taal","Middel","Middel","Data-analyse 56% NL",2),
("Eigen koppeling of kleine tool bouwen","Hoog","Hoog","32% bouwde liever dan kopen",3),
("Werving en selectie door AI","Hoog","Middel","Mogelijk hoog risico onder AI-verordening",3),
("Productie en service-instructies bijhouden","Middel","Middel","Productie/service: 18%",2)]
opt="<table class='tight'><tr><th>Kans</th><th>Inspanning</th><th>Impact</th><th>Waarom</th></tr>"+"".join(f"<tr><td><b>{a}</b></td><td>{b}</td><td>{c_}</td><td style='font-size:8.4pt'>{d_}</td></tr>" for a,b,c_,d_,_ in op)+"</table>"
page("Hoofdstuk 16 · Kansen","kansen",f"""<p>Tien toepassingen, geordend op eenvoud van starten. De inschatting van inspanning en impact is ons oordeel, de ondersteuning komt uit de bronnen.</p>{opt}
<div class='grid3'>{card("Start deze week",f"<p class='mini'>Offertes, notulen en klantvragen. Weinig inspanning, direct meetbaar, een fout is te vangen.</p>",'cr')}{card("Start dit kwartaal","<p class='mini'>Handleiding, facturen en rapportage. Vraagt een uur voorbereiding en een meetgetal.</p>",'lbg')}{card("Eerst advies",f"<p class='mini'>Werving, kredietbeoordeling, planning met grote financiële gevolgen. Mogelijk hoog risico of grote impact.{sup('S18')}</p>")}</div>
{card("Waarom deze volgorde",f"<p class='mini'>Taken met duidelijke regels en een menselijke controle zijn veilig te starten. Daar zit ook waar bedrijven nu al AI voor gebruiken: marketing en verkoop (35%) en administratie (32%).{sup('S02')} Kostenreductie wordt het vaakst gemeld in supply chain, service en productie, omzetwinst in marketing en sales.{sup('S06')}</p>")}
{card("Wat je nu doet","<p class='mini' style='font-size:9.5pt'>Zet een kruis bij drie kansen. Kies de eerste die elke week terugkomt. Dat is je pilot.</p>",'lbg')}{src('S02','S06','S12','S18','S22')}""",h="Kansenkaart voor het mkb")
# 20 CASE 1
st1=[("Meet","Tel een maand lang je facturen en de minuten per factuur."),("Regels","Schrijf op hoe je nu codeert en wie wat goedkeurt."),("Systeem","Kijk eerst wat je boekhoudpakket al kan (zoals herkenning van facturen) voordat je iets koopt. Vraag het je leverancier."),("Test","Verwerk 20 echte facturen naast het oude werk. Noteer afwijkingen per factuur."),("Beoordeel","Hoeveel klopt direct? Waar gaat het mis: leverancier, btw, bedrag? Pas de regels aan."),("Live met mens","AI sorteert voor en doet een voorstel, een medewerker keurt altijd goed. Begin met je vijf grootste leveranciers."),("Meet na 30 dagen","Zelfde meting als stap 1. Besluit: uitbreiden, aanpassen of stoppen.")]
page("Hoofdstuk 17 · Case 1","voorsorteren",f"""<p>Een taak die elk bedrijf heeft, veel tijd kost en waar een fout goed te vangen is.</p>{''.join(f"<div class='step'><div class='stepn'>{i+1}</div><div class='card' style='padding:3.2mm 5mm'><h3 style='margin:0'>{a}</h3><span class='mini' style='font-size:9.2pt'>{b}</span></div></div>" for i,(a,b) in enumerate(st1))}
<div class='g2'>{card("Rekenvoorbeeld <span class='chip'>fictief</span>","<p class='mini'>300 facturen per maand, nu 12 minuten, daarna 3 minuten (met controle): 60 uur wordt 15 uur, 45 uur bespaard per maand.</p>",'lbg')}{card("Wat praktijk zegt <span class='chip'>niet geverifieerd</span>",f"<p class='mini'>Een leverancier beschrijft een klein VK-retailbedrijf: van 10–15 naar minder dan 3 minuten per factuur, meer dan 40 uur per maand minder werk.{sup('S25')} {tier('D')} Richting, geen belofte.</p>",'cr')}</div>
{src('S25')}""",h="Case: inkoopfacturen voorsorteren")
# 21 CASE 2
st2=[("Kies één proces","Wat vraagt iedereen steeds aan dezelfde persoon? Dat is je eerste proces."),("Praat het in","Laat de collega 20 minuten vertellen hoe het gaat, met toestemming. Neem op of schrijf mee."),("Laat AI het uitschrijven","Plak de tekst in Claude of een vergelijkbare tool en vraag om een genummerd stappenplan met wat, waarom en wie het nog meer weet."),("Laat zien wat ontbreekt","Vraag: “Welke vragen moet ik nog stellen om dit af te maken?”"),("Controleer","Haal namen en gegevens van klanten of medewerkers eruit. Twijfel je? Eruit."),("Test met een nieuwkomer","Laat iemand die het proces niet kent de handleiding gebruiken en noteer waar hij vastloopt."),("Houd bij","Zet een datum en een eigenaar bovenaan. Elk kwartier 10 minuten bijwerken.")]
page("Hoofdstuk 18 · Case 2","geheugen",f"""<p>Kennis die in één hoofd zit is een bedrijfsrisico en het begin van een bedrijfsgeheugen. Dit is hoe je het zelf start.</p>{''.join(f"<div class='step'><div class='stepn'>{i+1}</div><div class='card' style='padding:3.2mm 5mm'><h3 style='margin:0'>{a}</h3><span class='mini' style='font-size:9.2pt'>{b}</span></div></div>" for i,(a,b) in enumerate(st2))}
<div class='g2'>{card("Wat je meet","<p class='mini'>Aantal keer dat dezelfde vraag per week binnenkomt, voor en na. Minuten die de ervaren collega kwijt is.</p>",'lbg')}{card("Wat het bewijs is","<p class='mini'>Dit is een werkwijze, geen gemeten resultaat. Elk onderdeel steunt op de bevinding dat training, regels en herontwerp van werk verschil maken."+sup('S06','S08')+"</p>",'cr')}</div>""",h="Case: een bedrijfshandleiding in een middag")
# 22 ZELFTEST
Q=["Ik weet welke AI-tools mijn team nu gebruikt.","Er staat op papier wat wel en niet in AI mag.","Elke medewerker heeft een zakelijke tool, geen gratis account.","Minstens één taak draait vast met AI en iemand is eigenaar.","Ik weet hoeveel minuten die taak kost, voor en na.","Mijn teamleiders gebruiken AI zelf zichtbaar.","We hebben dit kwartaal getraind of geoefend, in werktijd.","Fouten door AI worden gemeld zonder gedoe.","Ik weet waar onze bron van waarheid voor data ligt.","We hebben een plafond op AI-kosten.","Ik heb bekeken welke van onze toepassingen hoog risico kunnen zijn.","Er is een tweede persoon die weet hoe onze AI-taken werken."]
page("Hoofdstuk 19 · Zelftest","loopt",f"""<p>Twaalf stellingen. Tel hoeveel je met <b>ja</b> beantwoordt. Wees eerlijk, niemand kijkt mee.</p><div class='grid2'><div>{''.join(f"<div class='find' style='margin-bottom:2mm'><div class='stepn' style='width:7mm;height:7mm;font-size:8.5pt'>{i+1}</div><div class='mini' style='font-size:9.2pt;padding-top:1mm'><span class='cbx' data-f='q{i+1}'></span>{q}</div></div>" for i,q in enumerate(Q[:6]))}</div><div>{''.join(f"<div class='find' style='margin-bottom:2mm'><div class='stepn' style='width:7mm;height:7mm;font-size:8.5pt'>{i+7}</div><div class='mini' style='font-size:9.2pt;padding-top:1mm'><span class='cbx' data-f='q{i+7}'></span>{q}</div></div>" for i,q in enumerate(Q[6:]))}</div></div>
<h3 style='margin-top:4mm'>Jouw profiel <span class='chip'>ons model</span> &nbsp; Mijn score: {fld('score',14)} <span class='mini' style='font-weight:400'>van 12, telt zichzelf op in Acrobat; elders zelf optellen</span></h3><table><tr><th>Score</th><th>Profiel</th><th>Jouw volgende stap</th></tr><tr><td><b>0–3</b></td><td>Verkenner</td><td>Eén A4 met regels en één taak kiezen. Dat is genoeg voor vier weken.</td></tr><tr><td><b>4–6</b></td><td>Gebruiker</td><td>Maak van losse tools een vaste werkwijze met meetgetal.</td></tr><tr><td><b>7–9</b></td><td>Bouwer</td><td>Koppel aan systemen, leg vast, train breder.</td></tr><tr><td><b>10–12</b></td><td>Voorloper</td><td>Meet de winst, deel het, kies de volgende taak. Je zit dicht bij de 6% high performers.</td></tr></table>
{card("Hoe dit is gemaakt",f"<p class='mini'>De stellingen volgen de zeven blokkades en de drie verschillen tussen winnen en verliezen uit de bronnen. De scoregrenzen zijn onze keuze en niet getest op een steekproef. Gebruik het als gesprek, niet als meting.</p>",'cr')}""",h="Waar loopt jouw bedrijf vast?")
# 23 90 DAGEN
page("Hoofdstuk 20 · Plan","dagen",f"""<div class='grid3'>{card("0–30 dagen · Vastleggen","<ul class=tight style='font-size:9pt'><li>Eén A4 met AI-regels</li><li>Kies één taak, meet nu</li><li>Zakelijke tools voor het team</li><li>Vraag wat het team nu gebruikt</li></ul>",'lbg')}{card("31–60 dagen · Toepassen","<ul class=tight style='font-size:9pt'><li>Test naast het oude werk</li><li>Mens beoordeelt alles</li><li>Twee mensen krijgen vijf uur oefening</li><li>Wekelijks kwartier delen</li></ul>",'lbg')}{card("61–90 dagen · Verbreden","<ul class=tight style='font-size:9pt'><li>Meet opnieuw, vergelijk</li><li>Kies de tweede taak</li><li>Koppel pas dan aan systemen</li><li>Plan een kwartaalreview</li></ul>",'lbg')}</div>
<h3>De zes cijfers die je volgt</h3><table><tr><th>Cijfer</th><th>Waarom</th><th>Startwaarde</th></tr><tr><td>Minuten per stuk (taak 1)</td><td>Het enige harde bewijs</td><td>Meet in week 1</td></tr><tr><td>Fouten per honderd</td><td>Kwaliteit</td><td>Meet in week 1</td></tr><tr><td>Wekelijks gebruikers in team</td><td>Adoptie. Frontline stagneert op 51%{sup('S08')}</td><td>Tel in week 1</td></tr><tr><td>Gemelde incidenten</td><td>Veiligheid. Stijgt eerst, dat is goed</td><td>0</td></tr><tr><td>Kosten per maand</td><td>Plafond{sup('S06')}</td><td>Maandbedrag</td></tr><tr><td>Bespaarde uren × uurtarief</td><td>Besluitgetal</td><td>Reken na 30 dagen</td></tr></table>
{card("Wat kost wachten? <span class='chip'>fictief</span>","<p class='mini'>8 medewerkers × 4 uur × 40% × €50 per uur × 46 weken ≈ €29.400 per jaar aan capaciteit die je laat liggen (rekenvoorbeeld, geen belofte). Vul je eigen getallen in.</p>",'cr')}
{card("Wat je morgenochtend doet","<ol class=tight style='font-size:9.5pt'><li>Schrijf de A4 met AI-regels (15 minuten).</li><li>Kies één taak en schrijf op hoeveel minuten die kost.</li><li>Vraag je team: welke AI-tools gebruiken jullie nu?</li></ol>",'lbg')}{src('S06','S08')}""",h="Je eerste 90 dagen")
# 26b MEETBLAD (invulbaar)
wk=[("Week 0 · nulmeting",0),("Week 1",1),("Week 2",2),("Week 3",3),("Week 4 · nameting",4)]
cols=[("Minuten per stuk","min"),("Fouten per 100","fout"),("Wekelijkse gebruikers","geb"),("Gemelde incidenten","inc"),("Kosten (€ per maand)","kost")]
rowsm="".join(f"<tr><td><b>{a}</b></td>"+"".join(f"<td>{fld(f'w{k}_{c}',22)}</td>" for _,c in cols)+"</tr>" for a,k in wk)
page("Werkblad · Meetblad","Meetblad",f"""<p>Dit blad werkt in het PDF zelf: klik in een vak en typ. Eén taak, vijf meetmomenten. Zo heb je na vier weken een eigen getal in plaats van het gemiddelde van een ander.</p>
<div class='card'><h3>De taak die ik meet</h3>{fld('taak',138)}<p class='mini' style='margin:3mm 0 1mm'>Eigenaar (naam)</p>{fld('eigenaar',70)}</div>
<table><tr><th style='width:34mm'>Moment</th>{''.join(f'<th>{a}</th>' for a,_ in cols)}</tr>{rowsm}</table>
<div class='grid2'>{card("Zo lees je de uitkomst","<ul class=tight style='font-size:9.2pt'><li><b>Minuten per stuk omlaag, fouten gelijk of lager:</b> uitbreiden naar de volgende taak.</li><li><b>Minuten omlaag, fouten omhoog:</b> pas de regels aan en meet nog twee weken.</li><li><b>Geen verschil:</b> de taak was niet geschikt. Kies een andere, dat is een normale uitkomst.</li></ul>",'cr')}
{card("Bespaarde uren × uurtarief","<p class='mini'>(minuten vóór − minuten ná) × aantal stuk per maand ÷ 60 × jouw uurtarief = je besluitgetal per maand.</p><p class='mini'>Uitkomst: "+fld('besluit',34)+"</p>",'lbg')}</div>
{card("Wat je nu doet","<p class='mini' style='font-size:9.5pt'>Vul vandaag week 0 in. Het kost tien minuten en het is het enige wat je nu niet kunt terugdraaien: een nulmeting achteraf bestaat niet.</p>",'lbg')}""",h="Je eigen meetblad, invulbaar")
# 26c SAMEN MET PORTAAL
import segno,io
qr=segno.make(TRIAL,error='m');buf=io.BytesIO();qr.save(buf,kind='svg',scale=4,border=0,dark='#14171A',light=None,omitsize=True,xmldecl=False);QR=buf.getvalue().decode()
pst=[("Frisse blik","Zes minuten vragen over jouw bedrijf. Je krijgt scores per onderdeel, wat je het meest remt en een roadmap."),("Je portaalaccount","Alles wat je invult komt op één plek. Je ziet hoe scherp je beeld is: hoe meer je invult, hoe preciezer het advies."),("AI-capabilitymodel","Negen lagen, 86 capabilities, per stuk aangegeven wat nu, bij groei of later aan de orde is."),("AI-verordening-scan","Welke van jouw toepassingen onder welke regel vallen, met datums en bron."),("Je zetten uit dit rapport","Neem je gekozen taak, je A4-regels en je meetgetal mee. Dan werk je vanaf minuut één aan jouw situatie.")]
page("Samen doen · Portaal","samen",f"""<div style='display:flex;gap:6mm;align-items:flex-start'><div style='flex:1'><p class='lead' style='font-size:11pt'>Dit rapport vertelt wat werkt. Je portaal laat je het doen, in jouw bedrijf, met jouw cijfers. Het begint met de Frisse blik.</p>
<div style='margin-top:3mm'>{''.join(find(i+1,a,b) for i,(a,b) in enumerate(pst))}</div></div>
<div class='qr'>{QR}<p class='mini' style='font-size:8pt;margin:2mm 0 0;text-align:center'>Scan: 1 maand gratis<br>code <b>{CODE}</b></p></div></div>
<div class='grid2'>{card("Wat jij doet","<ul class=tight style='font-size:9.2pt'><li>Zes minuten de Frisse blik invullen</li><li>Je account aanmaken met e-mailadres</li><li>Eén taak kiezen en het meetblad vullen</li></ul>",'cr')}{card("Wat het portaal met jou doet","<ul class=tight style='font-size:9.2pt'><li>Je antwoorden vertalen naar scores en een roadmap</li><li>Je volgende stap scherper maken naarmate je meer invult</li><li>Jouw cijfers naast de benchmarks uit dit rapport zetten</li></ul>",'lbg')}</div>
{card("Waarom dit anders is dan een rapport","<p class='mini'>Een rapport veroudert op de dag dat het verschijnt. Een portaal met jouw gegevens veroudert niet: elke nieuwe editie van dit rapport kan tegen jouw cijfers worden gelegd.</p>")}
{card("Wat je nu doet",f"<p class='mini' style='font-size:9.5pt'>Scan de code en gebruik {CODE}: 30 dagen gratis, geen betaalmethode. Of begin met de Frisse blik via de Zet-balken.</p>",'lbg')}""",h="Doe het samen met je portaal")

# 24 METHODE
an=pd.read_sql("select name,value,ci_low,ci_high,n,note from analysis_results where ci_low is not null",c)
rows="".join(f"<tr><td style='font-size:8pt'>{e(r['name'])}</td><td class='num2' style='font-size:8pt'>{r['value']:.2f}</td><td class='num2' style='font-size:8pt'>{r.ci_low:.2f} – {r.ci_high:.2f}</td><td class='num2' style='font-size:8pt'>{int(r.n)}</td></tr>" for _,r in an.iterrows())
page("Verantwoording · Methode","Methode",f"""<p class='mini'>Alle verbanden: Spearman-rangcorrelatie met bootstrap-betrouwbaarheidsinterval (5.000 herhalingen, zaadwaarde 7). Een interval dat nul omvat betekent: geen aantoonbaar verband. Het aantal landen is maximaal 27, de statistische kracht is beperkt. Een verband is geen oorzaak.</p>
<table class='tight'><tr><th>Analyse</th><th class='num2'>rho</th><th class='num2'>95%-interval</th><th class='num2'>n</th></tr>{rows}</table>""",h="Methode en analyses")
page("Verantwoording · Beperkingen","Beperkingen",f"""{card("Beperkingen die je moet kennen",f"<ul class=tight style='font-size:8.6pt'><li>CBS (2+), Eurostat (10+), Exact (2–250, zelfrapportage) zijn niet vergelijkbaar en worden niet opgeteld.</li><li>Nederland heeft in Eurostat 2025 een reeksbreuk; wij gebruiken de waarde alleen voor positie, niet voor trends.</li><li>McKinsey en BCG wegen grote bedrijven zwaar; KPMG en Microsoft meten personen, geen bedrijven.</li><li>Microsoft-landencijfers: alleen top-30 gelezen, daarom 15 landen in de vergelijking met bedrijfsgebruik.</li><li>OECD-rapport en de Rijksoverheid-studie “Ambitie of aarzeling?” konden niet volledig worden gelezen.</li><li>Gartner-voorspellingen zijn voorspellingen. De agentic-projecten-claim is uit de kop van het persbericht gelezen.</li><li>Het totaal van een land hangt rekenkundig samen met het aandeel van kleine bedrijven.</li></ul>",'cr')}
{card("De database",f"<p class='mini'>Bestand: <b>ai_mkb.db</b> (SQLite). Tabellen: sources (27), facts (145), country_ai (27), sector_ai (13), analysis_results (57). Elke feit-rij heeft bron, jaar, populatie en notitie. Een volgende editie voegt rijen toe en draait dezelfde analyses opnieuw. Op productie-Supabase staat niets; dat gaat pas na akkoord.</p>",'lbg')}""",h="Beperkingen en database")
# 25 BRONNEN
def srow(i,r):return f"<tr><td>{i[1:]}</td><td><b>{e(r['publisher'])}</b>. {e(r['name'])}<br><span class='u'>{e(r['url'])}</span><br><span style='color:#5C646E'>{e(r['population'])}{'. '+e(r['caveat']) if r['caveat'] else ''}</span></td><td>{e(r['published'])}</td><td>{r['tier']}</td></tr>"
for k,(a_,b_) in enumerate([(0,14),(14,27)]):
  page("Verantwoording · Bronnen","Bronnen","<table class='tight' style='font-size:7.2pt'><tr><th>#</th><th>Bron</th><th>Datum</th><th>Kracht</th></tr>"+"".join(srow(i,r) for i,r in S.iloc[a_:b_].iterrows())+"</table>",h=f"Bronnen ({k+1}/2)")
# 26 BIJLAGE LANDEN
d=df.sort_values('adopt_2025',ascending=False)
rows="".join(f"<tr {'style=background:#FFF8E8' if r.code=='NL' else ''}><td>{e(r.country)}</td><td class='num2'>{nl(r.adopt_2025)}</td><td class='num2'>{nl(r.small)}</td><td class='num2'>{nl(r.medium)}</td><td class='num2'>{nl(r.large)}</td><td class='num2'>{'' if pd.isna(r.adopt_2024) else nl(r.adopt_2024)}</td><td class='num2'>{'' if pd.isna(r.ms_individual_q2_2026) else nl(r.ms_individual_q2_2026)}</td></tr>" for _,r in d.iterrows())
page("Bijlage · Landentabel","Landentabel",f"<p class='mini'>Aandeel bedrijven (10+) dat AI gebruikt. Eurostat 2025, 2024 uit CBS, individueel gebruik Microsoft Q2 2026 (alleen beschikbaar voor top-30-landen). Nederland: reeksbreuk.</p><table class='tight' style='font-size:7.6pt'><tr><th>Land</th><th class='num2'>2025</th><th class='num2'>Klein</th><th class='num2'>Midden</th><th class='num2'>Groot</th><th class='num2'>2024</th><th class='num2'>Individu</th></tr>{rows}</table>{src('S01','S03','S11')}",h="Alle 27 landen")
# 27 ACHTERBLAD
import segno,io
qt=segno.make(TRIAL,error='m');bb=io.BytesIO();qt.save(bb,kind='svg',scale=4,border=0,dark='#14171A',light=None,omitsize=True,xmldecl=False);QRT=bb.getvalue().decode()
stairs="<svg viewBox='0 0 520 150' width='100%'>"+"".join(f"<rect x='{10+i*100}' y='{130-(i+1)*24}' width='92' height='{(i+1)*24+8}' rx='3' fill='{'#FFE86B' if i==4 else '#2A2F36'}' stroke='{'#FFE86B' if i==4 else '#3a4150'}'/><text x='{18+i*100}' y='{146-(i+1)*24+8-0}' font-size='9' fill='{'#14171A' if i==4 else '#9aa3b0'}' font-family='Instrument Sans' font-weight='700'>{['Geen gebruik','Losse tools','Vaste werkwijze','Gekoppeld','Gemeten'][i]}</text><text x='{18+i*100}' y='{140}' font-size='13' fill='{'#14171A' if i==4 else '#FBFAF7'}' font-family='Bricolage Grotesque' font-weight='800'>{i+1}</text>" for i in range(5))+"<path d='M28 70 C 140 20, 260 10, 470 4' stroke='#FF4F17' stroke-width='2' fill='none' stroke-dasharray='5 4'/><circle cx='28' cy='70' r='4' fill='#FF4F17'/></svg>"
P.append(f"""<div class='p cover'><div class='top'><span class='geel'>Bedrijfs<b>geheugen</b></span></div><div style='margin-top:16mm'><div class='eb'>Wat nu?</div><div class='big' style='font-size:38pt'>Kies één taak.<br>Meet. Leer.<br><span style='background:linear-gradient(transparent 55%,#FFE86B 55%,#FFE86B 92%,transparent 92%)'>Begin maandag.</span></div>
<p class='lead' style='color:#DCDFE6;margin-top:6mm;font-size:11.5pt;max-width:140mm'>De data zegt het eerlijk: niet wie het eerst begint wint, maar wie leert te meten. Dat kost geen budget, wel een besluit.</p></div>
<div style='margin-top:8mm'>{stairs}<p style='color:#9aa3b0;font-size:8pt;margin:1mm 0 0'>De meeste mkb-bedrijven staan op stap 1 of 2 (ons oordeel). Eén taak, vier weken, en je staat op stap 3.</p></div>
<div style='position:absolute;left:16mm;right:16mm;bottom:34mm;background:var(--y);color:var(--i);border-radius:8px;padding:6mm;display:flex;gap:6mm;align-items:center;transform:rotate(-.5deg);border:2px dashed #14171A'>
<div style='flex:1'><div style='font-size:7.5pt;letter-spacing:.16em;font-weight:700'>CADEAU BIJ DIT RAPPORT</div><div style='font-family:Bric;font-weight:800;font-size:20pt;line-height:1.05;margin:1mm 0 2mm'>1 maand gratis je bedrijfsportaal</div>
<div style='font-size:9.5pt;line-height:1.4'>Code <b style='font-family:Bric;font-size:14pt;letter-spacing:.05em;background:#14171A;color:#FFE86B;padding:.5mm 3mm;border-radius:3px'>{CODE}</b><br>Geen betaalmethode nodig, per e-mailadres één keer. Scan de code: hij staat al klaar.<br><a href='{TRIAL}' style='color:#14171A;font-weight:800'>bedrijfsgeheugen.nl/afsluiten</a></div></div>
<div style='background:#fff;padding:2.5mm;border-radius:6px;width:34mm;flex:none'>{QRT}</div></div>
<div style='position:absolute;left:16mm;right:16mm;bottom:17mm;color:#8b93a1;font-size:7pt;line-height:1.35'>Wil je dit voor je hele team, bijgehouden en gekoppeld? Plan een Frisse Blik-gesprek: bedrijfsgeheugen.nl/frisse-blik. Dit rapport is gebaseerd op openbare bronnen en eigen analyse en is geen juridisch of financieel advies. Redactie: Bedrijfsgeheugen, november 2026.</div>
<div class='foot' style='color:#8b93a1;border-top:none'><span>Bedrijfsgeheugen · bedrijfsgeheugen.nl</span><span>AI-gedreven. Menselijk gericht.</span></div></div>""")
out='ai-kloof-mkb-2026-q4'
open(out+'.html','w').write(f"<!doctype html><html lang='nl'><head><meta charset='utf-8'><style>{open('style.css').read()}</style></head><body>{''.join(P)}</body></html>")
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page();pg.goto('file://'+os.path.abspath(out+'.html'));pg.wait_for_timeout(700);pg.pdf(path=out+'.pdf',width='210mm',height='297mm',print_background=True);b.close()
print(len(P),'pagina’s')

with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page();pg.goto('file://'+os.path.abspath(out+'.html'))
    r=pg.evaluate("""()=>[...document.querySelectorAll('.p')].map((p,i)=>{let f=p.querySelector('.foot').getBoundingClientRect().top;const z=p.querySelector('.zet');if(z)f=z.getBoundingClientRect().top;let m=0;[...p.children].forEach(c=>{if(!c.classList.contains('foot')&&!c.classList.contains('top')&&!c.classList.contains('zet')&&!c.classList.contains('rail'))m=Math.max(m,c.getBoundingClientRect().bottom)});const pr=p.getBoundingClientRect();return [i+1,Math.round(m-f)]}).filter(x=>x[1]>-6)""")
    print('overflow',r);b.close()
