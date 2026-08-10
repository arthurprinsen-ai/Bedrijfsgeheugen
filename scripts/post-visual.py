from PIL import Image, ImageDraw, ImageFont
import textwrap, sys, pathlib
F="/home/claude/bric/bricolage-main/fonts/ttf/"
BOLD=F+"BricolageGrotesque-ExtraBold.ttf"
INST="/home/claude/inst/instrumentsans-main/fonts/ttf/InstrumentSans-Medium.ttf"
import os
if not os.path.exists(INST): INST=BOLD
PAPIER,INKT,BLAUW,GEEL,GRIJS=(251,250,247),(20,23,26),(39,66,214),(255,232,107),(92,100,110)

def geeltje(d,x,y,s):
    h=s*0.30; r=s*0.10
    d.rounded_rectangle([x,y,x+s,y+s],radius=r,fill=GEEL)
    d.polygon([(x+s-h,y+s),(x+s,y+s-h),(x+s,y+s)],fill=PAPIER)
    d.polygon([(x+s-h,y+s-h),(x+s,y+s-h),(x+s-h,y+s)],fill=INKT)
    lw=max(2,int(s*0.075)); ly=y+s*0.26
    for i,br in enumerate([0.56,0.40,0.30]):
        d.rounded_rectangle([x+s*0.17,ly+i*s*0.20,x+s*0.17+s*br,ly+i*s*0.20+lw],radius=lw/2,fill=INKT)

def maak(bestand, kop, onder, mark=None):
    W=H=1080
    im=Image.new("RGB",(W,H),PAPIER); d=ImageDraw.Draw(im)
    # merkbalk links
    d.rectangle([0,0,18,H],fill=BLAUW)
    geeltje(d,84,84,86)
    # kop
    grootte=96
    while grootte>52:
        f=ImageFont.truetype(BOLD,grootte)
        regels=textwrap.wrap(kop, width=max(12,int(1500/grootte)))
        hoog=len(regels)*grootte*1.12
        if hoog<520 and all(d.textlength(r,font=f)<W-190 for r in regels): break
        grootte-=4
    y=270
    for r in regels:
        if mark and mark.lower() in r.lower():
            i=r.lower().find(mark.lower())
            x0=84+d.textlength(r[:i],font=f); wm=d.textlength(r[i:i+len(mark)],font=f)
            d.rectangle([x0-8,y+grootte*0.52,x0+wm+12,y+grootte*1.02],fill=GEEL)
        d.text((84,y),r,font=f,fill=INKT); y+=grootte*1.12
    # ondertitel
    fo=ImageFont.truetype(INST,42)
    y+=34
    for r in textwrap.wrap(onder, width=44)[:3]:
        d.text((84,y),r,font=fo,fill=GRIJS); y+=56
    # voet
    d.rectangle([84,H-150,84+340,H-146],fill=INKT)
    d.text((84,H-128),"bedrijfsgeheugen.nl",font=ImageFont.truetype(BOLD,40),fill=BLAUW)
    d.rectangle([0,H-16,W,H],fill=GEEL)
    im.save(bestand,quality=92)
    print(bestand, pathlib.Path(bestand).stat().st_size//1024,"kB")

maak("assets/posts/founder-story.jpg","De kennis was er wel. Vindbaar nooit.","Waarom ik Bedrijfsgeheugen ben gestart","Vindbaar nooit")
maak("assets/posts/kennis-lekt.jpg","Vijf plekken waar jouw kennis weglekt","Geen van de vijf staat op je balans","weglekt")
