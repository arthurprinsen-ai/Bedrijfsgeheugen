# -*- coding: utf-8 -*-
"""Loopt elke publieke pagina langs in een browser en meldt wat er stuk is.

Aanleiding: bij een operatie over alle pagina's tegelijk (het gelijktrekken van de
site-chrome) belandde de voettekst midden in een JavaScript-tekenreeks. Het hele
scriptblok van de Frisse blik kreeg daardoor een syntaxisfout en de scan startte
maandenlang niet. Dat soort schade is met het blote oog niet te zien: de pagina
ziet er prima uit, alleen doet hij niets.
"""
import glob, http.server, os, socketserver, threading, urllib.request, functools, sys

from playwright.sync_api import sync_playwright

POORT = 0  # het besturingssysteem kiest een vrije poort
WORTEL = os.getcwd()

# pagina's die bewust geen site-chrome hebben of niet publiek zijn
OVERSLAAN = {'index-oud', 'klantportaal', 'klantportaal-demo'}
# pagina's die bewust geen kruimelpad hebben
GEEN_KRUIMEL = {'index', '404'}
# een foutpagina hoort niet naar zichzelf te verwijzen
GEEN_CANONICAL = {'404'}


class StilleServer(socketserver.TCPServer):
    allow_reuse_address = True


class StilleHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def start_server():
    global POORT
    handler = functools.partial(StilleHandler, directory=WORTEL)
    httpd = StilleServer(('127.0.0.1', 0), handler)
    POORT = httpd.server_address[1]
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def bestaat(pad):
    """Is deze interne link te bereiken? Probeert ook .html en /index.html."""
    schoon = pad.split('#')[0].split('?')[0].rstrip('/')
    if not schoon or schoon.startswith('//'):
        return True
    for kandidaat in (schoon, schoon + '.html', schoon + '/index.html'):
        try:
            urllib.request.urlopen('http://127.0.0.1:%d%s' % (POORT, kandidaat), timeout=4)
            return True
        except Exception:
            pass
    return False


def main():
    start_server()
    paginas = sorted(
        os.path.basename(f)[:-5] for f in glob.glob('*.html')
        if os.path.basename(f)[:-5] not in OVERSLAAN
    )

    problemen = {}
    gecontroleerd = 0

    with sync_playwright() as pw:
        browser = pw.chromium.launch()

        for naam in paginas:
            gecontroleerd += 1
            fouten = []

            pagina = browser.new_page(viewport={'width': 1280, 'height': 900})
            js_fouten = []
            pagina.on('pageerror', lambda e: js_fouten.append(str(e)))
            pagina.goto('http://127.0.0.1:%d/%s.html' % (POORT, naam), wait_until='load')
            pagina.wait_for_timeout(900)

            if js_fouten:
                fouten.append('JavaScript-fout: %s' % js_fouten[0][:160])

            koppen = pagina.eval_on_selector_all('.bgkop', 'e=>e.length')
            voeten = pagina.eval_on_selector_all('footer.bgvoet', 'e=>e.length')
            h1s = pagina.eval_on_selector_all('h1', 'e=>e.length')

            if koppen != 1:
                fouten.append('header ontbreekt of staat er dubbel (%d gevonden)' % koppen)
            if voeten != 1:
                fouten.append('voettekst ontbreekt of staat er dubbel (%d gevonden)' % voeten)
            if h1s != 1:
                fouten.append('%d keer een h1 — er hoort er precies één te zijn' % h1s)

            if naam not in GEEN_KRUIMEL and not pagina.eval_on_selector_all('.bgkruim', 'e=>e.length'):
                fouten.append('kruimelpad ontbreekt')

            # kop en omschrijving
            titel = pagina.title()
            oms = pagina.eval_on_selector_all(
                'meta[name="description"]', 'e=>e.map(x=>x.content)')
            canon = pagina.eval_on_selector_all(
                'link[rel="canonical"]', 'e=>e.map(x=>x.href)')
            if not titel or len(titel) < 12:
                fouten.append('titel ontbreekt of is te kort')
            if not oms or len(oms[0]) < 50:
                fouten.append('meta-omschrijving ontbreekt of is te kort')
            if not canon and naam not in GEEN_CANONICAL:
                fouten.append('canonical ontbreekt')

            # interne links
            links = pagina.eval_on_selector_all(
                'a[href^="/"]', 'e=>[...new Set(e.map(x=>x.getAttribute("href")))]')
            dood = [l for l in links if not bestaat(l)]
            if dood:
                fouten.append('link gaat nergens heen: %s' % ', '.join(dood[:4]))

            pagina.close()

            # telefoonscherm
            mob = browser.new_page(viewport={'width': 390, 'height': 844})
            mob.goto('http://127.0.0.1:%d/%s.html' % (POORT, naam), wait_until='load')
            mob.wait_for_timeout(600)
            if mob.evaluate(
                'document.documentElement.scrollWidth > document.documentElement.clientWidth + 2'
            ):
                schuldig = mob.evaluate("""()=>{const w=document.documentElement.clientWidth;
                  const e=[...document.querySelectorAll('*')].find(x=>x.getBoundingClientRect().right>w+2);
                  return e ? e.tagName+'.'+String(e.className).slice(0,40) : 'onbekend';}""")
            
                fouten.append('loopt buiten beeld op een telefoon (%s)' % schuldig)
            mob.close()

            if fouten:
                problemen[naam] = fouten

        browser.close()

    # rapport
    regels = ['# Paginacontrole', '',
              '%d pagina\'s gecontroleerd.' % gecontroleerd, '']
    if problemen:
        aantal = len(problemen)
        regels.append('**%d pagina%s met een probleem.**' % (aantal, '' if aantal == 1 else "'s"))
        regels.append('')
        for naam, fouten in problemen.items():
            regels.append('### /%s' % naam)
            for f in fouten:
                regels.append('- %s' % f)
            regels.append('')
    else:
        regels.append('Geen problemen gevonden. Elke pagina heeft een header, een voettekst '
                      'en precies één h1, draait zonder JavaScript-fouten, past op een telefoon '
                      'en heeft geen dode interne links.')

    with open('rapport.md', 'w', encoding='utf-8') as f:
        f.write('\n'.join(regels) + '\n')

    print('\n'.join(regels))
    sys.exit(1 if problemen else 0)


if __name__ == '__main__':
    main()
