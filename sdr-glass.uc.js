// HG v0.3.1 — immediate event-driven rendering; 1s watchdog only, exact original glass.
(() => {
'use strict';
const KEY='__zcthUniversalV019',ACTOR='ZcthUniversal';
if(window[KEY])return;
const root=document.documentElement;
const BASE='chrome://sine/content/zen-compact-transparent-hdr-guard/actors/';
const DEFAULT='www.bilibili.com/*';
const records=new Map(),unknownSince=new Map(),browserURIs=new WeakMap();
let pending=null,busy=false,rerun=false,alive=true,revision=0,registered=false;
const WATCHDOG_MS=1000,FALLBACK_MS=100;
let fallbackTimer=null,fallbackBrowser=null,fallbackKey='';
try{
 const media={capture:true,mozSystemGroup:true},events={};
 for(const name of ['loadeddata','loadedmetadata','playing','pause','canplay',
   'resize','loadstart','emptied','abort'])events[name]=media;
 events.DOMContentLoaded={};events.pageshow={};events.pagehide={};
 ChromeUtils.registerWindowActor(ACTOR,{
   parent:{esModuleURI:BASE+'ZcthUniversalParent.sys.mjs'},
   child:{esModuleURI:BASE+'ZcthUniversalChild.sys.mjs',events},
   matches:['https://*/*','http://*/*'],allFrames:true,
   messageManagerGroups:['browsers'],safeForUntrustedWebProcess:true
 });
 registered=true;
}catch(e){
 if(e?.name==='NotSupportedError')registered=true;
 else console.warn('[HDR Guard] Universal actor not registered',e);
}
const pref=(name,def='')=>{try{return Services.prefs.getStringPref(name,def)}catch(_){return def}};
const sdrEnabled=()=>Services.prefs.getBoolPref('mod.compacttpr.sdrrealblur',false);
const hdrEnabled=()=>Services.prefs.getBoolPref('mod.compacttpr.hdrrealblur',false);
const ziaBlurOverVideo=()=>Services.prefs.getBoolPref('zia.glass.blur-over-video',false);
const enabled=()=>sdrEnabled()||(hdrEnabled()&&ziaBlurOverVideo());
function siteMatches(uri,rules){
 let u;try{u=new URL(uri)}catch(_){return false}
 if(u.protocol!=='https:'&&u.protocol!=='http:')return false;
 for(const original of String(rules||'').split(/[;,\n]+/).slice(0,40)){
  const rule=original.trim().replace(/^https?:\/\//i,'');
  if(!rule||rule.length>360)continue;
  const cut=rule.indexOf('/');
  const host=(cut<0?rule:rule.slice(0,cut)).toLowerCase();
  const path=cut<0?'/*':rule.slice(cut);
  if(!host||host==='*'||host.includes(':')||host.includes('?'))continue;
  const domain=host.startsWith('*.')?host.slice(2):host;
  const target=u.hostname.toLowerCase();
  if(host.startsWith('*.') ? target!==domain&&!target.endsWith('.'+domain) : target!==domain)continue;
  const escaped=path.split('*').map(part=>part.replace(/[|\\{}()[\]^$+?.]/g,'\\$&')).join('.*');
  try{if(new RegExp('^'+escaped+'$','i').test(u.pathname))return true}catch(_){}
 }
 return false;
}
function identity(raw){
 try{
  const u=new URL(raw),host=u.hostname.toLowerCase();
  if(/(^|\.)youtube\.com$/.test(host)&&u.pathname==='/watch')
    return u.origin+'/watch?v='+u.searchParams.get('v');
  if(/(^|\.)bilibili\.com$/.test(host))
    return u.origin+u.pathname+'?p='+(u.searchParams.get('p')||'1');
  return u.origin+u.pathname+u.search;
 }catch(_){return ''}
}
function manualRule(browser){
 const uri=browser?.currentURI?.spec||'';
 const current=pref('mod.compacttpr.manualvideourl').trim();
 if(current&&identity(uri)&&identity(uri)===identity(current))return 'manual-video';
 return siteMatches(uri,pref('mod.compacttpr.sdrsitepatterns',DEFAULT))?'site-rule':'';
}
function uriOf(browser){try{return browser?.currentURI?.spec||''}catch(_){return ''}}
function invalidateBrowser(browser){
 if(!browser)return;
 records.delete(browser);unknownSince.delete(browser);browserURIs.delete(browser);
}
function ensureBrowserURI(browser){
 if(!browser)return;
 const uri=uriOf(browser);
 if(browserURIs.has(browser)&&browserURIs.get(browser)!==uri)invalidateBrowser(browser);
 browserURIs.set(browser,uri);
}
function videoBrowsers(){
 let nodes=[];
 try{
  nodes=[...document.querySelectorAll(
    '#tabbrowser-tabpanels > .browserSidebarContainer:is(.deck-selected, [zen-split="true"]) browser[zia-video]'
  )];
 }catch(_){}
 if(nodes.length)return [...new Set(nodes)];
 // Zia 2.118 with Blur over video deliberately CLEARS root [zia-video].
 // Do not classify ordinary tabs without an actual visible video browser.
 if(!root.hasAttribute('zia-video'))return [];
 const current=window.gBrowser?.selectedBrowser;
 return current?[current]:[];
}
function shouldClassify(){
 // Bilibili fast path is a deliberate user exception, not SDR evidence.
 // Keep its appearance independent of probes, 350ms fallback and HDR markers.
 if(root.hasAttribute('data-zcth-bilibili-glass'))return false;
 if(!enabled())return false;
 if(root.hasAttribute('zia-video'))return true;
 // The option controls Zia's root flag, not browser[zia-video].
 // With it enabled we still need SDR/HDR classification to operate the
 // user's optional custom SDR surface (without forcing HDR composition).
 return ziaBlurOverVideo()&&videoBrowsers().length>0;
}
function setFlag(name,enabled){
 if(root.hasAttribute(name)!==enabled)root.toggleAttribute(name,enabled);
}
function cancelFallback(){
 if(fallbackTimer!==null)window.clearTimeout(fallbackTimer);
 fallbackTimer=null;fallbackBrowser=null;fallbackKey='';
}
function requestFallback(browser,key,remaining){
 if(fallbackTimer!==null&&fallbackBrowser===browser&&fallbackKey===key)return;
 cancelFallback();
 fallbackBrowser=browser;fallbackKey=key;
 fallbackTimer=window.setTimeout(()=>{
  fallbackTimer=null;fallbackBrowser=null;fallbackKey='';
  // A single exact-time paint replaces repeated 50ms checks during fallback.
  render();
 },Math.max(1,Math.ceil(remaining)));
}
function clear(){
 for(const name of ['data-zcth-sdr-glass','data-zcth-hdr-glass',
   'data-zcth-stream-state','data-zcth-classification-source']){
  if(root.hasAttribute(name))root.removeAttribute(name);
 }
 cancelFallback();
}
function stateFor(browser,allowManual){
 ensureBrowserURI(browser);
 const map=records.get(browser);
 const visible=map?[...map.values()].filter(s=>s.count>0):[];
 if(visible.some(s=>s.state==='hdr')){
  if(fallbackBrowser===browser)cancelFallback();
  return {state:'hdr',source:'auto'};
 }
 // A single frame with several videos cannot be reduced to the quality of
 // one selected player. Manual site rules cannot bypass other videos.
 if(visible.some(s=>s.count>1))return {state:'unknown',source:'multiple-videos'};
 if(visible.length&&visible.every(s=>s.state==='sdr')){
   if(fallbackBrowser===browser)cancelFallback();
   return {state:'sdr',source:'auto'};
 }
 const rule=allowManual?manualRule(browser):'';
 if(!rule){if(fallbackBrowser===browser)cancelFallback();return {state:'unknown',source:'unknown'};}
 if(rule==='manual-video'){if(fallbackBrowser===browser)cancelFallback();return {state:'sdr',source:rule};}
 // Give the player a chance to report its selected HDR stream before
 // assuming SDR on a manually listed site. Never override confirmed HDR.
 const key=identity(browser.currentURI?.spec||'')+'|'+visible.map(s=>s.mediaKey).join('|');
 let stamp=unknownSince.get(browser);
 if(!stamp||stamp.key!==key){
  stamp={key,at:Date.now()};unknownSince.set(browser,stamp);
 }
 const elapsed=Date.now()-stamp.at;
 if(elapsed>=FALLBACK_MS){
  if(fallbackBrowser===browser)cancelFallback();
  return {state:'sdr',source:rule};
 }
 requestFallback(browser,key,FALLBACK_MS-elapsed);
 return {state:'unknown',source:'probing'};
}
function render(){
 if(!alive||!shouldClassify()){
  clear();unknownSince.clear();return;
 }
 const panes=videoBrowsers();
 const states=panes.map(b=>stateFor(b,panes.length===1));
 let value='unknown';
 if(states.some(x=>x.state==='hdr'))value='hdr';
 else if(states.length&&states.every(x=>x.state==='sdr'))value='sdr';
 if(root.getAttribute?.('data-zcth-stream-state')!==value)
  root.setAttribute('data-zcth-stream-state',value);
 const source=value==='sdr'?states[0].source:'protected';
 if(root.getAttribute?.('data-zcth-classification-source')!==source)
  root.setAttribute('data-zcth-classification-source',source);
 setFlag('data-zcth-sdr-glass',value==='sdr'&&sdrEnabled());
 // Only opt in to HDR appearance when Zia itself allows blur over video.
 // Do NOT promote the video layer here: Zia owns that while an overlay is open.
 setFlag('data-zcth-hdr-glass',
   value==='hdr'&&hdrEnabled()&&ziaBlurOverVideo()&&!root.hasAttribute('zia-video'));
}
function onFrameState(browser,actor,data){
 if(!alive||!browser||root.hasAttribute('data-zcth-bilibili-glass'))return;
 ensureBrowserURI(browser);
 let map=records.get(browser);
 if(!map){map=new Map();records.set(browser,map)}
 const state=['sdr','hdr','unknown','none'].includes(data?.state)?data.state:'unknown';
 const count=Number(data?.count)||1,mediaKey=String(data?.mediaKey||'');
 const previous=map.get(actor);
 if(state==='none'||Number(data?.count)<=0){
  if(!previous)return;
  map.delete(actor);
 }else{
  if(previous?.state===state&&previous.count===count&&previous.mediaKey===mediaKey)return;
  map.set(actor,{state,count,mediaKey});
 }
 revision++;render();
}
function forgetFrame(browser,actor){
 records.get(browser)?.delete(actor);revision++;render();
}
function schedule(delay=0){
 if(!alive)return;
 if(pending!==null)window.clearTimeout(pending);
 pending=window.setTimeout(()=>{pending=null;void probe()},delay);
}
async function probe(){
 if(!alive)return;
 const browser=window.gBrowser?.selectedBrowser;
 if(!shouldClassify()){clear();return}
 if(!registered||!browser){render();return}
 if(busy){rerun=true;render();return}
 let actor;
 try{actor=browser.browsingContext?.currentWindowGlobal?.getActor(ACTOR)}catch(_){}
 if(!actor){render();return}
 const token=revision,href=browser.currentURI?.spec;
 busy=true;
 try{
  const snapshot=await actor.sendQuery('ZcthUniversal:Probe');
  if(alive&&token===revision&&window.gBrowser?.selectedBrowser===browser&&
     browser.currentURI?.spec===href)onFrameState(browser,'__top_probe__',snapshot);
 }catch(_){render()}
 finally{busy=false;if(rerun&&alive){rerun=false;schedule(0)}}
}
/* A tab switch is not a stream change. Keep each browser's last confirmed
 * actor snapshot and render it synchronously. New documents and URL changes
 * are invalidated per-browser, never globally, so returning to a loaded
 * video does not flash the unknown/solid state during another actor probe. */
function onNavigate(){
 revision++;
 cancelFallback();
 ensureBrowserURI(window.gBrowser?.selectedBrowser);
 render();schedule(0);
}
function onTabClose(event){
 const browser=event?.target?.linkedBrowser;
 invalidateBrowser(browser);
}
const tabs=window.gBrowser?.tabContainer;
tabs?.addEventListener('TabSelect',onNavigate);
tabs?.addEventListener('TabClose',onTabClose);
const progress={onLocationChange(browser){
 // Includes same-URL reloads and YouTube SPA navigation; do not reuse an
 // earlier stream format until the new document/stream has been validated.
 invalidateBrowser(browser);
 cancelFallback();
 browserURIs.set(browser,uriOf(browser));
 if(browser===window.gBrowser?.selectedBrowser){revision++;render();schedule(0)}
}};
try{window.gBrowser?.addTabsProgressListener(progress)}catch(_){}
const observer=new MutationObserver(changes=>{
 if(changes.some(c=>c.attributeName==='zia-video'||
                    c.attributeName==='data-zcth-bilibili-glass')){
  revision++;
  render();schedule(0);
 }
});
observer.observe(root,{attributes:true,
 attributeFilter:['zia-video','data-zcth-bilibili-glass']});
// Zia 2.118+ can deliberately remove root [zia-video] when native video
// blur is allowed. Watch browser[zia-video] directly so scrolling a player
// into/out of view updates HG immediately, not at the 1-second watchdog.
const panelObserver=new MutationObserver(changes=>{
 if(changes.some(c=>c.attributeName==='zia-video'&&
                       c.target?.localName==='browser')){
  revision++;render();schedule(0);
 }
});
const panels=document.getElementById?.('tabbrowser-tabpanels');
if(panels)panelObserver.observe(panels,{attributes:true,subtree:true,
 attributeFilter:['zia-video']});
const WATCHED_PREFS=[
 'mod.compacttpr.sdrrealblur','mod.compacttpr.hdrrealblur',
 'mod.compacttpr.sdrsitepatterns','mod.compacttpr.manualvideourl',
 'zia.glass.blur-over-video'
];
const prefObserver={observe(){revision++;render();schedule(0)}};
for(const name of WATCHED_PREFS){
 try{Services.prefs.addObserver(name,prefObserver)}catch(_){}
}
// The full actor probe remains immediate for navigation/video/pref changes.
// The watchdog is a fallback for missed events; it never gates paint.
const interval=window.setInterval(()=>{render();void probe()},WATCHDOG_MS);
schedule(0);
function cleanup(){
 if(!alive)return;
 alive=false;clear();observer.disconnect();panelObserver.disconnect();window.clearInterval(interval);
 for(const name of WATCHED_PREFS){
  try{Services.prefs.removeObserver(name,prefObserver)}catch(_){}
 }
 if(pending!==null)window.clearTimeout(pending);
 tabs?.removeEventListener('TabSelect',onNavigate);
 tabs?.removeEventListener('TabClose',onTabClose);
 try{window.gBrowser?.removeTabsProgressListener(progress)}catch(_){}
 records.clear();unknownSince.clear();delete window[KEY];
}
window[KEY]={onFrameState,forgetFrame,cleanup};
window.addEventListener('unload',cleanup,{once:true});
})();
