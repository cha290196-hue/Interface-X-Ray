"""Capture real Chromium frames (no synthetic mockups or image generation)."""
from playwright.sync_api import sync_playwright
from PIL import Image
from pathlib import Path
from io import BytesIO
ROOT=Path(__file__).resolve().parents[1]
frames=[];durations=[]
def shot(pg,ms=110):
 raw=pg.screenshot(type='png',animations='allow')
 frame=Image.open(BytesIO(raw)).convert('RGB').resize((960,600),Image.Resampling.LANCZOS)
 frames.append(frame);durations.append(ms)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
 page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
 page.set_content((ROOT/'tests/fixtures/lab.html').read_text());page.add_script_tag(path=str(ROOT/'dist/content.js'))
 root=page.locator('#interface-xray-extension-host')
 page.wait_for_timeout(600)
 page.locator('#bad-flex-element').click(force=True);page.wait_for_timeout(230)
 shot(page,600)
 root.locator('[data-action=layers]').click()
 for i in range(15):
  shot(page,90)
  page.wait_for_timeout(35)
 page.wait_for_timeout(350);shot(page,480)
 root.locator('[data-action=diagnose]').first.click();page.wait_for_timeout(400)
 shot(page,550)
 root.locator('.ix-issue').first.click();page.wait_for_timeout(350)
 shot(page,550)
 root.locator('[data-action=patch]').first.click();page.wait_for_timeout(300)
 shot(page,550)
 browser.close()
# Every frame is a screenshot of the actual running extension. Resizing and palette encoding only.
indexed=[im.quantize(colors=128,method=Image.Quantize.FASTOCTREE) for im in frames]
output=ROOT/'screenshots/interface-xray-live.gif'
indexed[0].save(output,save_all=True,append_images=indexed[1:],duration=durations,loop=0,optimize=True,disposal=2)
print('REAL GIF',output,'frames',len(frames),'size',round(output.stat().st_size/1024/1024,2),'MB')
