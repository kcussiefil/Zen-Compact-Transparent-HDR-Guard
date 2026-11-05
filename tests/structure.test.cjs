'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const dir=path.resolve(__dirname,'..');
const source=name=>fs.readFileSync(path.join(dir,name),'utf8');
const css=source('chrome.css');
const script=source('video-page.uc.js');
const meta=JSON.parse(source('theme.json'));
const prefs=JSON.parse(source('preferences.json'));

test('independent Sine entrypoints and no sliders',()=>{
 assert.equal(meta.version,'0.1.1');
 assert.deepEqual(Object.keys(meta.scripts),['video-page.uc.js']);
 assert.equal(meta.style.chrome,'chrome.css');
 assert.equal(meta.preferences,'preferences.json');
 assert.ok(!fs.existsSync(path.join(dir,'sliders.uc.js')));
 assert.equal(prefs.some(p=>p.label?.includes('滑桿')),false);
 assert.ok(!prefs.some(p=>/video(sidebar|card)opacity/.test(p.property||'')));
 for(const val of ['5px','15%','80%'])
   assert.equal(prefs.some(p=>p.label?.includes('預設 '+val)),true);
});

test('HDR guard restores native Zen/Zia theme paint, no forced video compositor',()=>{
 assert.match(css,/:root:is\(\[zia-video\], \[data-zcth-video-page\]\)/);
 assert.match(css,/#titlebar::before\s*{[\s\S]*?content:\s*none\s*!important/);
 assert.match(css,/\.zen-browser-generic-background\.zen-toolbar-background\s*{[\s\S]*?display:\s*flex\s*!important/);
 assert.doesNotMatch(css,/\.browserSidebarContainer\s*{[^}]*will-change:\s*transform/);
 assert.doesNotMatch(css,/--mod-compacttpr-videosidebaropacity/);
 assert.doesNotMatch(css,/--mod-compacttpr-videocardopacity/);
});

test('normal page preserves upstream real glass',()=>{
 assert.match(css,/backdrop-filter:\s*blur\(\s*var\(--mod-compacttpr-customblur, 5px\)/);
 assert.match(css,/--mod-compacttpr-transparentvalue, 15%/);
});

test('video URL classifier and event lifecycle',()=>{
 const root={
   flag:false,
   toggleAttribute:(key,value)=>{if(key==='data-zcth-video-page')root.flag=value;},
   removeAttribute:()=>{root.flag=false;}
 };
 const listeners={};
 const tabs={addEventListener:(k,fn)=>{listeners[k]=fn;},removeEventListener:()=>{}};
 const browser={currentURI:{spec:'https://www.youtube.com/watch?v=abc'}};
 const tasks=[];
 let seq=0,progress;
 const win={
   gBrowser:{selectedBrowser:browser,tabContainer:tabs,
     addTabsProgressListener:x=>{progress=x;},removeTabsProgressListener:()=>{}},
   setTimeout:fn=>{tasks.push(fn);return ++seq;},
   clearTimeout:()=>{},addEventListener:()=>{}
 };
 const flush=()=>{while(tasks.length)tasks.shift()();};
 vm.runInNewContext(script,{window:win,document:{documentElement:root},URL});
 flush();
 assert.equal(root.flag,true);
 for(const [url,expect] of [
   ['https://www.youtube.com/watch?v=abc',true],
   ['https://www.youtube.com/feed/subscriptions',false],
   ['https://www.youtube.com/shorts/ABC',true],
   ['https://www.youtube.com/live/ABC',true],
   ['https://www.bilibili.com/video/BV1xx',true],
   ['https://github.com/kcussiefil',false]
 ]) {
   browser.currentURI.spec=url;
   progress.onLocationChange(browser);
   flush();
   assert.equal(root.flag,expect,url);
 }
});
