import os, shutil
CHROMIUM_PATH=os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome') or shutil.which('msedge')
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
R=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,**({'executable_path':CHROMIUM_PATH} if CHROMIUM_PATH else {}),args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content((R/'tests/fixtures/lab.html').read_text())
 page.add_script_tag(path=str(R/'dist/content.js'))
 h=page.locator('#interface-xray-extension-host')
 h.locator('[data-action=tab][data-tab=compare]').click()
 page.wait_for_timeout(1100);h.locator('[data-action=snap-A]').click()
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(1000)
 h.locator('[data-action=snap-B]').click()
 with page.expect_download() as d:h.locator('[data-action=export-comparison]').click()
 out=R/'tests/responsive-ab-result.json';d.value.save_as(str(out))
 data=json.loads(out.read_text())
 assert data['viewportA']['width']==1440,data['viewportA']
 assert data['viewportB']['width']==390,data['viewportB']
 assert len(data['changes'])>3,len(data['changes'])
 assert h.locator('.ix-mini-map svg').count()==2
 assert not errors,errors
 page.screenshot(path=str(R/'screenshots/18-responsive-ab.png'))
 print('PASS responsive A/B actual viewports',data['viewportA']['width'],'=>',data['viewportB']['width'],'changed nodes',len(data['changes']),'new',len(data['newIssues']),'resolved',len(data['resolvedIssues']))
 browser.close()
