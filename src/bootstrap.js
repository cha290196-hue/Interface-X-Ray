function start(){if(X.host?.isConnected)return;X.paused=false;X.selecting=true;X.measuring=false;X.measureAnchor=null;X.measurePair=null;X.truncated=false;X.scanVersion++;X.shadowObservers=[];X.shadowObserved=new WeakSet();X.treeScroll=0;
X.host=document.createElement('div');X.host.id='interface-xray-extension-host';X.host.setAttribute('data-interface-xray','true');X.host.style.cssText='all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;';
X.shadow=X.host.attachShadow({mode:'open'});const sheet=document.createElement('style');sheet.textContent=STYLES;X.shadow.appendChild(sheet);
X.root=document.createElement('div');X.root.id='ix-root';X.root.className='ix-app';X.root.dataset.theme=X.theme;
X.root.innerHTML=`<div class="ix-scene" hidden><canvas id="ix-canvas" aria-label="3D DOM layer visualization"></canvas><div class="ix-scene-unsupported" hidden>Your browser does not support WebGL2.</div></div>
<svg class="ix-overlay" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="none"></svg>
<div class="ix-hud" hidden></div><div class="ix-toolbar" role="toolbar" aria-label="Interface X-Ray tools"></div>
<aside class="ix-panel" aria-label="Interface X-Ray inspector"></aside>
<div class="ix-scene-controls" hidden><div class="ix-row"><strong>SPATIAL EXPLORER</strong><span class="ix-scene-count">0 visible nodes</span></div><div class="ix-row"><label>Hierarchy<select class="ix-select" id="ix-scene-type"><option value="dom">DOM hierarchy</option><option value="stack">Stacking contexts*</option></select></label>${btn('scene-reset','Reset camera','target','ix-outline')}</div><div><label>Depth limit <span class="ix-tiny">1 — 32</span></label><input class="ix-input" type="range" id="ix-depth" min="1" max="32" value="${X.opts.depth}"></div><div><label>Plane opacity <span class="ix-tiny">15 — 100%</span></label><input class="ix-input" type="range" id="ix-alpha" min="15" max="100" value="${X.opts.alpha*100}"></div><div class="ix-scene-legend"><span><i class="container"></i>Containers</span><span><i class="interactive"></i>Interactive</span><span><i class="media"></i>Media</span><span><i class="issue"></i>Findings</span></div><div class="ix-tiny">Drag to orbit · Shift+drag to pan · Wheel to zoom · Click to inspect. *Inferred CSS stacking contexts, not compositor layers.</div></div>
<div class="ix-scene-tip" hidden></div><div class="ix-toasts" role="status" aria-live="polite"></div><div class="ix-modal-wrap" hidden></div><div class="ix-privacy-mask"></div>`;
X.shadow.appendChild(X.root);(document.documentElement||document.body).appendChild(X.host);
X.overlay=X.shadow.querySelector('.ix-overlay');X.toolbar=X.shadow.querySelector('.ix-toolbar');X.panel=X.shadow.querySelector('.ix-panel');
bindUI();renderAll();rescan(true);
X.listeners={move:onPointerMove,click:onPointerClick,scroll:onLayoutChange,resize:onLayoutChange,key:onKey};
// Capture click only when inspecting. All tools are rendered in an isolated shadow tree.
document.addEventListener('pointermove',onPointerMove,true);document.addEventListener('click',onPointerClick,true);document.addEventListener('scroll',onLayoutChange,true);window.addEventListener('resize',onLayoutChange);document.addEventListener('keydown',onKey,true);
X.observer=new MutationObserver(mutations=>{if(X.paused)return;const relevant=mutations.some(m=>!isOwn(m.target));if(relevant)onLayoutChange();});X.observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['id','class','style','hidden','open']});
toast('Interface X-Ray active · Alt+X to exit');
}
function destroy(){if(!X.host)return;X.scanVersion++;X.paused=true;clearTimeout(X.timer);cancelAnimationFrame(X.raf);X.observer?.disconnect();X.observer=null;for(const observer of X.shadowObservers||[])observer.disconnect();X.shadowObservers=[];X.shadowObserved=null;
if(X.listeners){document.removeEventListener('pointermove',X.listeners.move,true);document.removeEventListener('click',X.listeners.click,true);document.removeEventListener('scroll',X.listeners.scroll,true);window.removeEventListener('resize',X.listeners.resize);document.removeEventListener('keydown',X.listeners.key,true);X.listeners=null;}
sceneCleanup();resetPatches();X.host.remove();X.host=null;X.root=null;X.overlay=null;X.panel=null;X.toolbar=null;X.shadow=null;X.selected=null;X.hover=null;X.measuring=false;X.measureAnchor=null;X.measurePair=null;X.nodes=[];X.issues=[];X.issueFocus=null;X.elements=new Map();X.ids=new WeakMap();X.nextId=1;X.history=[];X.redo=[];X.snapshots={A:null,B:null};}
if(typeof window.__IX_XRAY_TOGGLE__==='function'){window.__IX_XRAY_TOGGLE__();}
else{window.__IX_XRAY_TOGGLE__=()=>X.host?.isConnected?destroy():start();start();}
