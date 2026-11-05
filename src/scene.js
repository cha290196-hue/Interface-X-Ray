// Batched WebGL2 rectangles: each DOM node is one instance, not one 3D object.
// A stacking-context graph is an approximation of the CSS context tree, NOT the compositor layer tree.
const VS=`#version 300 es
precision highp float;
layout(location=0) in vec2 corner;
layout(location=1) in vec4 rect;
layout(location=2) in vec4 color;
layout(location=3) in float depth;
uniform mat4 projection;
uniform float unfold;
out vec2 uv;
out vec4 tint;
void main(){
  uv=corner;tint=color;
  vec3 pos=vec3(rect.xy+(corner-.5)*rect.zw,depth*unfold);
  gl_Position=projection*vec4(pos,1.);
}`;
const FS=`#version 300 es
precision highp float;
in vec2 uv;in vec4 tint;out vec4 frag;
void main(){
  float e=min(min(uv.x,uv.y),min(1.-uv.x,1.-uv.y));
  float border=1.-smoothstep(.0,.045,e);
  vec3 c=mix(tint.rgb*.48,tint.rgb,border*.76);
  float a=mix(tint.a*.45,min(1.,tint.a+.32),border);
  frag=vec4(c,a);
}`;
const LINEVS=`#version 300 es
precision highp float;
layout(location=0) in vec3 point;
uniform mat4 projection;
uniform float unfold;
void main(){gl_Position=projection*vec4(point.xy,point.z*unfold,1.);}`;
const LINEFS=`#version 300 es
precision highp float;
uniform vec4 tint;out vec4 frag;
void main(){frag=tint;}`;
function compile(gl,type,source){const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));return sh;}
function program(gl,v,f){const p=gl.createProgram();gl.attachShader(p,compile(gl,gl.VERTEX_SHADER,v));gl.attachShader(p,compile(gl,gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
function mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
function perspective(fovy,aspect,near,far){const f=1/Math.tan(fovy/2),o=new Float32Array(16);o[0]=f/aspect;o[5]=f;o[10]=(far+near)/(near-far);o[11]=-1;o[14]=2*far*near/(near-far);return o;}
function ortho(l,r,b,t,n,f){const o=new Float32Array(16);o[0]=2/(r-l);o[5]=2/(t-b);o[10]=-2/(f-n);o[12]=-(r+l)/(r-l);o[13]=-(t+b)/(t-b);o[14]=-(f+n)/(f-n);o[15]=1;return o;}
function norm(v){const len=Math.hypot(...v)||1;return v.map(x=>x/len);}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function lookAt(eye,target){const z=norm(eye.map((v,i)=>v-target[i])),x=norm(cross([0,1,0],z)),y=cross(z,x),o=new Float32Array(16);o[0]=x[0];o[1]=y[0];o[2]=z[0];o[4]=x[1];o[5]=y[1];o[6]=z[1];o[8]=x[2];o[9]=y[2];o[10]=z[2];o[12]=-x.reduce((a,v,i)=>a+v*eye[i],0);o[13]=-y.reduce((a,v,i)=>a+v*eye[i],0);o[14]=-z.reduce((a,v,i)=>a+v*eye[i],0);o[15]=1;return o;}
function projectionMatrix(state){const ar=Math.max(.1,state.canvas.width/Math.max(1,state.canvas.height));const dist=state.distance;const cp=Math.cos(state.pitch),sp=Math.sin(state.pitch),sy=Math.sin(state.yaw),cy=Math.cos(state.yaw);const eye=[state.target[0]+sy*cp*dist,state.target[1]+sp*dist,state.target[2]+cy*cp*dist];const proj=X.opts.projection==='ortho'?ortho(-6.1*ar/state.zoom,6.1*ar/state.zoom,-6.1/state.zoom,6.1/state.zoom,.01,200):perspective(Math.PI/3/state.zoom,ar,.1,200);return mul(proj,lookAt(eye,state.target));}
function projectPt(mat,x,y,z,w,h){const a=[x,y,z,1],b=[0,0,0,0];for(let r=0;r<4;r++)for(let k=0;k<4;k++)b[r]+=mat[k*4+r]*a[k];if(b[3]<=0.01)return null;return [(b[0]/b[3]*.5+.5)*w,(-b[1]/b[3]*.5+.5)*h,b[2]/b[3]];}
function sceneNodeColor(n){
 if(X.opts.palette==='cb-safe'){
 const alpha=X.opts.alpha;
 if(X.selected&&getId(X.selected)===n.id)return [.97,.88,.31,.94];
 if(X.hover&&getId(X.hover)===n.id)return [.95,.93,1,.98];
 if(X.issues.some(i=>i.nodeId===n.id))return [.88,.44,.19,.87];
 if(n.interactive)return [.68,.49,.73,alpha];
 if(n.media)return [.94,.79,.26,alpha];
 if(n.text)return [.45,.72,.66,alpha*.75];
 return [.34,.62,.85,alpha*.8];
 }
 if(X.selected&&getId(X.selected)===n.id)return [0.35,.95,.84,.88];if(X.hover&&getId(X.hover)===n.id)return [.85,.94,1,.95];if(X.issues.some(i=>i.nodeId===n.id&&i.certainty==='confirmed'))return [1,.48,.40,.88];if(X.issues.some(i=>i.nodeId===n.id))return [1,.65,.36,.78];if(n.interactive)return [.62,.46,1,X.opts.alpha];if(n.media)return [1,.72,.48,X.opts.alpha];if(n.text)return [.34,.77,.91,X.opts.alpha*.66];if(n.context && X.opts.sceneType==='stack')return [.71,.46,.98,X.opts.alpha];return [.31,.52,1,X.opts.alpha*.68];}
function sceneInit(){if(X.sceneState)return;const canvas=X.shadow.querySelector('#ix-canvas');if(!canvas)return;const gl=canvas.getContext('webgl2',{antialias:true,alpha:true,preserveDrawingBuffer:true,premultipliedAlpha:false});if(!gl){
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx){X.shadow.querySelector('.ix-scene-unsupported').hidden=false;toast('Both WebGL2 and Canvas2D are unavailable.','error');return;}
 X.sceneState={gl:null,ctx,canvas,entries:[],target:[-.55,0,1.4],yaw:-.58,pitch:.53,distance:16,zoom:1,progress:0,drag:null,mat:null,drawRaf:0,animStart:performance.now(),cursor:null};
 sceneEvents(X.sceneState);sceneBuild();toast('GPU WebGL2 unavailable — using projected Canvas2D geometry renderer');return;
 }
try {const planes=program(gl,VS,FS),lines=program(gl,LINEVS,LINEFS),vao=gl.createVertexArray(),cornerBuffer=gl.createBuffer(),instanceBuffer=gl.createBuffer();gl.bindVertexArray(vao);
gl.bindBuffer(gl.ARRAY_BUFFER,cornerBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuffer);gl.bufferData(gl.ARRAY_BUFFER,16*9*1000,gl.DYNAMIC_DRAW);
for(const [loc,n,offset] of [[1,4,0],[2,4,16],[3,1,32]]){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,n,gl.FLOAT,false,36,offset);gl.vertexAttribDivisor(loc,1);}gl.bindVertexArray(null);
const lineVao=gl.createVertexArray(),lineBuffer=gl.createBuffer();gl.bindVertexArray(lineVao);gl.bindBuffer(gl.ARRAY_BUFFER,lineBuffer);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);gl.bindVertexArray(null);
X.sceneState={gl,canvas,planes,lines,vao,instanceBuffer,lineVao,lineBuffer,entries:[],target:[-.55,0,1.4],yaw:-.58,pitch:.53,distance:16,zoom:1,progress:0,drag:null,mat:null,drawRaf:0,animStart:performance.now(),cursor:null,instanceData:null,lineData:null};
sceneEvents(X.sceneState);sceneBuild();}catch(e){console.error(e);toast('3D renderer failed: '+String(e),'error');}}
function sceneBuild(){const s=X.sceneState;if(!s)return;const idMap=new Map(X.nodes.map(n=>[n.id,n]));const contextDepth=new Map();function getContextDepth(n){if(contextDepth.has(n.id))return contextDepth.get(n.id);const par=idMap.get(n.parentId);const d=(par?getContextDepth(par):0)+(n.context?1:0);contextDepth.set(n.id,d);return d;}
let list=X.nodes.filter(n=>n.rect.width>2&&n.rect.height>2 && n.display!=='none' && n.visibility!=='hidden' && n.rect.right>-480&&n.rect.left<innerWidth+480&&n.rect.bottom>-500&&n.rect.top<innerHeight+500);
if(X.opts.sceneType==='stack')list=list.filter(n=>n.context||n.depth<=2);
list=list.filter(n=>(X.opts.sceneType==='dom'?n.depth:getContextDepth(n))<=X.opts.depth);
list.sort((a,b)=>{const aVis=a.rect.top>=0&&a.rect.left>=0&&a.rect.left<innerWidth&&a.rect.top<innerHeight;const bVis=b.rect.top>=0&&b.rect.left>=0&&b.rect.left<innerWidth&&b.rect.top<innerHeight;return Number(bVis)-Number(aVis)||a.depth-b.depth;});
list=list.slice(0,X.opts.sceneLimit);s.entries=list.map(n=>{
  let graphParentId=n.parentId;
  if(X.opts.sceneType==='stack'){
    let parent=idMap.get(n.parentId);
    while(parent&&!parent.context&&parent.parentId){parent=idMap.get(parent.parentId);}
    graphParentId=parent?.id||null;
  }
  return {...n,graphParentId,layer:X.opts.sceneType==='dom'?n.depth:getContextDepth(n)};
 }).sort((a,b)=>a.layer-b.layer);
s.instanceData=null;sceneDraw();const count=X.shadow.querySelector('.ix-scene-count');if(count)count.textContent=`${s.entries.length} / ${X.nodes.length} visible nodes`;
}
function sceneGeometry(n){const scale=170,r=n.rect;return [(r.left+r.width/2-innerWidth/2)/scale,(innerHeight/2-r.top-r.height/2)/scale,Math.max(.025,r.width/scale),Math.max(.025,r.height/scale),Math.min(n.layer,32)*.34];}
function sceneRefreshGeometry(){if(X.mode!=='layers'||!X.sceneState)return;const s=X.sceneState;for(const n of s.entries){const el=nearestElement(n.id);if(el)n.rect=rectObj(el.getBoundingClientRect());}sceneDraw();}
function sceneDraw(){const s=X.sceneState;if(!s||X.mode!=='layers')return;const {gl,canvas}=s;const dpr=Math.min(2,devicePixelRatio||1),w=Math.max(1,Math.round(innerWidth*dpr)),h=Math.max(1,Math.round(innerHeight*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';}if(!gl){sceneDraw2D(s);return;}gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
const mat=projectionMatrix(s);s.mat=mat;gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);
const data=new Float32Array(s.entries.length*9),links=[],centers=new Map();let i=0;
for(const n of s.entries){const g=sceneGeometry(n),c=sceneNodeColor(n);data.set([...g.slice(0,4),...c,g[4]],i*9);centers.set(n.id,g);i++;}
for(const n of s.entries){const c=centers.get(n.id),parent=centers.get(n.graphParentId);if(!c||!parent)continue;links.push(c[0],c[1],c[4],parent[0],parent[1],parent[4]);}
const flat=new Float32Array(links);gl.useProgram(s.lines);gl.uniformMatrix4fv(gl.getUniformLocation(s.lines,'projection'),false,mat);gl.uniform1f(gl.getUniformLocation(s.lines,'unfold'),s.progress);gl.uniform4f(gl.getUniformLocation(s.lines,'tint'),.43,.59,.78,.34);gl.bindVertexArray(s.lineVao);gl.bindBuffer(gl.ARRAY_BUFFER,s.lineBuffer);gl.bufferData(gl.ARRAY_BUFFER,flat,gl.DYNAMIC_DRAW);gl.drawArrays(gl.LINES,0,flat.length/3);
gl.useProgram(s.planes);gl.uniformMatrix4fv(gl.getUniformLocation(s.planes,'projection'),false,mat);gl.uniform1f(gl.getUniformLocation(s.planes,'unfold'),s.progress);gl.bindVertexArray(s.vao);gl.bindBuffer(gl.ARRAY_BUFFER,s.instanceBuffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);gl.drawArraysInstanced(gl.TRIANGLES,0,6,s.entries.length);gl.bindVertexArray(null);
const tip=X.shadow.querySelector('.ix-scene-tip');if(tip&&s.cursor){const node=scenePick(s.cursor.x,s.cursor.y);if(node){tip.hidden=false;tip.innerHTML=`<strong>${esc(node.label)}</strong><small>depth ${node.layer} · ${fmt(node.rect.width)} × ${fmt(node.rect.height)}</small>`;tip.style.left=Math.min(innerWidth-240,s.cursor.x+18)+'px';tip.style.top=Math.min(innerHeight-70,s.cursor.y+18)+'px';}else tip.hidden=true;}
}
function inPoly(x,y,pts){let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const xi=pts[i][0],yi=pts[i][1],xj=pts[j][0],yj=pts[j][1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;}return inside;}

function sceneDraw2D(s){const {canvas,ctx}=s,dpr=canvas.width/innerWidth;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.setTransform(dpr,0,0,dpr,0,0);const mat=projectionMatrix(s);s.mat=mat;
const centers=new Map();for(const n of s.entries){const g=sceneGeometry(n);const pt=projectPt(mat,g[0],g[1],g[4]*s.progress,innerWidth,innerHeight);if(pt)centers.set(n.id,pt);}
ctx.save();ctx.lineWidth=1;ctx.strokeStyle='rgba(114,165,225,.28)';
for(const n of s.entries){const c=centers.get(n.id),p=centers.get(n.graphParentId);if(c&&p){ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(c[0],c[1]);ctx.stroke();}}
ctx.restore();
for(const n of s.entries){const g=sceneGeometry(n),z=g[4]*s.progress;const pts=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([a,b])=>projectPt(mat,g[0]+a*g[2],g[1]+b*g[3],z,innerWidth,innerHeight));if(pts.some(p=>!p))continue;
const c=sceneNodeColor(n),r=Math.round(c[0]*255),gr=Math.round(c[1]*255),b=Math.round(c[2]*255);ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=`rgba(${r},${gr},${b},${Math.min(.37,c[3]*.25)})`;ctx.fill();ctx.strokeStyle=`rgba(${r},${gr},${b},${Math.min(1,c[3]+.25)})`;ctx.lineWidth=n.id===getId(X.selected)?2.4:1.05;ctx.stroke();if(n.id===getId(X.selected)){ctx.save();ctx.shadowColor='rgba(98,240,222,.8)';ctx.shadowBlur=11;ctx.strokeStyle='rgba(157,255,239,.9)';ctx.lineWidth=2;ctx.stroke();ctx.restore();}
}
const tip=X.shadow.querySelector('.ix-scene-tip');if(tip&&s.cursor){const n=scenePick(s.cursor.x,s.cursor.y);tip.hidden=!n;if(n){tip.innerHTML=`<strong>${esc(n.label)}</strong><small>depth ${n.layer} · ${fmt(n.rect.width)} × ${fmt(n.rect.height)}</small>`;tip.style.left=Math.min(innerWidth-240,s.cursor.x+18)+'px';tip.style.top=Math.min(innerHeight-70,s.cursor.y+18)+'px';}}
}
function scenePick(x,y){const s=X.sceneState;if(!s||!s.mat)return null;for(let i=s.entries.length-1;i>=0;i--){const n=s.entries[i],g=sceneGeometry(n),z=g[4]*s.progress;const pts=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([a,b])=>projectPt(s.mat,g[0]+a*g[2],g[1]+b*g[3],z,innerWidth,innerHeight));if(pts.every(Boolean)&&inPoly(x,y,pts))return n;}return null;}
function sceneEvents(s){const c=s.canvas;const onDown=ev=>{if(ev.button>1)return;s.drag={x:ev.clientX,y:ev.clientY,lastX:ev.clientX,lastY:ev.clientY,move:0,button:ev.button};c.setPointerCapture(ev.pointerId);};const onMove=ev=>{s.cursor={x:ev.clientX,y:ev.clientY};if(s.drag){const dx=ev.clientX-s.drag.lastX,dy=ev.clientY-s.drag.lastY;s.drag.move+=Math.abs(dx)+Math.abs(dy);if(s.drag.button===2||ev.shiftKey){s.target[0]-=dx/100;s.target[1]+=dy/100;}else{s.yaw+=dx*.006;s.pitch=Math.max(-1.3,Math.min(1.3,s.pitch+dy*.006));}s.drag.lastX=ev.clientX;s.drag.lastY=ev.clientY;}sceneDraw();};
const onUp=ev=>{if(!s.drag)return;if(s.drag.move<6){const n=scenePick(ev.clientX,ev.clientY);if(n){selectElement(nearestElement(n.id));toast('3D → DOM: '+n.label);}}s.drag=null;};
const onWheel=ev=>{if(X.mode!=='layers')return;ev.preventDefault();s.zoom=Math.max(.35,Math.min(3.4,s.zoom*(ev.deltaY>0?.92:1.08)));sceneDraw();};
c.addEventListener('pointerdown',onDown);c.addEventListener('pointermove',onMove);c.addEventListener('pointerup',onUp);c.addEventListener('wheel',onWheel,{passive:false});c.addEventListener('contextmenu',ev=>ev.preventDefault());
s.cleanup=()=>{c.removeEventListener('pointerdown',onDown);c.removeEventListener('pointermove',onMove);c.removeEventListener('pointerup',onUp);c.removeEventListener('wheel',onWheel);};}
function sceneAnimate(){const s=X.sceneState;if(!s)return;s.animStart=performance.now();function tick(now){if(X.mode!=='layers'||!X.sceneState)return;const elapsed=(now-s.animStart)/720;s.progress=X.opts.reducedMotion?1:Math.min(1,1-Math.pow(1-Math.min(1,elapsed),3));sceneDraw();if(s.progress<1)s.drawRaf=requestAnimationFrame(tick);}cancelAnimationFrame(s.drawRaf);s.drawRaf=requestAnimationFrame(tick);}
function sceneReset(){const s=X.sceneState;if(!s)return;s.target=[-.55,0,1.4];s.yaw=-.58;s.pitch=.53;s.distance=16;s.zoom=1;sceneDraw();}
function sceneFocus(el){const s=X.sceneState;if(!s)return;const n=s.entries.find(n=>n.id===getId(el));if(n){const g=sceneGeometry(n);s.target=[g[0],g[1],g[4]*Math.max(.3,s.progress)];s.zoom=1.25;sceneDraw();}}
function sceneCleanup(){const s=X.sceneState;if(!s)return;cancelAnimationFrame(s.drawRaf);s.cleanup?.();const gl=s.gl;if(!gl){X.sceneState=null;return;}for(const name of ['vao','lineVao'])gl.deleteVertexArray(s[name]);for(const name of ['instanceBuffer','lineBuffer'])gl.deleteBuffer(s[name]);for(const name of ['planes','lines'])gl.deleteProgram(s[name]);X.sceneState=null;}
