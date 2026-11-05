const PATCH_PROPERTIES=['width','height','min-width','max-width','margin','padding','display','gap','align-items','justify-content','position','overflow','transform','z-index'];
function patch(el,prop,value){if(!el||!el.isConnected||!PATCH_PROPERTIES.includes(prop))return false;
if(el===document.documentElement||el===document.body){toast('Root-level edits can disrupt inspection. Select a child element.','error');return false;}
if(/[;{}]/.test(value)||value.length>300){toast('CSS value rejected: unsupported syntax.','error');return false;}
const old=el.style.getPropertyValue(prop),oldPriority=el.style.getPropertyPriority(prop),newValue=value.trim();
if(newValue && !CSS.supports(prop,newValue)){toast(`Invalid CSS value for ${prop}`,'error');return false;}
if(old===newValue && (!oldPriority || !newValue))return false;
const r=el.getBoundingClientRect();const record={element:el,id:getId(el),selector:selector(el),property:prop,before:old,priority:oldPriority,after:newValue,time:new Date().toISOString(),beforeRect:rectObj(r),beforeComputed:css(el).getPropertyValue(prop)};
applyRecord(record,'after');record.afterRect=rectObj(el.getBoundingClientRect());record.afterComputed=css(el).getPropertyValue(prop);X.history.push(record);X.redo.length=0;return true;}
function applyRecord(record,direction){const el=record.element;if(!el?.isConnected)return;const v=direction==='after'?record.after:record.before;if(!v)el.style.removeProperty(record.property);else el.style.setProperty(record.property,v,direction==='after'?'':record.priority);onPatchChange();}
function onPatchChange(){schedulePaint();clearTimeout(X.timer);X.timer=setTimeout(()=>rescan(false),230);renderPanel();}
function undoPatch(){const p=X.history.pop();if(!p){toast('No more changes to undo');return;}applyRecord(p,'before');X.redo.push(p);renderPanel();}
function redoPatch(){const p=X.redo.pop();if(!p){toast('No changes to redo');return;}applyRecord(p,'after');X.history.push(p);renderPanel();}
function resetPatches(){while(X.history.length){const p=X.history.pop();if(p.element?.isConnected){const now=p.element.style.getPropertyValue(p.property);if(now===p.after)applyRecord(p,'before');}}X.redo.length=0;X.issueFocus=null;renderPanel();toast('Session patches restored');}
function originalInline(el,prop){
 const id=getId(el),first=X.history.find(p=>p.id===id&&p.property===prop)||[...X.redo].reverse().find(p=>p.id===id&&p.property===prop);
 return first?{value:first.before,priority:first.priority,computed:first.beforeComputed}:{value:el.style.getPropertyValue(prop),priority:el.style.getPropertyPriority(prop),computed:css(el).getPropertyValue(prop)};
}
function cssPatchText(){const grouped=new Map();for(const p of X.history){if(!grouped.has(p.selector))grouped.set(p.selector,new Map());grouped.get(p.selector).set(p.property,p.after);}return [...grouped].map(([sel,props])=>`${sel} {\n${[...props].filter(x=>x[1]).map(([k,v])=>`  ${k}: ${v};`).join('\n')}\n}`).join('\n\n');}
function doCopy(text){if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>toast('Copied to clipboard')).catch(()=>fallbackCopy(text));else fallbackCopy(text);}
function fallbackCopy(text){const ta=document.createElement('textarea');ta.value=text;X.shadow.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast('Copied to clipboard');}
