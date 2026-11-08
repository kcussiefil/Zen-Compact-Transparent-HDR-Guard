'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,'video-page.uc.js'),'utf8');
const css=fs.readFileSync(path.join(root,'chrome.css'),'utf8');
const script=fs.readFileSync(path.join(root,'sdr-glass.uc.js'),'utf8');
const prefs=JSON.parse(fs.readFileSync(path.join(root,'preferences.json'),'utf8'));
const theme=JSON.parse(fs.readFileSync(path.join(root,'theme.json'),'utf8'));
function setup(start='https://www.bilibili.com/video/BV123',options={}){
 const attrs=new Set(),listeners={},prefListeners=new Map();
 const current={currentURI:{spec:start}};
 const bools={
  'mod.compacttpr.bilibiliinstantglass':options.fast!==false,
  'zia.glass.blur-over-video':options.blur!==false
 };
 const element={
  toggleAttribute:(a,on)=>on?attrs.add(a):attrs.delete(a),
  removeAttribute:a=>attrs.delete(a),
  hasAttribute:a=>attrs.has(a)
 };
 const win={
  gBrowser:{
   selectedBrowser:current,
   tabContainer:{addEventListener:(name,fn)=>{listeners[name]=fn},
    removeEventListener:(name)=>delete listeners[name]},
   addTabsProgressListener:handler=>{listeners.progress=handler},
   removeTabsProgressListener:()=>{delete listeners.progress}
  },
  setTimeout:()=>{listeners.timers=(listeners.timers||0)+1;return 1},
  clearTimeout:()=>{},
  addEventListener:(_name,fn)=>{listeners.unload=fn}
 };
 const services={prefs:{
  getBoolPref:(key,defaultValue)=>bools[key]??defaultValue,
  addObserver:(key,observer)=>prefListeners.set(key,observer),
  removeObserver:key=>prefListeners.delete(key)
 }};
 vm.runInNewContext(code,{document:{documentElement:element},window:win,
  Services:services,URL,console});
 return {attrs,listeners,prefListeners,bools,current,win,
  has:()=>attrs.has('data-zcth-bilibili-glass'),
  select:url=>{const other={currentURI:{spec:url}};win.gBrowser.selectedBrowser=other;
   listeners.TabSelect();return other},
  changeLocation:url=>{win.gBrowser.selectedBrowser.currentURI.spec=url;
   listeners.progress.onLocationChange(win.gBrowser.selectedBrowser,null,null,{spec:url})},
  changePref:(name,val)=>{bools[name]=val;prefListeners.get(name)?.observe()}
 };
}

test('024 release and correct wildcard www.bilibili.com/* are default',()=>{
 assert.equal(theme.version,'0.3.10');
 assert.equal(prefs.find(p=>p.property==='mod.compacttpr.bilibiliinstantglass')?.defaultValue,true);
 assert.equal(prefs.find(p=>p.property==='mod.compacttpr.sdrsitepatterns')?.defaultValue,'www.bilibili.com/*');
 assert.ok(script.includes("const DEFAULT='www.bilibili.com/*'"));
});
test('Bilibili selected at startup gets custom glass synchronously, no timeout',()=>{
 const x=setup();
 assert.equal(x.has(),true);
 assert.equal(x.listeners.timers||0,0,'no delayed marker assignment');
});
test('Bilibili exact hostname with every path/query is covered, but not lookalikes',()=>{
 for(const url of [
  'https://www.bilibili.com/',
  'https://www.bilibili.com/video/BV17?spm=1',
  'https://www.bilibili.com/bangumi/play/ep1',
  'https://www.bilibili.com/v/popular/all',
  'https://www.bilibili.com/search?keyword=test',
  'http://www.bilibili.com/video/BV'
 ])assert.equal(setup(url).has(),true,url);
 for(const url of [
  'https://bilibili.com/video/BV',
  'https://m.bilibili.com/video/BV',
  'https://api.bilibili.com/video/BV',
  'https://www.bilibili.com.evil.test/video/BV',
  'https://example.com/?next=https://www.bilibili.com/video/BV',
  'https://www.youtube.com/watch?v=abc',
  'about:blank'
 ])assert.equal(setup(url).has(),false,url);
});
test('TabSelect writes the marker before the next tick, and retracts on other sites',()=>{
 const x=setup();
 x.select('https://www.youtube.com/watch?v=123');
 assert.equal(x.has(),false);
 x.select('https://www.bilibili.com/bangumi/play/ep2');
 assert.equal(x.has(),true);
 assert.equal(x.listeners.timers||0,0);
});
test('onLocationChange uses the immediate new URL even before currentURI updates',()=>{
 const x=setup('https://www.youtube.com/watch?v=123');
 const browser=x.win.gBrowser.selectedBrowser;
 x.listeners.progress.onLocationChange(browser,null,null,{spec:'https://www.bilibili.com/video/BV'});
 assert.equal(x.has(),true);
 assert.equal(x.listeners.timers||0,0);
 x.listeners.progress.onLocationChange(browser,null,null,{spec:'https://www.youtube.com/watch?v=123'});
 assert.equal(x.has(),false);
});
test('changing Bilibili quick override preference instantly returns to normal classifier',()=>{
 const x=setup();
 x.changePref('mod.compacttpr.bilibiliinstantglass',false);
 assert.equal(x.has(),false);
 x.changePref('mod.compacttpr.bilibiliinstantglass',true);
 assert.equal(x.has(),true);
 assert.equal(x.listeners.timers||0,0);
});
test('Zia video blur OFF never invokes Bilibili exception even when user enabled',()=>{
 const x=setup('https://www.bilibili.com/video/BV',{blur:false});
 assert.equal(x.has(),false);
 x.changePref('zia.glass.blur-over-video',true);
 assert.equal(x.has(),true);
 x.changePref('zia.glass.blur-over-video',false);
 assert.equal(x.has(),false);
});
test('cleanup removes all markers and preference listeners',()=>{
 const x=setup();
 assert.equal(x.prefListeners.size,2);
 x.win.__zcthVideoPageGuardV011.cleanup();
 assert.equal(x.has(),false);
 assert.equal(x.prefListeners.size,0);
});
test('Bilibili fast path is a dedicated stylesheet branch, not fake SDR',()=>{
 assert.match(css,/\[data-zcth-bilibili-glass\]/);
 assert.equal((css.match(/\[data-zcth-bilibili-glass\]/g)||[]).length,7,
  'sidebar, three URL popup selectors, preview card, color editor, and open-only compositor gate');
 assert.match(script,/if\(root\.hasAttribute\('data-zcth-bilibili-glass'\)\)return false/);
 assert.match(script,/if\(!alive\|\|!browser\|\|root\.hasAttribute\('data-zcth-bilibili-glass'\)\)return/);
 assert.doesNotMatch(code,/setInterval|setTimeout\(refresh|mediaKey|sendQuery|data-zcth-sdr-glass/);
 assert.doesNotMatch(code,/will-change:\s*transform|backface-visibility:\s*hidden/);
});
