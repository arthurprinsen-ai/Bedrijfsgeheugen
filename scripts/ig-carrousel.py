"""Instagram-carrousels in de huisstijl. 1080x1350 staand, PDF + losse slides."""
from PIL import Image, ImageDraw, ImageFont
import textwrap, pathlib, sys
F="/home/claude/bric/bricolage-main/fonts/ttf/"
BOLD=F+"BricolageGrotesque-ExtraBold.ttf"
PAPIER,INKT,BLAUW,GEEL,GRIJS=(251,250,247),(20,23,26),(39,66,214),(255,232,107),(92,100,110)
W,H=1080,1350

def geeltje(d,x,y,s,donker=False):
    h=s*0.30; r=s*0.10
    d.rounded_rectangle([x,y,x+s,y+s],radius=r,fill=GEEL)
    d.polygon([(x+s-h,y+s),(x+s,y+s-h),(x+s,y+s)],fill=INKT if donker else PAPIER)
    d.polygon([(x+s-h,y+s-h),(x+s,y+s-h),(x+s-h,y+s)],fill=INKT)
    lw=max(2,int(s*0.075)); ly=y+s*0.26
    for i,br in enumerate([0.56,0.40,0.30]):
        d.rounded_rectangle([x+s*0.17,ly+i*s*0.20,x+s*0.17+s*br,ly+i*s*0.20+lw],radius=lw/2,fill=INKT)

def slide(kop, onder="", soort="inhoud", nr=None, totaal=None, mark=None):
    donker = soort in ("cover","slot")
    bg = INKT if donker else PAPIER
    kleur = PAPIER if donker else INKT
    im=Image.new("RGB",(W,H),bg); d=ImageDraw.Draw(im)
    if not donker: d.rectangle([0,0,16,H],fill=BLAUW)
    geeltje(d,80,80,76,donker)
    grootte = 96 if soort=="cover" else 82
    while grootte>30:
        f=ImageFont.truetype(BOLD,grootte)
        regels=textwrap.wrap(kop.replace("_","_ ").replace("(","( "), width=max(10,int(1250/grootte)))
        regels=[r.replace("_ ","_").replace("( ","(") for r in regels]
        if len(regels)*grootte*1.14 < 620 and all(d.textlength(r,font=f)<W-170 for r in regels): break
        grootte-=4
    y=330
    for r in regels:
        if mark and not donker and mark.lower() in r.lower():
            i=r.lower().find(mark.lower())
            x0=80+d.textlength(r[:i],font=f); wm=d.textlength(r[i:i+len(mark)],font=f)
            d.rectangle([x0-8,y+grootte*0.54,x0+wm+12,y+grootte*1.02],fill=GEEL)
        d.text((80,y),r,font=f,fill=kleur); y+=grootte*1.14
    if donker and mark:
        d.rectangle([80,y+8,80+340,y+18],fill=GEEL); y+=40
    if onder:
        fo=ImageFont.truetype(BOLD,40); y+=28
        for r in textwrap.wrap(onder,width=40)[:5]:
            d.text((80,y),r,font=fo,fill=GEEL if donker else GRIJS); y+=54
    if soort=="cover": d.text((80,H-190),"Swipe \u2192",font=ImageFont.truetype(BOLD,50),fill=GEEL)
    elif nr: d.text((80,H-190),f"{nr} / {totaal}",font=ImageFont.truetype(BOLD,34),fill=GRIJS)
    d.text((80,H-125),"bedrijfsgeheugen.nl",font=ImageFont.truetype(BOLD,40),fill=GEEL if donker else BLAUW)
    d.rectangle([0,H-14,W,H],fill=BLAUW if donker else GEEL)
    return im

CARROUSELS={
"kennis-lekt":[("cover","Kennis lekt. Niemand ziet het.","",'lekt'),
 ("inhoud","Geen alarm. Geen melding.","Tot iemand een week weg is.",None),
 ("inhoud","1. De mailbox van \u00e9\u00e9n persoon","Afspraken die alleen daar staan.","mailbox"),
 ("inhoud","2. De Excel die niemand durft aan te raken","Formules van iemand die er niet meer werkt.","niemand durft"),
 ("inhoud","3. Afspraken die alleen mondeling bestaan","Die ene klant met die ene korting.","mondeling"),
 ("inhoud","4. De map op iemands bureaublad","Vindbaar voor \u00e9\u00e9n persoon. Op \u00e9\u00e9n laptop.","bureaublad"),
 ("inhoud","5. Het hoofd van je langstzittende medewerker","Twintig jaar uitzonderingen. Nergens opgeschreven.","langstzittende"),
 ("inhoud","Geen van de vijf staat op je balans","Alle vijf kosten geld zodra iemand wegvalt.","balans"),
 ("inhoud","Alle vijf op een rij","Mailbox \u00b7 Excel \u00b7 mondelinge afspraken \u00b7 bureaublad \u00b7 het hoofd van je langstzittende medewerker",None),
 ("slot","Ken je iemand bij wie dit speelt?","Stuur dit door.","speelt")],
"bestandsnamen":[("cover","planning_v7_DEFINITIEF(2).xlsx","je weet welk bestand ik bedoel","DEFINITIEF"),
 ("inhoud","offerte_klant_NIEUW_final.docx","","NIEUW"),
 ("inhoud","prijslijst 2024 (gebruik deze!).xlsx","","gebruik deze"),
 ("inhoud","werkinstructie_oud_NIET_GEBRUIKEN.pdf","","NIET"),
 ("inhoud","Kopie van Kopie van planning.xlsx","","Kopie van Kopie"),
 ("inhoud","vraag_aan_jan.docx","","jan"),
 ("inhoud","definitief_definitief.xlsx","","definitief_definitief"),
 ("inhoud","Grappig. Tot iemand de verkeerde pakt.","",'verkeerde'),
 ("slot","Welke staat er bij jullie?","Stuur dit naar degene die ze alle zeven maakte.","jullie")],
"tien-minuten":[("cover","Zet een wekker op tien minuten","Durf je?","tien minuten"),
 ("inhoud","Pak \u00e9\u00e9n proces dat vaak misgaat","Een spoedlevering. Een klacht. Een afwijkende order.","misgaat"),
 ("inhoud","Zoek: de werkwijze","Lukt bijna altijd.","werkwijze"),
 ("inhoud","Zoek: de uitzonderingen","Hier haakt tachtig procent af.","uitzonderingen"),
 ("inhoud","Zoek: wie beslist als het misgaat","Vaak is dat nergens vastgelegd.","wie beslist"),
 ("inhoud","Zoek: het laatste voorbeeld","Wanneer gebeurde het, en wat deden we toen?","laatste voorbeeld"),
 ("inhoud","Gelukt binnen tien minuten?","Dan zit het goed. Niet gelukt? Dan zit die kennis in hoofden.","Gelukt"),
 ("slot","Doe de test met een collega","Stuur dit door en spreek af wanneer.","collega")],
"zeven-zinnen":[("cover","Zeven zinnen die je nooit meer wilt horen","",'nooit meer'),
 ("inhoud","\u201cDat weet Jan wel.\u201d","","Jan"),
 ("inhoud","\u201cDat doen we altijd zo.\u201d","","altijd zo"),
 ("inhoud","\u201cIk stuur het je wel even.\u201d","","wel even"),
 ("inhoud","\u201cVraag het even aan de planning.\u201d","","de planning"),
 ("inhoud","\u201cDat staat ergens in mijn mail.\u201d","","ergens"),
 ("inhoud","\u201cDat weet ik uit mijn hoofd.\u201d","","uit mijn hoofd"),
 ("inhoud","Stuk voor stuk gezegd door iemand die goed is in zijn werk","En stuk voor stuk een risico.","risico"),
 ("slot","Welke hoor jij het vaakst?","Stuur dit naar diegene.","vaakst")],
"overdracht":[("cover","Twee minuten werk. Drie dagen wachten.","",'Drie dagen'),
 ("inhoud","De factuur maken","Twee minuten.","Twee minuten"),
 ("inhoud","Wachten tot iemand hem goedkeurt","Drie dagen.","Drie dagen"),
 ("inhoud","De order invoeren gaat snel","Uitzoeken wie nu aan zet is niet.","wie nu aan zet"),
 ("inhoud","De tijd zit niet in de taak","Die zit in de overdracht.","overdracht"),
 ("inhoud","Wachten wordt nergens geschreven","Daarom zie je het niet terug in je urenoverzicht.","nergens"),
 ("slot","Stuur dit naar wie bij jullie over processen gaat","","processen")]}

uit=pathlib.Path("assets/instagram"); uit.mkdir(parents=True,exist_ok=True)
for naam,slides in CARROUSELS.items():
    beelden=[]
    for i,(soort,kop,onder,mark) in enumerate(slides,start=1):
        im=slide(kop,onder,soort,i if soort=="inhoud" else None,len(slides),mark)
        im.save(uit/f"{naam}-{i}.jpg",quality=90)
        beelden.append(im)
    beelden[0].save(uit/f"{naam}.pdf",save_all=True,append_images=beelden[1:],resolution=72)
    print(f"{naam}: {len(beelden)} slides \u00b7 {(uit/f'{naam}.pdf').stat().st_size//1024} kB")
