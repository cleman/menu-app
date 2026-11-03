# Phone-viewport smoke test of the main flows. Run: npm run build && npm run preview, then
#   python3 tests/e2e_smoke.py [screenshot_dir] [base_url]
import sys, time
from playwright.sync_api import sync_playwright

S = (sys.argv[1] if len(sys.argv) > 1 else '/tmp/shots') + '/'
URL = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:4173/'
errs = []
def shot(pg, name, full=False): pg.wait_for_timeout(250); pg.screenshot(path=S + name + '.png', full_page=full)

with sync_playwright() as p:
    import os, glob
    exe = (glob.glob('/opt/pw-browsers/chromium-*/chrome-linux64/chrome') or [None])[0]
    b = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()
    pg = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg.on('console', lambda m: m.type == 'error' and errs.append(m.text)); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('dialog', lambda d: d.accept())
    pg.goto(URL)
    # first launch: household question
    pg.get_by_role('button', name='plus').click(); pg.get_by_role('button', name="C'est parti").click()
    t0 = time.time()
    pg.get_by_role('button', name='Commencer un plan').click(); pg.get_by_role('button', name='Créer le plan').click()
    pg.get_by_role('button', name='✨ Proposer').click(); pg.get_by_role('button', name='Proposer', exact=False).last.click()
    # ideas: multi-select, sheet stays open, filters
    pg.get_by_role('button', name='+ Ajouter').first.click()
    pg.get_by_role('button', name='Végé', exact=True).click()
    items = pg.locator('.plist button'); n = items.count(); print('veg plats', n)
    items.nth(0).click(); items.nth(1).click(); items.nth(2).click()
    shot(pg, '1-picker')
    print('picker still open:', pg.locator('.sheet').count() == 1)
    pg.get_by_role('button', name='Terminé', exact=False).click()
    pg.locator('button.add').first.click(); pg.locator('.plist button').first.click()     # slot: 2 taps
    print('plan built in %.1fs' % (time.time() - t0)); shot(pg, '2-plan')
    # shopping: proposal → cart → put away
    pg.locator('.tabs button').nth(2).click(); pg.wait_for_timeout(400); shot(pg, '3-proposal')
    rows = pg.locator('.aisle .items li'); print('proposal rows', rows.count())
    rows.nth(0).locator('input').uncheck(); rows.nth(1).locator('input').uncheck()
    pg.get_by_role('button', name="🏠 Vérifier ce que j'ai").click(); pg.get_by_role('button', name='OK, mettre à jour la liste').click()
    pg.get_by_role('button', name='Valider', exact=False).click(); pg.wait_for_timeout(400)
    cart = pg.locator('.aisle .items li'); print('cart rows', cart.count())
    cart.nth(0).locator('button.qty').click(); pg.locator('.qtyin').fill('500'); pg.locator('.sheet select').select_option('g')
    pg.get_by_role('button', name='OK (et coché)').click()
    cart.nth(1).locator('input').check(); cart.nth(2).locator('button[aria-label^="Retirer"]').click()
    shot(pg, '4-cart')
    pg.get_by_role('button', name='Ranger', exact=False).first.click(); pg.get_by_role('button', name='Ranger', exact=True).click(); pg.wait_for_timeout(400)
    print('cart left', pg.locator('.aisle .items li').count())
    pg.locator('.tabs button').nth(3).click(); shot(pg, '5-maison'); print('home items', pg.locator('.items li').count())
    # recipes: filters + paste a whole recipe
    pg.locator('.tabs button').nth(1).click(); pg.get_by_role('button', name='Desserts', exact=True).click(); print('desserts', pg.locator('.rcards li').count())
    shot(pg, '6-recipes')
    pg.get_by_role('button', name='📋 Coller').click()
    pg.locator('.sheet textarea').fill("Gratin dauphinois\nPour 6 personnes\nPréparation : 20 min\nCuisson : 1 h\nIngrédients\n1,5 kg de pommes de terre\n50 cl de crème liquide\n2 gousses d'ail\nune pincée de noix de muscade\nsel, poivre\nPréparation\n1. Préchauffer le four à 180 °C.\n2. Trancher les pommes de terre.\n3. Cuire 1 h.")
    pg.get_by_role('button', name='Analyser la recette').click(); shot(pg, '7-pasted', True)
    pg.get_by_role('button', name='Enregistrer la recette').click()
    # share target
    pg.goto(URL + '?share=1&title=Salade&text=' + 'Salade de lentilles%0A200 g de lentilles vertes%0A1 échalote%0A2 c. à soupe de vinaigre%0AFaire cuire les lentilles 25 min.%0AMélanger.')
    pg.wait_for_timeout(800); print('share opened editor:', pg.locator('.sheet h2').first.inner_text() if pg.locator('.sheet').count() else None)
    pg.emulate_media(color_scheme='dark'); pg.keyboard.press('Escape'); pg.locator('.tabs button').nth(0).click(); shot(pg, '8-dark')
    print('ERRORS', errs)
    b.close()
