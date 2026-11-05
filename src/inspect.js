function observeOpenShadow(root){
 if(!X.shadowObserved)X.shadowObserved=new WeakSet();
 if(X.shadowObserved.has(root))return;
 X.shadowObserved.add(root);
 const observer=new MutationObserver(mutations=>{if(!X.paused&&mutations.some(m=>!isOwn(m.target)))onLayoutChange();});
 observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['id','class','style','hidden','open']});
 (X.shadowObservers||= []).push(observer);
}
function scanNode(el, parentId=null){if(!(el instanceof Element)||isOwn(el))return null;const id=getId(el);let r;try{r=el.getBoundingClientRect();}catch{return null;}
const st=getComputedStyle(el);const context=contextReason(st);return {id,parentId,tag:el.localName,label:elementLabel(el),depth:depthOf(el),rect:rectObj(r),position:st.position,display:st.display,overflow:st.overflow,opacity:parseFloat(st.opacity),zIndex:st.zIndex,context,visibility:st.visibility,flexWrap:st.flexWrap,flexDirection:st.flexDirection,gridColumns:st.gridTemplateColumns,gridRows:st.gridTemplateRows,minWidth:st.minWidth,maxWidth:st.maxWidth,whiteSpace:st.whiteSpace,connected:el.isConnected,interactive:/^(a|button|input|select|textarea|summary)$/.test(el.localName)||el.getAttribute('role')==='button',media:/^(img|svg|canvas|video|picture)$/.test(el.localName),text:['p','span','h1','h2','h3','h4','li','label','strong','em'].includes(el.localName)};}
function contextReason(s){if(s.position==='fixed'||s.position==='sticky')return 'position: '+s.position;
if((s.position==='absolute'||s.position==='relative')&&s.zIndex!=='auto')return `position + z-index: ${s.zIndex}`;
if(Number(s.opacity)<1)return `opacity: ${s.opacity}`;
if(s.transform!=='none')return 'transform';
if(s.filter!=='none')return 'filter';
if(s.perspective!=='none')return 'perspective';
if(s.isolation==='isolate')return 'isolation';
if(s.mixBlendMode!=='normal')return 'mix-blend-mode';
if(/paint|layout/.test(s.contain))return 'contain';
if(/transform|opacity|filter/.test(s.willChange))return 'will-change';
return null;}
function rescan(showToast=false){if(!X.host||X.paused)return;X.scanVersion++;const version=X.scanVersion;X.busy=true;updateStatus();
const roots=[{root:document.documentElement,parentId:null}];const out=[];let total=0;const limit=X.opts.maxNodes;
// Bounded idle-time traversal. Open shadow roots are traversed; closed roots are opaque.
function step(deadline){if(version!==X.scanVersion||!X.host)return;let count=0;
while(roots.length && total<limit && count<180 && (deadline?.timeRemaining?.()>2||count<35)){
const next=roots.pop();const el=next.root;if(!el||isOwn(el))continue;count++;total++;
const item=scanNode(el,next.parentId);if(item)out.push(item);
const shadow=el.shadowRoot;if(shadow){observeOpenShadow(shadow);const shadowChildren=[...shadow.children];for(let i=shadowChildren.length-1;i>=0;i--)roots.push({root:shadowChildren[i],parentId:item?.id||next.parentId});}
const children=el.children;for(let i=children.length-1;i>=0;i--)roots.push({root:children[i],parentId:item?.id||next.parentId});
}
if(roots.length&&total<limit){if(typeof requestIdleCallback==='function')requestIdleCallback(step,{timeout:160});else setTimeout(()=>step({timeRemaining:()=>5}),8);}
else {for(const [id,el] of X.elements){if(!el.isConnected)X.elements.delete(id);}if(X.selected&&!X.selected.isConnected)X.selected=null;X.nodes=out;X.busy=false;X.truncated=roots.length>0;X.issues=runDiagnostics(out);X.lastScanAt=Date.now();updateStatus();renderPanel();if(X.mode==='layers')sceneBuild();if(showToast)toast(`${out.length} DOM nodes · ${X.issues.length} findings`);}
}
if(typeof requestIdleCallback==='function')requestIdleCallback(step,{timeout:100});else setTimeout(()=>step({timeRemaining:()=>9}),0);
}
function boxMetrics(el){const s=css(el),r=el.getBoundingClientRect();const v=name=>parseFloat(s[name])||0;const m={top:v('marginTop'),right:v('marginRight'),bottom:v('marginBottom'),left:v('marginLeft')};const b={top:v('borderTopWidth'),right:v('borderRightWidth'),bottom:v('borderBottomWidth'),left:v('borderLeftWidth')};const p={top:v('paddingTop'),right:v('paddingRight'),bottom:v('paddingBottom'),left:v('paddingLeft')};return {rect:r,m,b,p};}
function clippingGeometry(el){
 const r=el.getBoundingClientRect();const seen={left:Math.max(0,r.left),top:Math.max(0,r.top),right:Math.min(innerWidth,r.right),bottom:Math.min(innerHeight,r.bottom)};
 let cur=el.parentElement||el.getRootNode()?.host||null,scrollAncestor=null;
 for(let i=0;cur instanceof Element && i<45;i++,cur=cur.parentElement||cur.getRootNode()?.host||null){
  const st=css(cur),bounds=cur.getBoundingClientRect();
  if(/hidden|clip|scroll|auto/.test(st.overflowX)){seen.left=Math.max(seen.left,bounds.left);seen.right=Math.min(seen.right,bounds.right);if(!scrollAncestor)scrollAncestor=cur;}
  if(/hidden|clip|scroll|auto/.test(st.overflowY)){seen.top=Math.max(seen.top,bounds.top);seen.bottom=Math.min(seen.bottom,bounds.bottom);if(!scrollAncestor)scrollAncestor=cur;}
 }
 const width=Math.max(0,seen.right-seen.left),height=Math.max(0,seen.bottom-seen.top);
 return {visible:{left:seen.left,top:seen.top,width,height},ratio:(width*height)/Math.max(1,r.width*r.height),scrollAncestor};
}
function renderMeasureOverlay(pair){
 if(!pair?.a?.isConnected||!pair?.b?.isConnected||pair.a===pair.b)return '';
 const a=pair.a.getBoundingClientRect(),b=pair.b.getBoundingClientRect();
 let x1,y1,x2,y2,text;
 if(a.right<=b.left){x1=a.right;x2=b.left;y1=y2=(Math.max(a.top,b.top)+Math.min(a.bottom,b.bottom))/2;text=fmt(x2-x1)+'px horizontal gap';}
 else if(b.right<=a.left){x1=b.right;x2=a.left;y1=y2=(Math.max(a.top,b.top)+Math.min(a.bottom,b.bottom))/2;text=fmt(x2-x1)+'px horizontal gap';}
 else if(a.bottom<=b.top){y1=a.bottom;y2=b.top;x1=x2=(Math.max(a.left,b.left)+Math.min(a.right,b.right))/2;text=fmt(y2-y1)+'px vertical gap';}
 else if(b.bottom<=a.top){y1=b.bottom;y2=a.top;x1=x2=(Math.max(a.left,b.left)+Math.min(a.right,b.right))/2;text=fmt(y2-y1)+'px vertical gap';}
 else{x1=a.left+a.width/2;y1=a.top+a.height/2;x2=b.left+b.width/2;y2=b.top+b.height/2;text='Boxes overlap · center distance '+fmt(Math.hypot(x2-x1,y2-y1))+'px';}
 let out=svgRect(a.left,a.top,a.width,a.height,'#f4c684','transparent','5 3',2);
 out+=svgRect(b.left,b.top,b.width,b.height,'#b9a5ff','transparent','5 3',2);
 out+=`<path d="M ${fmt(x1)} ${fmt(y1)} L ${fmt(x2)} ${fmt(y2)}" stroke="#f5db9a" stroke-width="2" stroke-dasharray="5 4"/><circle cx="${fmt(x1)}" cy="${fmt(y1)}" r="3" fill="#f5db9a"/><circle cx="${fmt(x2)}" cy="${fmt(y2)}" r="3" fill="#f5db9a"/><text x="${fmt(Math.max(16,Math.min(innerWidth-240,(x1+x2)/2+9)))}" y="${fmt(Math.max(20,Math.min(innerHeight-12,(y1+y2)/2-9)))}" fill="#ffe5ac" font-size="12" paint-order="stroke" stroke="#10223d" stroke-width="3">${esc(text)}</text>`;
 return out;
}
function svgRect(x,y,w,h,stroke,fill,dash='',width=1.5){return `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(Math.max(0,w))}" height="${fmt(Math.max(0,h))}" stroke="${stroke}" fill="${fill}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;}
function paintOverlay(){if(!X.overlay)return;const svg=X.overlay;const el=X.hover||X.selected;if(!X.showLabels||X.mode==='layers'||!el||!el.isConnected){svg.innerHTML='';return;}
const {rect:r,m,b,p}=boxMetrics(el);const isHover=el===X.hover;const mint='#edb37a',bt='#7c8cf6',pd='#88bdcf',ct='#54c4ba';let html='';
// Colored concentric boxes: margin, border, padding, content; accurate only for axis-aligned elements.
const t={left:r.left,top:r.top,right:r.right,bottom:r.bottom};
html+=svgRect(t.left-m.left,t.top-m.top,r.width+m.left+m.right,r.height+m.top+m.bottom,mint,'rgba(237,179,122,.12)','5 4',1.5);
html+=svgRect(t.left,t.top,r.width,r.height,isHover?'#eef4ff':bt,'rgba(119,135,241,.10)','',2);
const x=t.left+b.left,y=t.top+b.top,w=r.width-b.left-b.right,h=r.height-b.top-b.bottom;
html+=svgRect(x,y,w,h,pd,'rgba(105,186,211,.10)','3 3',1);
html+=svgRect(x+p.left,y+p.top,w-p.left-p.right,h-p.top-p.bottom,ct,'rgba(71,204,190,.13)','',1);
html+=`<path d="M ${fmt(r.left+r.width/2)} ${fmt(Math.max(0,r.top-20))} V ${fmt(Math.min(innerHeight,r.bottom+20))} M ${fmt(Math.max(0,r.left-20))} ${fmt(r.top+r.height/2)} H ${fmt(Math.min(innerWidth,r.right+20))}" stroke="#7d8fae" stroke-dasharray="3 5" stroke-width=".7" opacity=".6"/>`;
const s=css(el);if(s.transform!=='none')html+=`<text x="${fmt(Math.max(8,Math.min(innerWidth-180,r.left)))}" y="${fmt(Math.max(16,r.top-7))}" fill="#f1bd84" font-size="11">Transform · axis-aligned bounds</text>`;if(s.display.includes('flex'))html+=renderFlexOverlay(el,r,s);
if(s.display.includes('grid'))html+=renderGridOverlay(el,r,s);
if(X.issueFocus?.id===getId(el))html+=svgRect(r.left-3,r.top-3,r.width+6,r.height+6,'#ff9573','rgba(255,115,88,.08)','7 4',2);
const clip=clippingGeometry(el);
 if(clip.scrollAncestor){const sr=clip.scrollAncestor.getBoundingClientRect();html+=svgRect(sr.left,sr.top,sr.width,sr.height,'#6ae3d4','transparent','8 5',1);}
 if(clip.ratio<.999 && clip.visible.width>1&&clip.visible.height>1){const v=clip.visible;html+=svgRect(v.left,v.top,v.width,v.height,'#f4c486','transparent','2 3',1.6);}
 if(X.measurePair)html+=renderMeasureOverlay(X.measurePair);
 if(X.measureAnchor?.isConnected){const ar=X.measureAnchor.getBoundingClientRect();html+=svgRect(ar.left,ar.top,ar.width,ar.height,'#f4c684','transparent','5 3',2);}
 svg.innerHTML=html;}
function renderFlexOverlay(el,r,s){let out='';const axis=s.flexDirection.startsWith('column')?'vertical':'horizontal';const len=axis==='horizontal'?r.width:r.height;const x1=r.left+r.width/2,y1=r.top+r.height/2;const x2=axis==='horizontal'?x1+Math.min(len*.35,120):x1;const y2=axis==='vertical'?y1+Math.min(len*.35,100):y1;out+=`<path d="M ${fmt(x1)} ${fmt(y1)} L ${fmt(x2)} ${fmt(y2)}" stroke="#ae91ff" stroke-width="2.5" stroke-dasharray="6 4"/>`;for(const child of [...el.children].slice(0,24)){if(isOwn(child))continue;const cr=child.getBoundingClientRect();out+=svgRect(cr.left,cr.top,cr.width,cr.height,'#b9a2ff','transparent','2 4',1);}return out;}
function computedTracks(value){
 // Computed grid-template-* normally resolves tracks to px. Names are not lengths.
 const tokens=(value||'').match(/(?:\[[^\]]*\]|minmax\([^)]*\)|repeat\([^)]*\)|[^\s]+)/g)||[];
 return tokens.filter(t=>/^[-+]?(?:\d*\.)?\d+px$/.test(t)).map(t=>parseFloat(t));
}
function renderGridOverlay(el,r,s){
 let out='';const b=boxMetrics(el),px=r.left+b.b.left+b.p.left,py=r.top+b.b.top+b.p.top;
 const cols=computedTracks(s.gridTemplateColumns),rows=computedTracks(s.gridTemplateRows);
 const gx=parseFloat(s.columnGap)||0,gy=parseFloat(s.rowGap)||0;
 const contentW=Math.max(0,r.width-b.b.left-b.b.right-b.p.left-b.p.right);
 const contentH=Math.max(0,r.height-b.b.top-b.b.bottom-b.p.top-b.p.bottom);
 if(cols.length>0&&cols.length<=64){let x=px;for(let k=0;k<=cols.length;k++){out+=`<path d="M ${fmt(x)} ${fmt(py)} V ${fmt(py+contentH)}" stroke="#70d8df" stroke-width="1" stroke-dasharray="4 4" opacity=".85"/>`;x+=(cols[k]||0)+gx;}}
 if(rows.length>0&&rows.length<=64){let y=py;for(let k=0;k<=rows.length;k++){out+=`<path d="M ${fmt(px)} ${fmt(y)} H ${fmt(px+contentW)}" stroke="#70d8df" stroke-width="1" stroke-dasharray="4 4" opacity=".85"/>`;y+=(rows[k]||0)+gy;}}
 for(const child of [...el.children].slice(0,64)){if(isOwn(child))continue;const cr=child.getBoundingClientRect();out+=svgRect(cr.left,cr.top,cr.width,cr.height,'#6fd6e3','rgba(111,214,227,.04)','4 3',1);}
 return out;
}
function renderHUD(){const hud=X.shadow?.querySelector('.ix-hud');if(!hud)return;const el=X.hover||X.selected;if(!el||X.mode==='layers'||!X.showLabels||!el.isConnected){hud.hidden=true;return;}
const r=el.getBoundingClientRect(),s=css(el),clip=clippingGeometry(el);hud.hidden=false;hud.innerHTML=`<div class="ix-hud-head"><span>${esc(elementLabel(el))}</span><b>${fmt(r.width)} × ${fmt(r.height)}</b></div><div class="ix-hud-sub">${esc(s.display)} · ${esc(s.position)} · z ${esc(s.zIndex)} · ${esc(s.overflow)}</div><div class="ix-hud-sub">Depth ${depthOf(el)} · geometric visibility ${fmt(clip.ratio*100)}% · ${esc(selector(el).slice(0,65))}</div>`;
hud.style.left=`${Math.max(10,Math.min(innerWidth-280,r.left))}px`;hud.style.top=`${r.top>78?Math.max(12,r.top-83):Math.min(innerHeight-76,r.bottom+9)}px`;
}
