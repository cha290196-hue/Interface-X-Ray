import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const dir=new URL('../../src/',import.meta.url);
const files=['core.js','inspect.js','diagnose.js','patch.js','scene.js'];
const code=files.map(x=>readFileSync(new URL(x,dir),'utf8')).join('\n')+'\nglobalThis.api={contextReason,perspective,ortho,mul,inPoly,cssPatchText,PATCH_PROPERTIES,X};';
const ctx=vm.createContext({console});vm.runInContext(code,ctx);const {contextReason,perspective,ortho,mul,inPoly,cssPatchText,PATCH_PROPERTIES,X}=ctx.api;
function style(changes={}){return {position:'static',zIndex:'auto',opacity:'1',transform:'none',filter:'none',perspective:'none',isolation:'auto',mixBlendMode:'normal',contain:'none',willChange:'auto',...changes};}
test('stacking contexts distinguish paint triggers from DOM depth',()=>{
 assert.equal(contextReason(style()),null);
 assert.match(contextReason(style({position:'relative',zIndex:'4'})),/z-index/);
 assert.equal(contextReason(style({opacity:'.6'})),'opacity: .6');
 assert.equal(contextReason(style({transform:'translateX(2px)'})),'transform');
 assert.equal(contextReason(style({isolation:'isolate'})),'isolation');
 assert.equal(contextReason(style({position:'fixed'})),'position: fixed');
});
test('projection matrices are finite and shape-preserving',()=>{
 for(const m of [perspective(Math.PI/3,1.6,.1,100),ortho(-4,4,-3,3,.1,100)]){
 assert.equal(m.length,16);assert.ok([...m].every(Number.isFinite));
 }
 const id=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
 const m=perspective(Math.PI/2,1,.1,100);
 assert.deepEqual([...mul(id,m)],[...m]);
});
test('3D hit testing respects polygon boundaries',()=>{
 const pts=[[10,10],[100,20],[90,110],[0,100]];
 assert.equal(inPoly(50,50,pts),true);
 assert.equal(inPoly(180,80,pts),false);
});
test('patch export reflects the latest local value without source modifications',()=>{
 assert.ok(PATCH_PROPERTIES.includes('min-width'));
 assert.ok(!PATCH_PROPERTIES.includes('background-image'));
 X.history=[{selector:'#item',property:'min-width',after:'0px'},{selector:'#item',property:'min-width',after:'1px'},{selector:'#item',property:'gap',after:'8px'}];
 const result=cssPatchText();assert.match(result,/#item/);assert.match(result,/min-width: 1px;/);assert.match(result,/gap: 8px;/);assert.ok(!result.includes('min-width: 0px;'));
});
test('manifest asks for only activeTab + scripting',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../../manifest.json',import.meta.url)));
 assert.equal(manifest.manifest_version,3);
 assert.deepEqual(manifest.permissions,['activeTab','scripting']);
 assert.equal(manifest.host_permissions,undefined);
 assert.equal(manifest.background.service_worker,'background.js');
});
