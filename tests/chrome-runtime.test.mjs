import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../sdr-glass.uc.js',import.meta.url),'utf8');
function setup(initial='sdr') {
 const attrs=new Set(['zia-video']);
 let state=initial,resolveQuery;
 const delays=[],events={};
 const root={hasAttribute:name=>attrs.has(name),
 toggleAttribute:(name,flag)=>flag?attrs.add(name):attrs.delete(name),
 removeAttribute:name=>attrs.delete(name)};
 const actor={sendQuery:()=>new Promise(resolve=>{resolveQuery=resolve;})};
 const browser={currentURI:{spec:'https://www.youtube.com/watch?v=abc12345678'},
 browsingContext:{currentWindowGlobal:{getActor:()=>actor}}};
 const tabs={addEventListener:(n,fn)=>{events[n]=fn;},removeEventListener:()=>{}};
 const win={gBrowser:{selectedBrowser:browser,tabContainer:tabs,
 addTabsProgressListener:o=>events.progress=o,removeTabsProgressListener:()=>{}},
 setTimeout:fn=>{delays.push(fn);return 1},
 setInterval:fn=>{events.interval=fn;return 2},clearInterval:()=>{},addEventListener:()=>{}};
 const ChromeUtils={registerWindowActor:(name,config)=>{
 assert.equal(name,'ZcthStream');assert.equal(config.safeForUntrustedWebProcess,true);}};
 const Services={prefs:{getBoolPref:()=>true}};
 vm.runInNewContext(source,{window:win,ChromeUtils,Services,document:{documentElement:root},URL,console});
 const fire=()=>{while(delays.length)delays.shift()()};
 const settle=async()=>{resolveQuery(state);await Promise.resolve();await Promise.resolve()};
 return {attrs,root,browser,events,fire,settle,setStatus:value=>{state=value}};
}
test('confirmed SDR only: HDR or unknown clears glass',async()=>{
 const s=setup('sdr');s.fire();await s.settle();
 assert.ok(s.attrs.has('data-zcth-sdr-glass'));
 s.setStatus('hdr');s.events.interval();await s.settle();
 assert.ok(!s.attrs.has('data-zcth-sdr-glass'));
 s.setStatus('unknown');s.events.interval();await s.settle();
 assert.ok(!s.attrs.has('data-zcth-sdr-glass'));
});
test('offscreen video / non-YouTube pages remain solid',async()=>{
 const s=setup();s.fire();await s.settle();s.root.removeAttribute('zia-video');
 s.events.interval();assert.ok(!s.attrs.has('data-zcth-sdr-glass'));
 s.root.toggleAttribute('zia-video',true);
 s.browser.currentURI.spec='https://www.bilibili.com/video/BV123';
 s.events.interval();assert.ok(!s.attrs.has('data-zcth-sdr-glass'));
});
test('navigation clears old SDR glass synchronously',async()=>{
 const s=setup();s.fire();await s.settle();
 s.browser.currentURI.spec='https://www.youtube.com/watch?v=another';
 s.events.TabSelect();
 assert.ok(!s.attrs.has('data-zcth-sdr-glass'));
});
