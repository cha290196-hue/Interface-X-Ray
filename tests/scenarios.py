import os, shutil
CHROMIUM_PATH=os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome') or shutil.which('msedge')
"""Deterministic Chromium layout diagnosis regression tests across 11 real DOM fixtures."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1]
CASES=['article','flex','grid','nested-scroll','overflow','clip','fixed-overlay','large-dom','dynamic-spa','mobile','shadow-transform','floating-overlap','small-control']
EXPECTED={
 'article':None,'flex':'flex-grid-constraint','grid':None,'nested-scroll':None,
 'overflow':'horizontal-overflow','clip':'clipped-content','fixed-overlay':'fixed-overlay',
 'large-dom':None,'dynamic-spa':None,'mobile':None,'shadow-transform':None,'floating-overlap':'floating-overlap','small-control':'small-control'
}
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(**({'executable_path':CHROMIUM_PATH} if CHROMIUM_PATH else {}),headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
 for name in CASES:
  page=browser.new_page(viewport={'width':390 if name=='mobile' else 1200,'height':760})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content((ROOT/'tests/fixtures/scenarios'/f'{name}.html').read_text())
  page.add_script_tag(path=str(ROOT/'dist/content.js'))
  page.wait_for_timeout(1100 if name=='large-dom' else 450)
  host=page.locator('#interface-xray-extension-host'); assert host.count()==1,name+' injection'
  host.locator('[data-action=settings]').first.click();host.locator('#ix-locale').select_option('en');host.locator('[data-action=diagnose]').first.click();page.wait_for_timeout(250)
  diagnosed=host.locator('.ix-panel-body').inner_text().lower()
  issue_count=host.locator('.ix-issue').count()
  want=EXPECTED[name]
  ok= True
  if want=='horizontal-overflow':ok=('document horizontal overflow' in diagnosed)
  if want=='flex-grid-constraint':ok=('flex / grid constraint' in diagnosed)
  if want=='clipped-content':ok=('clipped content' in diagnosed)
  if want=='fixed-overlay':ok=('fixed' in diagnosed)
  if want=='floating-overlap':ok=('floating-element overlap' in diagnosed)
  if want=='small-control':ok=('small control' in diagnosed)
  if name=='large-dom':ok=('3500 nodes' in host.locator('.ix-status').inner_text())
  if name=='dynamic-spa':
   before=host.locator('.ix-status').inner_text();page.locator('#append').click();page.wait_for_timeout(1100);after=host.locator('.ix-status').inner_text();ok=before!=after
  if name=='shadow-transform':
   host.locator('[data-action=tab][data-tab=elements]').click()
   host.locator('#ix-search').fill('shadow-child')
   ok=host.locator('.ix-tree-row').count()>0
  results.append({'case':name,'passed':ok and not errors,'issues':issue_count,'jsErrors':errors,'expectedRule':want})
  print(name,'PASS' if ok and not errors else 'FAIL','findings',issue_count,'errors',errors[:1],flush=True)
  page.close()
 browser.close()
(ROOT/'tests/scenario-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
assert all(r['passed'] for r in results),'One or more real-layout scenarios failed; see tests/scenario-results.json'
