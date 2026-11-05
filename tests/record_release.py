import os, shutil
CHROMIUM_PATH=os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome') or shutil.which('msedge')
"""Record actual Chromium interaction frames for the repository (never synthetic screenshots)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
media=R/'media';media.mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,**({'executable_path':CHROMIUM_PATH} if CHROMIUM_PATH else {}),args=['--no-sandbox','--enable-unsafe-swiftshader'])
 ctx=browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1,record_video_dir=str(media),record_video_size={'width':1440,'height':900})
 pg=ctx.new_page();pg.set_content((R/'tests/fixtures/lab.html').read_text());pg.add_script_tag(path=str(R/'dist/content.js'))
 h=pg.locator('#interface-xray-extension-host');h.locator('.ix-tree-row').first.wait_for(timeout=9000)
 pg.wait_for_timeout(1000)
 pg.locator('#bad-flex-element').click(force=True);pg.wait_for_timeout(900)
 h.locator('[data-action=diagnose]').first.click();pg.wait_for_timeout(700)
 h.locator('.ix-issue').first.click();pg.wait_for_timeout(850)
 h.locator('[data-action=patch]').first.click();pg.wait_for_timeout(500)
 h.locator('#ix-prop').select_option('min-width');h.locator('#ix-value').fill('0px');h.locator('[data-action=apply-patch]').click();pg.wait_for_timeout(750)
 h.locator('[data-action=layers]').click();pg.wait_for_timeout(1250)
 pg.mouse.move(590,415);pg.mouse.down();pg.mouse.move(676,473,steps=17);pg.mouse.up();pg.wait_for_timeout(850)
 h.locator('#ix-scene-type').select_option('stack');pg.wait_for_timeout(750)
 h.locator('#ix-scene-type').select_option('dom');pg.wait_for_timeout(350)
 h.locator('[data-action=tab][data-tab=compare]').click();h.locator('[data-action=snap-A]').click();pg.wait_for_timeout(450)
 h.locator('[data-action=tab][data-tab=patch]').click();h.locator('[data-action=undo]').click();pg.wait_for_timeout(300)
 h.locator('[data-action=tab][data-tab=compare]').click();h.locator('[data-action=snap-B]').click();pg.wait_for_timeout(1100)
 h.locator('[data-action=settings]').first.click();h.locator('#ix-theme').select_option('light');pg.wait_for_timeout(650)
 h.locator('#ix-theme').select_option('dark');pg.wait_for_timeout(400)
 video=pg.video
 pg.close()
 video.save_as(str(media/'interface-xray-final.webm'))
 ctx.close();browser.close()
 print('Chromium video saved:',(media/'interface-xray-final.webm').stat().st_size)
