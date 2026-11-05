const X = {
  host:null, shadow:null, root:null, overlay:null, scene:null, panel:null, toolbar:null,
  mode:'inspect',tab:'elements',theme:'dark',locale:'zh',expanded:true,showLabels:true,
  paused:false,selecting:true,measuring:false,measureAnchor:null,measurePair:null,busy:false,sideWidth:410,openedAt:Date.now(),
  ids:new WeakMap(), elements:new Map(),nodes:[],nextId:1,selected:null,hover:null,
  issues:[],history:[],redo:[],snapshots:{A:null,B:null},scanVersion:0,treeScroll:0,treeViewCount:44,treeRowHeight:28,
  opts:{maxNodes:3500,sceneLimit:850,depth:12,alpha:0.64,projection:'perspective',sceneType:'dom',palette:'standard',reducedMotion:false},
  queue:null, abort:null, timer:null, raf:0, sceneState:null, muteEvents:false
};
const ICONS={
 logo:'<path d="M3 12 12 3l9 9-9 9z"/><path d="M12 7v10M7 12h10"/>',
 inspect:'<circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 5.5 5.5M10 7v6M7 10h6"/>',
 layers:'<path d="m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5"/>',
 bug:'<rect x="6" y="7" width="12" height="13" rx="6"/><path d="M9 7V4m6 3V4M3 10h3M3 16h3m12-6h3m-3 6h3M8 13h8"/>',
 wrench:'<path d="M21 7a6 6 0 0 1-8 5L6 19a2 2 0 0 1-3-3l7-7a6 6 0 0 1 5-8l-4 4 4 4 4-4Z"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 eyeoff:'<path d="m2 2 20 20M10.6 5.1A11.4 11.4 0 0 1 12 5c6 0 10 7 10 7a17.5 17.5 0 0 1-3 3.4M6.2 6.2C3.7 8 2 12 2 12s4 7 10 7c1.8 0 3.5-.6 5-1.5"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 moon:'<path d="M20.5 13.2A9 9 0 0 1 10.8 3.5 9 9 0 1 0 20.5 13.2Z"/>',
 camera:'<path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="3.5"/>',
 settings:'<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="m19.4 15 .1 2.4-2.1 2.1-2.3-.6-1.3 1.7h-3.6L9 18.9l-2.4.6-2.1-2.1.7-2.4-1.7-1.3v-3.5l1.7-1.3-.7-2.3 2.1-2.1 2.4.6 1.2-1.7h3.6l1.3 1.7 2.3-.6 2.1 2.1-.6 2.3 1.7 1.3v3.5Z"/>',
 close:'<path d="m5 5 14 14M19 5 5 19"/>',chevron:'<path d="m9 18 6-6-6-6"/>',
 expand:'<path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"/>',
 search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
 target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3"/>',
 undo:'<path d="M9 14 4 9l5-5M4 9h9a7 7 0 0 1 0 14h-2"/>',
 redo:'<path d="m15 14 5-5-5-5m5 5h-9a7 7 0 0 0 0 14h2"/>',
 reset:'<path d="M3 11a9 9 0 1 1 3 7M3 5v6h6"/>',
 copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
 download:'<path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4"/>',
 pause:'<path d="M8 5v14M16 5v14"/>',play:'<path d="m7 4 13 8-13 8Z"/>',
 info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6m0-10v.5"/>',
 warning:'<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3v.2"/>',
 check:'<path d="m4 12 5 5L20 6"/>',
 folder:'<path d="M3 6h7l2 3h9v11H3z"/>',
 sliders:'<path d="M4 7h16M4 17h16M9 3v8m6 2v8"/>',
 compare:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/>',
 phone:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
 monitor:'<rect x="2" y="3" width="20" height="15" rx="2"/><path d="M8 22h8M12 18v4"/>',
 tree:'<path d="M5 3v15h6m-6-9h6m0-5h8v4h-8zm0 8h8v4h-8zm0 7h8v4h-8z"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2l-2 2v2m0 3v.2"/>',
 arrow:'<path d="m5 12 14 0m-6-6 6 6-6 6"/>',
 ruler:'<path d="M3 20h18M6 18v2m4-4v4m4-2v2m4-4v4M3 6l15 9 3-5L6 1z"/>',cross:'<path d="M3 12h18m-9-9v18"/>',
 external:'<path d="M14 3h7v7m0-7-10 10M20 14v7H3V4h7"/>'
};
ICONS.ruler='<path d="m4 5 15 13 3-4L7 1z"/><path d="M8 8l-2 3m6 1-2 3m6 1-2 3"/>';
function icon(name,size=17){return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">${ICONS[name]||ICONS.info}</svg>`;}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmt(n){return (Math.round(Number(n||0)*10)/10).toLocaleString('en-US',{maximumFractionDigits:1});}
const tr={
 zh:{inspect:'透视',layers:'3D 拆层',diagnose:'诊断',patch:'临时修复',compare:'对比',snapshot:'快照',settings:'设置',exit:'退出',nodes:'节点',issues:'问题',search:'搜索 DOM / 选择器',noSelection:'在页面上点击一个元素开始检查',noIssues:'当前扫描范围内未发现符合规则的异常',pause:'暂停',resume:'继续',scan:'重新扫描',unknown:'不确定',selected:'已选中',cause:'原因追踪',copy:'复制 CSS',theme:'主题',details:'详细信息',history:'修改记录'},
 en:{inspect:'Inspect',layers:'3D Layers',diagnose:'Diagnostics',patch:'CSS Patches',compare:'Compare',snapshot:'Snapshot',settings:'Settings',exit:'Exit',nodes:'Nodes',issues:'Issues',search:'Search DOM / selector',noSelection:'Click an element on the page to inspect',noIssues:'No matching issues in current scan',pause:'Pause',resume:'Resume',scan:'Rescan',unknown:'Uncertain',selected:'Selected',cause:'Cause trace',copy:'Copy CSS',theme:'Theme',details:'Details',history:'Patch history'}
};
function t(key){return (tr[X.locale]||tr.zh)[key]||key;}
const UI_TRANSLATIONS={"DOCUMENT STRUCTURE": "文档结构", "INSPECTION": "元素检查", "SELECTED ELEMENT": "当前元素", "GEOMETRY": "几何信息", "CSS BOX MODEL": "CSS 盒模型", "COMPUTED LAYOUT": "计算布局", "PARENT / SCROLL": "父容器与滚动", "SCAN OVERVIEW": "诊断概览", "FINDINGS": "检测结果", "VISUAL CAUSE TRACE": "可视化原因追踪", "SUPPORTED CAUSE HYPOTHESES": "有证据的原因假设", "MEASURED EVIDENCE": "几何测量证据", "SUGGESTED EXPERIMENTS": "可验证的修复建议", "SESSION PATCH MANAGER": "会话修复管理器", "EDIT SELECTED ELEMENT": "编辑所选元素", "NO ELEMENT SELECTED": "尚未选择元素", "UNDO / REDO": "撤销与重做", "PATCH HISTORY": "修改历史", "EXPORT PATCH": "导出 CSS 修改", "BEFORE / AFTER": "修改前后", "MEASURED DIFF": "实际变化对比", "RESPONSIVE CHECK": "响应式分析", "LOCAL SNAPSHOT": "本地快照", "INTEGRITY": "数据与隐私", "APPEARANCE": "外观设置", "KEYBOARD": "快捷键", "KNOWN LIMITS": "已知限制", "Parent": "父元素", "Child": "子元素", "Previous": "上一兄弟元素", "Next": "下一兄弟元素", "DOM nodes": "DOM 节点", "Run scan": "重新诊断", "Pause scanning": "暂停扫描", "Resume scanning": "继续扫描", "Test CSS change": "测试 CSS 修改", "Copy evidence": "复制证据", "Apply to live page": "应用到网页", "Remove property": "移除此属性", "Undo": "撤销", "Redo": "重做", "Reset all": "全部恢复", "Copy CSS": "复制 CSS", "Export .css": "导出 CSS", "Capture A": "采集状态 A", "Capture B": "采集状态 B", "Export A/B evidence · JSON": "导出 A/B 对比 JSON", "Open separate preview window": "打开独立预览窗口", "Resize current window to CSS viewport": "调整当前窗口以接近目标 CSS 视口", "Export diagnostics · JSON": "导出诊断 JSON", "Export DOM geometry · JSON": "导出 DOM 几何 JSON", "Capture actual viewport · PNG": "截取真实网页 PNG", "Export 3D canvas · PNG": "导出 3D 画布 PNG", "Live inspection": "实时分析", "Scanning DOM…": "扫描 DOM 中…", "Paused": "已暂停", "Scan": "扫描", "nodes": "节点", "findings": "项诊断", "no findings": "无诊断", "Width · CSS px": "宽度 · CSS px", "Height · CSS px": "高度 · CSS px", "X · viewport": "X · 视口", "Y · viewport": "Y · 视口", "Findings": "诊断项", "Confirmed": "确认存在", "Likely / possible": "较可能 / 待确认", "DOM analyzed": "已分析 DOM", "CSS property": "CSS 属性", "New value": "新值", "Current computed": "当前计算值", "Baseline computed": "首次修改前计算值", "Original inline value": "初始内联值", "Geometry / CSS changes": "几何 / CSS 变化", "Issue delta": "诊断项变化", "No snapshot captured": "尚未采集快照", "Selected": "已选择", "Applied": "已应用", "applied": "已应用", "Dark navy": "深海军蓝", "Light": "浅色", "Perspective": "透视投影", "Orthographic": "正交投影", "Max DOM nodes": "最大 DOM 节点数", "3D node limit": "3D 节点限制", "Motion": "动画", "Standard": "标准", "Reduced": "减少动画", "Color palette": "色彩方案", "Color-vision friendly": "色觉友好", "Exit": "退出", "Parent element": "父元素", "First child": "第一个子元素", "Undo / redo": "撤销 / 重做", "DOM hierarchy": "DOM 层级", "Stacking contexts*": "层叠上下文*", "Hierarchy": "层级模式", "Reset camera": "重置镜头", "Depth limit": "层级范围", "Plane opacity": "平面透明度", "Containers": "容器", "Interactive": "交互", "Media": "媒体", "SPATIAL EXPLORER": "空间层级分析", "Workspace / ELEMENTS": "工作区 / DOM", "Workspace / DIAGNOSE": "工作区 / 诊断", "Workspace / PATCH": "工作区 / 修复", "Workspace / COMPARE": "工作区 / 对比", "Workspace / SNAPSHOTS": "工作区 / 快照", "Workspace / SETTINGS": "工作区 / 设置", "LIVE DOCUMENT ANALYSIS": "实时网页布局分析", "Theme": "主题", "Width": "宽度", "Height": "高度", "Mouse": "鼠标", "No matching elements": "无匹配元素", "No changes yet": "暂无 CSS 修改", "No CSS edits in this session.": "本次会话尚未修改 CSS。", "No matching issues in current scan": "本次扫描未发现符合规则的异常", "Click an element on the page to inspect": "点击网页上的元素开始分析", "Select a DOM element in Inspect mode before editing CSS.": "请先在透视模式中选择一个 DOM 元素。", "Capture snapshots A and B, then inspect the measured layout difference.": "先采集状态 A 与状态 B，再查看实际布局变化。", "A · BEFORE": "A · 修改前", "B · AFTER": "B · 修改后", "A · Before": "A · 修改前", "B · After": "B · 修改后", "Document horizontal overflow": "页面水平溢出", "Element outside viewport": "元素超出视口", "Fixed min-width constraint": "最小宽度约束", "Clipped content": "内容被祖先裁剪", "Flex / Grid constraint": "Flex / Grid 约束", "Fixed overlay candidate": "固定定位遮挡候选", "Possible floating-element overlap": "定位元素可能重叠", "Unusually small control": "交互控件尺寸过小", "Exported real report data": "已导出真实诊断数据", "Exported real dom data": "已导出真实 DOM 数据"};
function localizeUI(){
 if(!X.root)return;
 X.originalTextNodes ||= new WeakMap();
 const walker=document.createTreeWalker(X.root,NodeFilter.SHOW_TEXT);
 let n;
 while((n=walker.nextNode())){
  if(n.parentElement?.closest?.('.ix-tree,code,.ix-code,.ix-codebox,.ix-hud,.ix-scene-tip,option'))continue;
  const orig=X.originalTextNodes.get(n)||n.nodeValue;
  if(!X.originalTextNodes.has(n))X.originalTextNodes.set(n,orig);
  const trimmed=orig.trim();
  const translated=X.locale==='zh'?(UI_TRANSLATIONS[trimmed]||trimmed):trimmed;
  const pre=orig.match(/^\s*/)?.[0]||'',post=orig.match(/\s*$/)?.[0]||'';
  if(trimmed&&n.nodeValue!==pre+translated+post)n.nodeValue=pre+translated+post;
 }
}
function elementLabel(el){if(!(el instanceof Element))return '—';let s=el.tagName.toLowerCase();if(el.id)s+='#'+el.id.slice(0,40);const c=(typeof el.className==='string'?el.className:'').trim().split(/\s+/).filter(Boolean).slice(0,2);if(c.length)s+='.'+c.join('.');return s.slice(0,100);}
function selector(el){if(!(el instanceof Element))return '';const parts=[];let cur=el;for(let i=0;i<6&&cur&&cur!==document.documentElement;i++){
  const tag=cur.localName||'node';if(cur.id){parts.unshift(tag+'#'+CSS.escape(cur.id));break;}
  const parent=cur.parentElement;if(!parent){parts.unshift(tag);break;}
  const siblings=[...parent.children].filter(c=>c.localName===tag);parts.unshift(tag+(siblings.length>1?`:nth-of-type(${siblings.indexOf(cur)+1})`:''));cur=parent;
}return parts.join(' > ');}
function getId(el){if(!el||!(el instanceof Element))return 0;let id=X.ids.get(el);if(!id){id=X.nextId++;X.ids.set(el,id);X.elements.set(id,el);}return id;}
function rectObj(r){return {x:+r.x.toFixed(2),y:+r.y.toFixed(2),left:+r.left.toFixed(2),top:+r.top.toFixed(2),right:+r.right.toFixed(2),bottom:+r.bottom.toFixed(2),width:+r.width.toFixed(2),height:+r.height.toFixed(2)};}
function isOwn(el){return !!(el && (el===X.host || X.host?.contains(el)));}
function css(el){return getComputedStyle(el);}
function styleFacts(el){const s=css(el);const r=el.getBoundingClientRect();const keys=['display','position','zIndex','overflow','overflowX','overflowY','width','height','minWidth','maxWidth','boxSizing','flexDirection','flexWrap','justifyContent','alignItems','gridTemplateColumns','gridTemplateRows','gap','transform','opacity','whiteSpace','contain','isolation','willChange','marginTop','marginRight','marginBottom','marginLeft','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','paddingTop','paddingRight','paddingBottom','paddingLeft'];const v={};for(const k of keys)v[k]=s[k];return {rect:rectObj(r),computed:v,selector:selector(el),tag:el.localName,id:getId(el),label:elementLabel(el),depth:depthOf(el),parent:el.parentElement?getId(el.parentElement):null,scroll:{width:el.scrollWidth,height:el.scrollHeight,clientWidth:el.clientWidth,clientHeight:el.clientHeight}};}
function depthOf(el){let d=0,c=el;while(c && d<90){c=c.parentElement||c.getRootNode()?.host;d++;}return d-1;}
function download(name,contents,type='application/json'){const blob=contents instanceof Blob?contents:new Blob([contents],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function toast(message,level='info'){if(!X.root)return;const wrap=X.shadow.querySelector('.ix-toasts');if(!wrap)return;const el=document.createElement('div');el.className='ix-toast '+level;el.innerHTML=icon(level==='error'?'warning':'check',15)+`<span>${esc(message)}</span>`;if([...wrap.children].some(n=>n.querySelector('span')?.textContent===String(message)))return;wrap.appendChild(el);while(wrap.childElementCount>(innerWidth<600?1:3))wrap.firstElementChild.remove();setTimeout(()=>el.remove(),2500);}
function closestLayoutParent(el){
 let cur=el?.parentElement||el?.getRootNode()?.host||null;
 while(cur&&cur instanceof Element){const st=css(cur);if(/flex|grid/.test(st.display)||/(auto|scroll|hidden|clip)/.test(st.overflowX+' '+st.overflowY)||/(relative|absolute|fixed|sticky)/.test(st.position))return cur;cur=cur.parentElement||cur.getRootNode()?.host||null;}
 return el?.parentElement||null;
}
function nearestElement(id){const el=X.elements.get(Number(id));return el?.isConnected?el:null;}
function selectElement(el,{scroll=false,tab=false}={}){if(!(el instanceof Element)||isOwn(el)||!el.isConnected)return;X.selected=el;X.hover=null;if(scroll)el.scrollIntoView({block:'center',inline:'nearest',behavior:X.opts.reducedMotion?'instant':'smooth'});if(tab)X.tab='elements';schedulePaint();renderPanel();if(X.mode==='layers')sceneFocus(el);}
function onPointerMove(ev){if(X.mode!=='inspect'||!X.selecting||X.paused)return;if(ev.composedPath().includes(X.host))return;const el=ev.composedPath().find(p=>p instanceof Element&&!isOwn(p));if(!el||el===X.hover)return;X.hover=el;schedulePaint();renderHUD();}
function onPointerClick(ev){if(X.mode!=='inspect'||!X.selecting||X.paused||ev.composedPath().includes(X.host)||ev.altKey)return;const el=ev.composedPath().find(p=>p instanceof Element&&!isOwn(p));if(!el)return;ev.preventDefault();ev.stopImmediatePropagation();
 if(X.measuring){
  if(!X.measureAnchor){X.measureAnchor=el;X.measurePair=null;toast('First reference selected — choose another element');}
  else if(el!==X.measureAnchor){X.measurePair={a:X.measureAnchor,b:el};X.measureAnchor=null;X.measuring=false;toast('Measured distances between the two DOM boxes');renderToolbar();}
 }
 selectElement(el);
}
function schedulePaint(){if(X.raf)return;X.raf=requestAnimationFrame(()=>{X.raf=0;paintOverlay();renderHUD();if(X.mode==='layers')sceneRefreshGeometry();});}
function onLayoutChange(){schedulePaint();if(!X.paused){clearTimeout(X.timer);X.timer=setTimeout(()=>{if(X.host)rescan(false);},700);}}
function onKey(ev){if(ev.defaultPrevented)return;if(ev.key==='Escape' && (ev.target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(ev.target?.tagName)) && !ev.composedPath().includes(X.host))return;if(ev.key==='Escape'){if(X.mode==='layers'){setMode('inspect');}else{destroy();}ev.stopPropagation();return;}
 if(ev.composedPath().includes(X.host)&&['INPUT','TEXTAREA','SELECT'].includes(ev.target.tagName))return;
 if(ev.altKey&&ev.key.toLowerCase()==='x'){destroy();return;}if(ev.shiftKey&&ev.key.toLowerCase()==='m'){ev.preventDefault();X.measuring=!X.measuring;X.measureAnchor=null;X.measurePair=null;renderToolbar();schedulePaint();return;}
 if(ev.altKey&&ev.key==='ArrowUp'){ev.preventDefault();selectElement(X.selected?.parentElement||X.selected);} 
 if(ev.altKey&&ev.key==='ArrowDown'&&X.selected?.firstElementChild){ev.preventDefault();selectElement(X.selected.firstElementChild);}
 if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='z'&&X.tab==='patch'){ev.preventDefault();if(ev.shiftKey)redoPatch();else undoPatch();}
}
