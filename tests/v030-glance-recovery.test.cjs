'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','glance-recovery.uc.js'),'utf8');

function setup({enabled=true,video=false,rootVideo=false,open=false}={}){
 const attrs=new Set(rootVideo?['zia-video']:[]);
 const callbacks={};
 const frames=[];
 let observing=false,disconnected=false;
 const state={enabled,video,open};
 const root={
  hasAttribute:x=>attrs.has(x),
  setAttribute:(x)=>attrs.add(x),
  removeAttribute:(x)=>attrs.delete(x)
 };
 const panels={
  querySelector:selector=>{
   if(selector.includes('.zen-glance-overlay.deck-selected'))return state.open?{}:null;
   if(selector.includes('browser[zia-video]'))return state.video?{}:null;
   return null;
  }
 };
 const tabs={
  addEventListener:(name,fn)=>{callbacks[name]=fn},
  removeEventListener:(name)=>{delete callbacks[name]}
 };
 const document={documentElement:root,getElementById:(id)=>id==='tabbrowser-tabpanels'?panels:null};
 const window={
  gBrowser:{tabContainer:tabs},
  setTimeout:(f)=>{callbacks.start=f;return 1},
  clearTimeout:()=>{},
  requestAnimationFrame:(f)=>{frames.push(f);return frames.length},
  cancelAnimationFrame:()=>{},
  addEventListener:()=>{}
 };
 class MutationObserver{
  constructor(fn){callbacks.mutation=fn}
  observe(){observing=true}
  disconnect(){disconnected=true}
 }
 const Services={prefs:{
  getBoolPref:()=>state.enabled,
  addObserver:(_,f)=>{callbacks.pref=f},
  removeObserver:()=>{}
 }};
 vm.runInNewContext(source,{window,document,Services,MutationObserver,console});
 const fire=()=>callbacks.mutation([{type:'attributes',attributeName:'class',target:{classList:{contains:()=>true}}}]);
 const frame=()=>{const fn=frames.shift();assert.ok(fn,'expected queued frame');fn()};
 return {attrs,state,callbacks,frame,fire,observing:()=>observing,disconnected:()=>disconnected,
  cleanup:()=>window.__zcthGlanceRecoveryV030.cleanup()};
}
test('Glance recovery only triggers after transition from open to closed',()=>{
 const x=setup();assert.ok(x.observing());
 x.state.open=true;x.fire();
 x.state.open=false;x.fire();
 assert.ok(!x.attrs.has('data-zcth-glance-recover'));
 x.frame();assert.ok(x.attrs.has('data-zcth-glance-recover'));
 x.frame();assert.ok(!x.attrs.has('data-zcth-glance-recover'));
 x.cleanup();assert.ok(x.disconnected());
});
test('Glance reset does not touch the video compositor in an HDR/protected state',()=>{
 const x=setup();
 x.state.open=true;x.fire();
 x.state.open=false;x.state.video=true;x.fire();
 assert.ok(!x.attrs.has('data-zcth-glance-recover'));
 x.cleanup();
 const y=setup({rootVideo:true});y.state.open=true;y.fire();
 y.state.open=false;y.fire();assert.ok(!y.attrs.has('data-zcth-glance-recover'));y.cleanup();
});
test('default-off user switch prevents any force-recomposition and restores on enable',()=>{
 const x=setup({enabled:false});x.state.open=true;x.fire();x.state.open=false;x.fire();
 assert.ok(!x.attrs.has('data-zcth-glance-recover'));
 x.state.enabled=true;x.state.open=true;x.fire();x.state.open=false;x.fire();
 x.frame();assert.ok(x.attrs.has('data-zcth-glance-recover'));
 x.state.enabled=false;x.callbacks.pref.observe();
 assert.ok(!x.attrs.has('data-zcth-glance-recover'));
 x.cleanup();
});
test('GlanceClose bubbling event also runs one-frame compositor reset',()=>{
 const x=setup({open:false});
 x.callbacks.GlanceClose();x.frame();
 assert.ok(x.attrs.has('data-zcth-glance-recover'));
 x.frame();assert.ok(!x.attrs.has('data-zcth-glance-recover'));
 x.cleanup();
});
