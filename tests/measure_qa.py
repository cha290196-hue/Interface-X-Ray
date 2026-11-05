import os, shutil
CHROMIUM_PATH=os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome') or shutil.which('msedge')
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(**({'executable_path':CHROMIUM_PATH} if CHROMIUM_PATH else {}),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':900})
 errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 page.set_content((ROOT/'tests/fixtures/lab.html').read_text())
 page.add_script_tag(path=str(ROOT/'dist/content.js'))
 root=page.locator('#interface-xray-extension-host')
 root.locator('[data-action=measure]').click()
 page.locator('.stats .stat').nth(0).click(force=True)
 page.locator('.stats .stat').nth(1).click(force=True)
 assert 'gap' in root.locator('.ix-overlay').inner_html().lower(),root.locator('.ix-overlay').inner_html()[-200:]
 assert root.locator('[data-action=measure]').get_attribute('class').find('active')<0
 page.wait_for_timeout(3000)
 assert root.locator('.ix-toast').count()<=3
 page.screenshot(path=str(ROOT/'screenshots/16-measurement.png'))
 print('Measurement between real rectangles and toast cap passed',root.locator('.ix-toast').count())
 root.locator('[data-action=tab][data-tab=elements]').click()
 page.locator('#clip-child').click(force=True)
 clip=page.evaluate("""() => {const svg=document.querySelector('#interface-xray-extension-host').shadowRoot.querySelector('.ix-overlay');return svg.innerHTML;}""")
 assert 'stroke="#f4c486"' in clip or 'stroke="#6ae3d4"' in clip
 page.screenshot(path=str(ROOT/'screenshots/17-clipping-geometry.png'))
 print('Visible clipping geometry overlay passed',len(clip),'characters')
 assert not errs,errs
 browser.close()
