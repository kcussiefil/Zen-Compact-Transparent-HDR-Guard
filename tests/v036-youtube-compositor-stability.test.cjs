'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const css=read('chrome.css'),source=read('video-page.uc.js');
const from=css.indexOf('/* v0.3.6 — YouTube-only offscreen compositor mitigation');
const to=css.indexOf('@media -moz-pref("zia.cards.blur")',from);
const rule=css.slice(from,to);
test('036 version and YouTube-only gated hidden-pane compositor',()=>{
 assert.equal(JSON.parse(read('theme.json')).version,'0.3.6');
 assert.ok(from>0&&to>from);
 for(const pattern of [/@media \(-moz-platform: macos\)/,/@media -moz-pref\("zia\.compact\.sidebar-blur"\)/,/:root\[zen-compact-mode="true"\]\[data-zcth-youtube-page\]/,/#navigator-toolbox:is\(/,/#tabbrowser-tabpanels > \.browserSidebarContainer:not\(/,/\.deck-selected, \[zen-split="true"\]/,/\.zen-glance-overlay\.deck-selected/,/will-change: auto !important/,/backface-visibility: visible !important/])assert.match(rule,pattern);
});
test('036 preserves selected browser promotion, original HG 10px paint and no extra schedulers',()=>{
 for(const pattern of [/will-change:\s*transform/,/backface-visibility:\s*hidden/,/(?:backdrop-filter|background-color|opacity|transition|animation|transform):/,/setInterval|setTimeout|MutationObserver/])assert.doesNotMatch(rule,pattern);
 assert.match(css,/#titlebar::before[\s\S]*?--mod-compacttpr-customblur/);
});
test('036 YouTube marker appears synchronously, never for Bilibili, and is cleaned up',()=>{
 const attrs=new Set(),rootEl={toggleAttribute(k,v){if(v)attrs.add(k);else attrs.delete(k)},removeAttribute(k){attrs.delete(k)}};
 let url='https://www.youtube.com/watch?v=abc';
 const browser={currentURI:{get spec(){return url}}},listeners={};
 const win={gBrowser:{selectedBrowser:browser,tabContainer:{addEventListener(){},removeEventListener(){}},addTabsProgressListener(p){listeners.p=p},removeTabsProgressListener(){}},addEventListener(){},setTimeout(){throw Error('unexpected timer')}};
 const prefs={getBoolPref(k,f){return f},addObserver(){},removeObserver(){}};
 vm.runInNewContext(source,{document:{documentElement:rootEl},window:win,Services:{prefs},URL});
 const guard=win.__zcthVideoPageGuardV011;
 assert.ok(guard);
 assert.ok(attrs.has('data-zcth-youtube-page'));
 for(const [next,expected] of [['https://www.bilibili.com/video/BV123',false],['https://www.youtube.com/',false],['https://example.org/',false],['https://youtu.be/abc',true],['https://youtube.com/shorts/abc',true],['https://www.youtube.com/live/abc',true]]){
  url=next;guard.refresh();assert.equal(attrs.has('data-zcth-youtube-page'),expected,next);
 }
 guard.cleanup();assert.ok(!attrs.has('data-zcth-youtube-page'));
});

test('036 added marker is the only byte difference in v0.3.1 URL/Bilibili core',()=>{
 const crypto=require('node:crypto');
 const a=source.indexOf('  // Synchronous, YouTube-only state');
 const b=source.indexOf('  // Explicit user opt-in covers',a);
 assert.ok(a>0&&b>a);
 const stripped=(source.slice(0,a-1)+source.slice(b))
   .replace("\n    root.toggleAttribute('data-zcth-youtube-page', isYouTubeVideoPage(spec));","")
   .replace("\n    root.removeAttribute('data-zcth-youtube-page');","");
 const bytes=Buffer.from(stripped,'utf8');
 const originalHash=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length)).update(Buffer.from([0])).update(bytes).digest('hex');
 assert.equal(originalHash,'698860f7b14e018811e6fb79ceed46a2c984c541');
});
