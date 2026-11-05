import os, shutil
CHROMIUM_PATH=os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome') or shutil.which('msedge')
"""Real Chromium + Playwright integration test, with authentic screenshots."""
from pathlib import Path
import asyncio, json, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
SHOTS = ROOT / 'screenshots'
SHOTS.mkdir(exist_ok=True)

async def test():
    errors=[]
    server=ThreadingHTTPServer(('127.0.0.1',0),lambda *args,**kwargs:SimpleHTTPRequestHandler(*args,directory=str(ROOT),**kwargs))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    async with async_playwright() as p:
        browser=await p.chromium.launch(**({'executable_path':CHROMIUM_PATH} if CHROMIUM_PATH else {}),headless=True,args=['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        page=await browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
        page.on('pageerror',lambda error:errors.append(str(error)))
        await page.set_content((ROOT / 'tests/fixtures/lab.html').read_text())
        await page.add_script_tag(path=str(ROOT / 'dist/content.js'))
        shadow=page.locator('#interface-xray-extension-host')
        await shadow.locator('.ix-toolbar').wait_for()
        await page.wait_for_timeout(1250)
        print('Start',await shadow.locator('.ix-panel').inner_text(timeout=5000))
        await page.screenshot(path=str(SHOTS/'01-inspector.png'),full_page=False)
        print('Nodes',await shadow.locator('.ix-status').inner_text())
        assert await shadow.locator('.ix-tree-row').count()>5
        await page.locator('#bad-flex-element').click(force=True)
        await page.wait_for_timeout(180)
        assert await shadow.locator('.ix-card.selected').count()>=1
        assert 'bad-flex-element' in await shadow.locator('.ix-card.selected').first.inner_text()
        await page.screenshot(path=str(SHOTS/'02-box-model.png'))
        await shadow.locator('[data-action=diagnose]').first.click()
        await page.wait_for_timeout(500)
        issues=await shadow.locator('.ix-issue').count()
        print('Diagnosis issues',issues)
        assert issues>=1
        await page.screenshot(path=str(SHOTS/'03-diagnostics.png'))
        await shadow.locator('.ix-issue').first.click()
        assert await shadow.locator('.ix-trace-step').count()>0
        await page.screenshot(path=str(SHOTS/'04-cause-trace.png'))
        await shadow.locator('[data-action=patch]').first.click()
        await shadow.locator('#ix-prop').select_option('min-width')
        before=await page.locator('#bad-flex-element').evaluate('(el)=>getComputedStyle(el).minWidth')
        await shadow.locator('#ix-value').fill('0px')
        await shadow.locator('[data-action=apply-patch]').click()
        after=await page.locator('#bad-flex-element').evaluate('(el)=>getComputedStyle(el).minWidth')
        print('Patch',before,'->',after)
        assert before=='1500px' and after=='0px'
        await page.screenshot(path=str(SHOTS/'05-css-patch.png'))
        await shadow.locator('[data-action=undo]').click()
        undone=await page.locator('#bad-flex-element').evaluate('(el)=>getComputedStyle(el).minWidth')
        assert undone==before, f'Undo failed: {undone}'
        await shadow.locator('[data-action=redo]').click()
        assert await page.locator('#bad-flex-element').evaluate('(el)=>getComputedStyle(el).minWidth')=='0px'
        await shadow.locator('[data-action=layers]').click()
        await page.wait_for_timeout(1400)
        await page.screenshot(path=str(SHOTS/'06-3d-layers.png'))
        scene=await shadow.locator('canvas#ix-canvas').evaluate('(c)=>({width:c.width,height:c.height,gl:!!c.getContext("webgl2")})')
        print('3D canvas',scene)
        assert scene['width']>0 and scene['height']>0
        await shadow.locator('#ix-scene-type').select_option('stack')
        await page.wait_for_timeout(350)
        await page.screenshot(path=str(SHOTS/'07-stacking-contexts.png'))
        await shadow.locator('[data-action=settings]').first.click()
        await page.screenshot(path=str(SHOTS/'08-settings.png'))
        await shadow.locator('#ix-theme').select_option('light')
        assert await shadow.locator('#ix-root').get_attribute('data-theme')=='light'
        await page.screenshot(path=str(SHOTS/'09-light-theme.png'))
        await shadow.locator('[data-action=tab][data-tab=compare]').click()
        await shadow.locator('[data-action=snap-A]').click()
        await shadow.locator('[data-action=tab][data-tab=patch]').click()
        await shadow.locator('#ix-prop').select_option('width')
        await shadow.locator('#ix-value').fill('120px')
        await shadow.locator('[data-action=apply-patch]').click()
        await page.wait_for_timeout(500)
        await shadow.locator('[data-action=tab][data-tab=compare]').click()
        await shadow.locator('[data-action=snap-B]').click()
        await page.screenshot(path=str(SHOTS/'10-before-after.png'))
        await shadow.locator('[data-action=tab][data-tab=snapshots]').click()
        async with page.expect_download() as d:
            await shadow.locator('[data-action=export-report]').click()
        download=await d.value
        await download.save_as(str(ROOT/'screenshots/diagnostic-sample.json'))
        obj=json.loads((ROOT/'screenshots/diagnostic-sample.json').read_text())
        assert len(obj['issues'])>=1
        await page.screenshot(path=str(SHOTS/'11-exports.png'))
        await shadow.locator('[data-action=exit]').click()
        assert await page.locator('#interface-xray-extension-host').count()==0
        assert await page.locator('#bad-flex-element').evaluate('(el)=>getComputedStyle(el).minWidth')=='1500px'
        print('UI test completed, errors:',errors)
        assert not errors, errors
        await page.set_viewport_size({'width':390,'height':844})
        await page.add_script_tag(path=str(ROOT/'dist/content.js'))
        await page.wait_for_timeout(1100)
        assert '0 nodes' not in await page.locator('#interface-xray-extension-host').locator('.ix-status').inner_text(), 'Re-open should rescan'
        await page.screenshot(path=str(SHOTS/'12-small-screen.png'))
        panel=await page.locator('#interface-xray-extension-host').locator('.ix-panel').bounding_box()
        print('Mobile panel',panel)
        assert panel['width']<=390 and panel['x']>=0
        await browser.close()
    server.shutdown()

if __name__=='__main__': asyncio.run(test())
