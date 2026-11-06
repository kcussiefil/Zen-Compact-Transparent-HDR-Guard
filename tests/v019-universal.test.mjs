import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

globalThis.JSWindowActorChild=class {};
globalThis.JSWindowActorParent=class {};
const {classifyYouTube,classifyBilibili,classifyGeneric,ZcthUniversalChild}
  =await import('../actors/ZcthUniversalChild.sys.mjs');
const {ZcthUniversalParent}=await import('../actors/ZcthUniversalParent.sys.mjs');
const code=fs.readFileSync(new URL('../sdr-glass.uc.js',import.meta.url),'utf8');

test('Bilibili current 1080P is SDR',()=>assert.equal(
 classifyBilibili({quality:{realQ:80,nowQ:80,newQ:80}}),'sdr'));
test('Bilibili 125 HDR, 126 Dolby Vision, 129 HDR Vivid',()=>{
 for(const q of [125,126,129])assert.equal(
  classifyBilibili({quality:{realQ:q,nowQ:q}}),'hdr');
});
test('Bilibili switching to HDR remains protected',()=>assert.equal(
 classifyBilibili({quality:{realQ:80,nowQ:125}}),'hdr'));
test('Bilibili changing between SDR tiers returns unknown until settled',()=>assert.equal(
 classifyBilibili({quality:{realQ:80,nowQ:112}}),'unknown'));
test('Bilibili stale initial HDR does not override settled SDR quality',()=>assert.equal(
 classifyBilibili({quality:{realQ:80,nowQ:80},initialQuality:125}),'sdr'));
test('Unknown Bilibili quality fails closed until user site rule applies',()=>assert.equal(
 classifyBilibili({}),'unknown'));
test('Generic HTML5 AVC codec can be recognized SDR',()=>assert.equal(
 classifyGeneric({type:'video/mp4; codecs="avc1.640028"'}),'sdr'));
test('Generic PQ and HLG metadata block glass',()=>{
 for(const transfer of ['smpte2084','arib-std-b67','PQ','hlg'])
  assert.equal(classifyGeneric({transfer}),'hdr');
});
test('Generic MP4, blob and unknown formats are never assumed SDR',()=>{
 assert.equal(classifyGeneric({type:'video/mp4'}),'unknown');
 assert.equal(classifyGeneric({type:'video/webm; codecs="vp09.02.51.10"'}),'unknown');
});
test('YouTube current-stream classification still works',()=>{
 const fmt={itag:248,mimeType:'video/webm; codecs="vp9"'};
 assert.equal(classifyYouTube({
  videoId:'abc',playingId:'abc',fmt:248,
  stats:{codecs:'vp09.00.51.08 (248) / opus (251)'},
  response:{streamingData:{adaptiveFormats:[fmt]}}
 }),'sdr');
});
function setup(panes=1,options={}){
 let now=1000;
 const listeners={};
 const attrs=new Set(options.rootZiaVideo===false?[]:['zia-video']);
 let videoVisible=true;
 const booleanPrefs={
  'mod.compacttpr.sdrrealblur':options.sdrEnabled!==false,
  'mod.compacttpr.hdrrealblur':options.hdrEnabled===true,
  'zia.glass.blur-over-video':options.ziaBlurOverVideo===true
 };
 const props=new Map();
 const root={
  hasAttribute:k=>attrs.has(k),
  removeAttribute:k=>{attrs.delete(k);props.delete(k)},
  setAttribute:(k,v)=>{attrs.add(k);props.set(k,v)},
  toggleAttribute:(k,v)=>v?attrs.add(k):attrs.delete(k)
 };
 const b=Array.from({length:panes},(_,i)=>({
  currentURI:{spec:i===0?'https://www.bilibili.com/video/BVabc':'https://www.youtube.com/watch?v=other'},
  browsingContext:{currentWindowGlobal:{getActor:()=>null}}
 }));
 const pref={
  'mod.compacttpr.sdrsitepatterns':'www.bilibili.com/video/*',
  'mod.compacttpr.manualvideourl':''
 };
 const win={
  gBrowser:{selectedBrowser:b[0],
   tabContainer:{addEventListener:(n,f)=>listeners[n]=f,removeEventListener:()=>{}},
   addTabsProgressListener:()=>{},removeTabsProgressListener:()=>{}},
  setInterval:(f,ms)=>{listeners.tick=f;listeners.ms=ms;return 1},
  clearInterval:()=>{},
  setTimeout:(f)=>{listeners.scheduled=f;return 2},
  clearTimeout:()=>{},addEventListener:()=>{}
 };
 const doc={documentElement:root,querySelectorAll:()=>videoVisible?b:[]};
 class Observer{constructor(f){this.f=f;listeners.observer=this}observe(){}disconnect(){}}
 let config;
 vm.runInNewContext(code,{
  window:win,document:doc,URL,Date:{now:()=>now},
  ChromeUtils:{registerWindowActor:(name,opts)=>{config={name,opts}}},
  Services:{prefs:{getBoolPref:(k,d)=>booleanPrefs[k]??d,getStringPref:(k,d)=>pref[k]??d}},
  MutationObserver:Observer,console
 });
 return {b,props,attrs,win,pref,booleanPrefs,listeners,config,
  setVideoVisible:flag=>{videoVisible=flag},
  manager:win.__zcthUniversalV019,advance:ms=>{now+=ms;listeners.tick()}};
}
test('Actor registration covers HTTP/HTTPS in all frames and uses 50ms probe',()=>{
 const x=setup();
 assert.equal(x.config.name,'ZcthUniversal');
 assert.equal(x.config.opts.allFrames,true);
 assert.ok(x.config.opts.child.events.playing);
 assert.equal(x.listeners.ms,50);
});
test('Bilibili unknown has delayed site-rule fallback',()=>{
 const x=setup();
 x.manager.onFrameState(x.b[0],'f',{state:'unknown',count:1,mediaKey:'m1'});
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'));
 x.advance(349);assert.ok(!x.attrs.has('data-zcth-sdr-glass'));
 x.advance(2);assert.ok(x.attrs.has('data-zcth-sdr-glass'));
 assert.equal(x.props.get('data-zcth-classification-source'),'site-rule');
});
test('HDR always wins over a matching manual site rule',()=>{
 const x=setup();x.manager.onFrameState(x.b[0],'f',{state:'unknown',count:1});
 x.advance(500);assert.ok(x.attrs.has('data-zcth-sdr-glass'));
 x.manager.onFrameState(x.b[0],'f',{state:'hdr',count:1});
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'));
 assert.equal(x.props.get('data-zcth-stream-state'),'hdr');
});
test('Confirmed Bilibili SDR is immediate, with no 350ms wait',()=>{
 const x=setup();
 x.manager.onFrameState(x.b[0],'f',{state:'sdr',count:1});
 assert.ok(x.attrs.has('data-zcth-sdr-glass'));
 assert.equal(x.props.get('data-zcth-classification-source'),'auto');
});
test('One-video exact URL override is immediate and stops on navigation',()=>{
 const x=setup();x.b[0].currentURI.spec='https://www.youtube.com/watch?v=abc';
 x.listeners.TabSelect();
 x.pref['mod.compacttpr.manualvideourl']='https://www.youtube.com/watch?v=abc&t=20';
 x.manager.onFrameState(x.b[0],'f',{state:'unknown',count:1});
 assert.ok(x.attrs.has('data-zcth-sdr-glass'));
 x.b[0].currentURI.spec='https://www.youtube.com/watch?v=def';
 x.listeners.TabSelect();
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'));
});
test('Manual override cannot bypass confirmed YouTube HDR',()=>{
 const x=setup();x.b[0].currentURI.spec='https://www.youtube.com/watch?v=abc';
 x.pref['mod.compacttpr.manualvideourl']='https://www.youtube.com/watch?v=abc';
 x.manager.onFrameState(x.b[0],'f',{state:'hdr',count:1});
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'));
});
test('Split panes cannot blur until every visible video is SDR',()=>{
 const x=setup(2);
 x.manager.onFrameState(x.b[0],'a',{state:'sdr',count:1});
 x.manager.onFrameState(x.b[1],'b',{state:'unknown',count:1});
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'));
 x.manager.onFrameState(x.b[1],'b',{state:'hdr',count:1});
 assert.equal(x.props.get('data-zcth-stream-state'),'hdr');
 x.manager.onFrameState(x.b[1],'b',{state:'sdr',count:1});
 assert.ok(x.attrs.has('data-zcth-sdr-glass'));
});
test('Zia removing visible-video state clears all forced blur',()=>{
 const x=setup();
 x.manager.onFrameState(x.b[0],'f',{state:'sdr',count:1});
 assert.ok(x.attrs.has('data-zcth-sdr-glass'));
 x.attrs.delete('zia-video');
 x.setVideoVisible(false);
 x.listeners.observer.f([{attributeName:'zia-video'}]);
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'));
});
test('Parent actor passes frame state to chrome and can retract it',()=>{
 const x=setup();
 const actor=new ZcthUniversalParent();
 x.b[0].ownerGlobal=x.win;
 actor.browsingContext={top:{embedderElement:x.b[0]}};
 actor.receiveMessage({name:'ZcthUniversal:State',
  data:{state:'sdr',count:1,mediaKey:'foo'}});
 assert.ok(x.attrs.has('data-zcth-sdr-glass'));
 actor.didDestroy();
 assert.equal(x.props.get('data-zcth-stream-state'),'unknown');
});

test('Two videos in the same Bilibili frame cannot inherit one SDR quality',()=>{
 const actor=new ZcthUniversalChild();
 const video=()=>({
  isConnected:true,error:null,readyState:4,videoWidth:1920,
  getBoundingClientRect:()=>({width:500,height:300,right:600,bottom:500,top:5,left:5}),
  currentSrc:'blob:mock',querySelector:()=>null,getAttribute:()=>null,dataset:{}
 });
 actor.document={querySelectorAll:()=>[video(),video()],
  querySelector:()=>null};
 actor.contentWindow={innerWidth:1400,innerHeight:900,
  location:{hostname:'www.bilibili.com',pathname:'/video/BVabc'},
  wrappedJSObject:{player:{getQulity:()=>({realQ:80,nowQ:80})}}};
 const snapshot=actor.receiveMessage({name:'ZcthUniversal:Probe'});
 assert.equal(snapshot.count,2);
 assert.equal(snapshot.state,'unknown');
});
test('Site fallback never bypasses two unknown videos in one frame',()=>{
 const x=setup();
 x.manager.onFrameState(x.b[0],'f',{state:'unknown',count:2,mediaKey:'two'});
 x.advance(1500);
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'));
});

test('Zia 2.118 Blur over video keeps SDR classification active without root zia-video',()=>{
 const x=setup(1,{rootZiaVideo:false,ziaBlurOverVideo:true});
 x.manager.onFrameState(x.b[0],'f',{state:'sdr',count:1,mediaKey:'sdr-video'});
 assert.equal(x.props.get('data-zcth-stream-state'),'sdr');
 assert.ok(x.attrs.has('data-zcth-sdr-glass'),'SDR option enables custom glass');
 x.booleanPrefs['mod.compacttpr.sdrrealblur']=false;
 x.advance(50);
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'),'SDR option off returns to Zia native blur');
 x.booleanPrefs['mod.compacttpr.sdrrealblur']=true;
 x.advance(50);
 assert.ok(x.attrs.has('data-zcth-sdr-glass'),'re-enabling applies custom SDR glass again');
});

test('Upstream Blur over video OFF with absent root flag must not force custom SDR',()=>{
 const x=setup(1,{rootZiaVideo:false,ziaBlurOverVideo:false});
 x.manager.onFrameState(x.b[0],'f',{state:'sdr',count:1});
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'));
});

test('Root zia-video disabled by Zia preference must never enable custom HDR glass',()=>{
 const x=setup(1,{rootZiaVideo:false,ziaBlurOverVideo:true});
 x.manager.onFrameState(x.b[0],'f',{state:'hdr',count:1});
 assert.equal(x.props.get('data-zcth-stream-state'),'hdr');
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'));
});

test('Visible-video state clears only when the video really disappears',()=>{
 const x=setup(1,{rootZiaVideo:true,ziaBlurOverVideo:true});
 x.manager.onFrameState(x.b[0],'f',{state:'sdr',count:1});
 x.attrs.delete('zia-video');
 x.listeners.observer.f([{attributeName:'zia-video'}]);
 assert.ok(x.attrs.has('data-zcth-sdr-glass'),
   'Zia turning off root gate during Blur over video must preserve SDR custom style');
 x.setVideoVisible(false);
 x.advance(50);
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'),
   'closing/scrolling away video clears custom style');
});

test('022 HDR opt-in is disabled by default and never changes the SDR path',()=>{
 const x=setup(1,{rootZiaVideo:false,ziaBlurOverVideo:true});
 x.manager.onFrameState(x.b[0],'f',{state:'hdr',count:1,mediaKey:'hdr'});
 assert.equal(x.props.get('data-zcth-stream-state'),'hdr');
 assert.ok(!x.attrs.has('data-zcth-hdr-glass'),'HDR visual override defaults OFF');
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'),'HDR must not inherit SDR appearance');
});

test('022 HDR opt-in activates on actual HDR while Zia blur-over-video is enabled',()=>{
 const x=setup(1,{rootZiaVideo:false,ziaBlurOverVideo:true,sdrEnabled:false,hdrEnabled:true});
 x.manager.onFrameState(x.b[0],'f',{state:'hdr',count:1,mediaKey:'hdr'});
 assert.equal(x.props.get('data-zcth-stream-state'),'hdr');
 assert.ok(x.attrs.has('data-zcth-hdr-glass'),'HDR custom visual path enabled');
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'));
 x.booleanPrefs['mod.compacttpr.hdrrealblur']=false;
 x.advance(50);
 assert.ok(!x.attrs.has('data-zcth-hdr-glass'),'switch OFF is instant native-Zia rollback');
 x.booleanPrefs['mod.compacttpr.hdrrealblur']=true;
 x.advance(50);
 assert.ok(x.attrs.has('data-zcth-hdr-glass'),'switch ON reapplies HDR custom appearance');
});

test('022 upstream Zia Blur over video OFF blocks HDR override even when explicitly enabled',()=>{
 const x=setup(1,{rootZiaVideo:true,ziaBlurOverVideo:false,sdrEnabled:false,hdrEnabled:true});
 x.manager.onFrameState(x.b[0],'f',{state:'hdr',count:1});
 assert.ok(!x.attrs.has('data-zcth-hdr-glass'),'must not bypass Zia no-blur HDR protection');
});

test('022 root zia-video still present temporarily must not cause a competing compositor override',()=>{
 const x=setup(1,{rootZiaVideo:true,ziaBlurOverVideo:true,sdrEnabled:false,hdrEnabled:true});
 x.manager.onFrameState(x.b[0],'f',{state:'hdr',count:1});
 assert.ok(!x.attrs.has('data-zcth-hdr-glass'),'wait until Zia explicitly permits blur');
 x.attrs.delete('zia-video');
 x.listeners.observer.f([{attributeName:'zia-video'}]);
 assert.ok(x.attrs.has('data-zcth-hdr-glass'),'becomes active once Zia removes root flag');
});

test('022 HDR/SDR/unknown transitions are mutually exclusive',()=>{
 const x=setup(2,{rootZiaVideo:false,ziaBlurOverVideo:true,sdrEnabled:true,hdrEnabled:true});
 x.manager.onFrameState(x.b[0],'a',{state:'sdr',count:1});
 x.manager.onFrameState(x.b[1],'b',{state:'hdr',count:1});
 assert.ok(x.attrs.has('data-zcth-hdr-glass'),'any confirmed visible HDR wins');
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'));
 x.manager.onFrameState(x.b[1],'b',{state:'unknown',count:1});
 assert.ok(!x.attrs.has('data-zcth-hdr-glass'),'HDR promotion retracts on unknown');
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'),'uncertain split pane stays native');
 x.manager.onFrameState(x.b[1],'b',{state:'sdr',count:1});
 assert.ok(x.attrs.has('data-zcth-sdr-glass'),'SDR logic preserved');
 assert.ok(!x.attrs.has('data-zcth-hdr-glass'));
});

test('022 HDR custom marker clears when the last visible video disappears',()=>{
 const x=setup(1,{rootZiaVideo:false,ziaBlurOverVideo:true,sdrEnabled:false,hdrEnabled:true});
 x.manager.onFrameState(x.b[0],'f',{state:'hdr',count:1});
 assert.ok(x.attrs.has('data-zcth-hdr-glass'));
 x.setVideoVisible(false);
 x.advance(50);
 assert.ok(!x.attrs.has('data-zcth-hdr-glass'));
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'));
});

test('024 Bilibili fast-path bypasses SDR/HDR classifier and removes prior marker',()=>{
 const x=setup(1,{rootZiaVideo:false,ziaBlurOverVideo:true,sdrEnabled:true,hdrEnabled:true});
 x.manager.onFrameState(x.b[0],'a',{state:'hdr',count:1,mediaKey:'old-bili'});
 assert.ok(x.attrs.has('data-zcth-hdr-glass'),'normal 022 classification works before fast path');
 x.attrs.add('data-zcth-bilibili-glass');
 x.advance(50);
 assert.ok(!x.attrs.has('data-zcth-hdr-glass'),'explicit Bilibili override clears HDR categorization');
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'),'Bilibili override does not mislabel source SDR');
 assert.ok(!x.attrs.has('data-zcth-stream-state'));
 x.manager.onFrameState(x.b[0],'a',{state:'sdr',count:1,mediaKey:'bili'});
 assert.ok(!x.attrs.has('data-zcth-sdr-glass'),'content actor does not set SDR marker during bypass');
 x.attrs.delete('data-zcth-bilibili-glass');
 x.advance(50);
 assert.ok(x.attrs.has('data-zcth-hdr-glass'),'disabling Bilibili override restores existing classification');
});
