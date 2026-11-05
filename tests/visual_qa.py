"""Real Chromium geometry checks for panel viewport bounds, toolbar controls, and DPI 2."""
import os,shutil,json
from pathlib import Path
from playwright.sync_api import sync_playwright
BROWSER=os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome') or shutil.which('msedge')
ROOT=Path(__file__).resolve().parents[1]
checks=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':BROWSER} if BROWSER else {}))
 for width,height,dpr in [(390,844,1),(768,900,1),(1440,900,1),(1440,900,2)]:
  ctx=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=dpr)
  page=ctx.new_page();page.set_content((ROOT/'tests/fixtures/lab.html').read_text());page.add_script_tag(path=str(ROOT/'dist/content.js'))
  host=page.locator('#interface-xray-extension-host');host.locator('.ix-panel').wait_for()
  out=page.evaluate('''() => {
   const sr=document.querySelector('#interface-xray-extension-host').shadowRoot;
   const c=sr.querySelector('.ix-toolbar'),p=sr.querySelector('.ix-panel'),body=sr.querySelector('.ix-panel-body');
   const rect=el=>{const x=el.getBoundingClientRect();return {x:x.x,y:x.y,width:x.width,height:x.height,left:x.left,right:x.right,bottom:x.bottom}};
   const iconButtons=[...sr.querySelectorAll('.ix-iconbtn')].map(el=>{const r=el.getBoundingClientRect(),svg=el.querySelector('svg')?.getBoundingClientRect();return {label:el.getAttribute('aria-label'),deltaX:svg?Math.abs(svg.x+svg.width/2-(r.x+r.width/2)):null,deltaY:svg?Math.abs(svg.y+svg.height/2-(r.y+r.height/2)):null};});
   return {toolbar:rect(c),panel:rect(p),bodyOverflow:body.scrollWidth-body.clientWidth,iconButtons};
  }''')
  ok=(out['panel']['left']>=0 and out['panel']['right']<=width+1 and out['toolbar']['left']>=0 and out['toolbar']['right']<=width+1 and out['bodyOverflow']<=3 and all(item['deltaX'] is not None and item['deltaX']<2 and item['deltaY']<2 for item in out['iconButtons']))
  checks.append({'viewport':f'{width}x{height}', 'dpr':dpr,'pass':ok,'geometry':out})
  print('PASS' if ok else 'FAIL',f'{width}x{height}@{dpr}', 'body_overflow',out['bodyOverflow'],'buttons',len(out['iconButtons']))
  if width==1440 and dpr==2:
   host.locator('[data-action=layers]').click();page.wait_for_timeout(1000)
   dimensions=host.locator('#ix-canvas').evaluate('e=>({w:e.width,h:e.height})')
   ok=dimensions=={'w':2880,'h':1800};checks.append({'check':'DPI2 canvas pixel resolution','pass':ok,'dimensions':dimensions})
   print('PASS' if ok else 'FAIL','DPI2 canvas',dimensions)
  if width==390 and dpr==1:page.screenshot(path=str(ROOT/'screenshots/20-final-mobile.png'))
  if width==1440 and dpr==2:page.screenshot(path=str(ROOT/'screenshots/21-final-dpi2.png'))
  ctx.close()
 browser.close()
(ROOT/'tests/visual-qa-results.json').write_text(json.dumps(checks,indent=2))
assert all(c['pass'] for c in checks)
