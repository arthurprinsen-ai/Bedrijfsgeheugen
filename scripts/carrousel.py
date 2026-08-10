"""Carrousel als PDF in de huisstijl. Acht slides, 1080x1080.
Aanroepen: python3 scripts/carrousel.py  (pas SLIDES hieronder aan)"""
from PIL import Image, ImageDraw, ImageFont
import textwrap, pathlib
F="/home/claude/bric/bricolage-main/fonts/ttf/"
BOLD=F+"BricolageGrotesque-ExtraBold.ttf"
PAPIER,INKT,BLAUW,GEEL,GRIJS=(251,250,247),(20,23,26),(39,66,214),(255,232,107),(92,100,110)
W=H=1080

def geeltje(d,x,y,s,op_donker=False):
    h=s*0.30; r=s*0.10
    achter = INKT if op_donker else PAPIER
    d.rounded_rectangle([x,y,x+s,y+s],radius=r,fill=GEEL)
    d.polygon([(x+s-h,y+s),(x+s,y+s-h),(x+s,y+s)],fill=achter)
    d.polygon([(x+s-h,y+s-h),(x+s,y+s-h),(x+s-h,y+s)],fill=INKT)
    lw=max(2,int(s*0.075)); ly=y+s*0.26
    for i,br in enumerate([0.56,0.40,0.30]):
        d.rounded_rectangle([x+s*0.17,ly+i*s*0.20,x+s*0.17+s*br,ly+i*s*0.20+lw],radius=lw/2,fill=INKT)

def past(d,tekst,f,breedte):
    return textwrap.wrap(tekst, width=breedte)

def slide(nr, kop, onder="", mark=None, soort="inhoud", totaal=8):
    donker = soort=="cover"
    bg = INKT if donker else PAPIER
    tekstkleur = PAPIER if donker else INKT
    im=Image.new("RGB",(W,H),bg); d=ImageDraw.Draw(im)
    if not donker: d.rectangle([0,0,18,H],fill=BLAUW)
    geeltje(d,84,84,80,donker)

    grootte = 104 if soort=="cover" else 88
    while grootte>44:
        f=ImageFont.truetype(BOLD,grootte)
        regels=past(d,kop,f,max(11,int(1400/grootte)))
        if len(regels)*grootte*1.12 < 520 and all(d.textlength(r,font=f)<W-190 for r in regels): break
        grootte-=4
    y = 300 if soort=="cover" else 280
    for r in regels:
        if mark and mark.lower() in r.lower() and not donker:
            i=r.lower().find(mark.lower())
            x0=84+d.textlength(r[:i],font=f); wm=d.textlength(r[i:i+len(mark)],font=f)
            d.rectangle([x0-8,y+grootte*0.52,x0+wm+12,y+grootte*1.02],fill=GEEL)
        d.text((84,y),r,font=f,fill=tekstkleur); y+=grootte*1.12
    if donker and mark:
        d.rectangle([84,y+6,84+360,y+16],fill=GEEL)
        y+=34
    if onder:
        fo=ImageFont.truetype(BOLD,40); y+=26
        for r in past(d,onder,fo,42)[:4]:
            d.text((84,y),r,font=fo,fill=GEEL if donker else GRIJS); y+=54
    # nummering en swipe
    fk=ImageFont.truetype(BOLD,34)
    if soort=="cover":
        d.text((84,H-150),"Swipe \u2192",font=ImageFont.truetype(BOLD,44),fill=GEEL)
    elif soort=="inhoud":
        d.text((84,H-150),f"{nr} / {totaal}",font=fk,fill=GRIJS)
    d.text((84,H-100),"bedrijfsgeheugen.nl",font=ImageFont.truetype(BOLD,38),fill=GEEL if donker else BLAUW)
    d.rectangle([0,H-16,W,H],fill=GEEL if not donker else BLAUW)
    return im

SLIDES=[
 ("cover","Vijf plekken waar jouw kennis weglekt","Geen van de vijf staat op je balans","weglekt"),
 ("inhoud","Kennis verdwijnt zelden in \u00e9\u00e9n keer","Het lekt. Langzaam, en zonder dat iemand het merkt.","lekt"),
 ("inhoud","1. De mailbox van \u00e9\u00e9n persoon","Afspraken die alleen daar staan. Niemand anders kan erbij.","mailbox"),
 ("inhoud","2. De Excel die niemand durft aan te raken","Formules van iemand die er niet meer werkt.","niemand durft"),
 ("inhoud","3. Afspraken die alleen mondeling bestaan","Die ene klant met die ene korting. Weet je het nog?","mondeling"),
 ("inhoud","4. De map op iemands bureaublad","Vindbaar voor \u00e9\u00e9n persoon. Op \u00e9\u00e9n laptop.","bureaublad"),
 ("inhoud","5. Het hoofd van je langstzittende medewerker","Twintig jaar uitzonderingen. Nergens opgeschreven.","langstzittende"),
 ("slot","Welke van de vijf herken je?","Zeg het in de reacties \u2014 dan weet je meteen waar je zou beginnen.","herken je"),
]

uit=pathlib.Path("assets/posts"); uit.mkdir(parents=True,exist_ok=True)
beelden=[]
for i,(soort,kop,onder,mark) in enumerate(SLIDES, start=1):
    im=slide(i,kop,onder,mark,soort,len(SLIDES))
    im.save(uit/f"kennis-lekt-{i}.jpg",quality=90)
    beelden.append(im.convert("RGB"))
beelden[0].save(uit/"kennis-lekt-carrousel.pdf", save_all=True, append_images=beelden[1:], resolution=72)
print("pdf:", (uit/"kennis-lekt-carrousel.pdf").stat().st_size//1024, "kB \u00b7", len(beelden), "slides")
