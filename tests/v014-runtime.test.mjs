import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../sdr-glass.uc.js',import.meta.url),'utf8');
function setup(pref=true) {
 let n=0,status='sdr'; const events={},timeouts=new Map(),attrs=new Set(['zia-video']);
 const root={hasAttribute:x=>attrs.has(x),removeAttribute:x=>attrs.delete(x),
   toggleAttribute:(x,b)=>b?attrs.add(x):attrs.delete(x)};
 const actor={sendQuery:async()=>status};
 const browser={currentURI:{spec:'https://www.youtube.com/watch?v=abc'},
   browsingContext:{currentWindowGlobal:{getActor:()=>actor}}};
 const tabContainer={addEventListener:(n,f)=>events[n]=f,removeEventListener:()=>{}};
 const win={gBrowser:{selectedBrowser:browser,tabContainer,
   addTabsProgressListener:p=>events.progress=p,removeTabsProgressListener:()=>{}},
   setTimeout:(f,d)=>{timeouts.set(++n,{f,d});return n},
   clearTimeout:id=>timeouts.delete(id),
   setInterval:(fn,d)=>{events.interval=fn;return ++n},
   clearInterval:()=>{},addEventListener:()=>{}};
 const Services={prefs:{getBoolPref:()=>pref}};
 let observer;
 class Observer {constructor(cb){this.callback=cb;observer=this;}observe(){}disconnect(){}}
 const ChromeUtils={registerWindowActor:(name,config)=>{
   assert.equal(name,'ZcthStreamV014');
   assert.ok(config.child.events.playing);
   assert.ok(config.child.events.loadeddata);
 }};
 vm.runInNewContext(source,{window:win,document:{documentElement:root},
   ChromeUtils,Services,MutationObserver:Observer,URL,console});
 async function flush() {
   for(let round=0;round<20;round++){
     const tasks=[...timeouts.entries()];
     if(!tasks.length) break;
     for(const[id,t]of tasks){timeouts.delete(id);t.f();}
     await Promise.resolve();await Promise.resolve();
   }
 }
 return {attrs,root,browser,win,events,flush,observer,
   setStatus:s=>status=s,setPref:p=>pref=p};
}
test('two quick SDR confirmations permit real glass',async()=>{
 const x=setup();await x.flush();x.events.interval();await x.flush();
 assert.ok(x.attrs.has('data-zcth-sdr-glass'));
});
test('HDR and unknown remove any previous real glass',async()=>{
 const x=setup();await x.flush();x.events.interval();await x.flush();
 x.setStatus('hdr');x.events.interval();await x.flush();
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'));
 x.setStatus('unknown');x.events.interval();await x.flush();
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'));
});
test('video-change and navigation events clear glass immediately',async()=>{
 const x=setup();await x.flush();x.events.interval();await x.flush();
 x.win.__zcthSdrGlassV014.onVideoChange(x.browser);
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'));
 await x.flush();x.events.interval();await x.flush();
 x.browser.currentURI.spec='https://www.youtube.com/watch?v=new';
 x.events.TabSelect();assert.ok(!x.attrs.has('data-zcth-sdr-glass'));
});
test('Zia marker disappearing, or option off, cannot leave blur active',async()=>{
 const x=setup();await x.flush();x.events.interval();await x.flush();
 x.root.removeAttribute('zia-video');
 x.observer.callback([{attributeName:'zia-video'}]);
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'));
 x.setPref(false);x.events.interval();await x.flush();
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'));
});
