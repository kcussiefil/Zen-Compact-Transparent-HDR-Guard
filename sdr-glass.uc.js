// HDR Guard v0.2.1 — Zia 2.118 Blur over video-aware SDR switch.
(() => {
'use strict';
const KEY='__zcthUniversalV019',ACTOR='ZcthUniversal';
if(window[KEY])return;
const root=document.documentElement;
const BASE='chrome://sine/content/zen-compact-transparent-hdr-guard/actors/';
const DEFAULT='www.bilibili.com/video/*;www.bilibili.com/bangumi/play/*';
const records=new Map(),unknownSince=new Map();
let pending=null,busy=false,rerun=false,alive=true,revision=0,registered=false;
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
const enabled=()=>Services.prefs.getBoolPref('mod.compacttpr.sdrrealblur',false);
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
 if(!enabled())return false;
 if(root.hasAttribute('zia-video'))return true;
 // The option controls Zia's root flag, not browser[zia-video].
 // With it enabled we still need SDR/HDR classification to operate the
 // user's optional custom SDR surface (without forcing HDR composition).
 let overVideo=false;
 try{overVideo=Services.prefs.getBoolPref('zia.glass.blur-over-video',false)}catch(_){}
 return overVideo&&videoBrowsers().length>0;
}
function clear(){
 root.removeAttribute('data-zcth-sdr-glass');
 root.removeAttribute('data-zcth-stream-state');
 root.removeAttribute('data-zcth-classification-source');
}
function stateFor(browser,allowManual){
 const map=records.get(browser);
 const visible=map?[...map.values()].filter(s=>s.count>0):[];
 if(visible.some(s=>s.state==='hdr'))return {state:'hdr',source:'auto'};
 // A single frame with several videos cannot be reduced to the quality of
 // one selected player. Manual site rules cannot bypass other videos.
 if(visible.some(s=>s.count>1))return {state:'unknown',source:'multiple-videos'};
 if(visible.length&&visible.every(s=>s.state==='sdr'))
   return {state:'sdr',source:'auto'};
 const rule=allowManual?manualRule(browser):'';
 if(!rule)return {state:'unknown',source:'unknown'};
 if(rule==='manual-video')return {state:'sdr',source:rule};
 // Give the player a chance to report its selected HDR stream before
 // assuming SDR on a manually listed site. Never override confirmed HDR.
 const key=identity(browser.currentURI?.spec||'')+'|'+visible.map(s=>s.mediaKey).join('|');
 let stamp=unknownSince.get(browser);
 if(!stamp||stamp.key!==key){
  stamp={key,at:Date.now()};unknownSince.set(browser,stamp);
 }
 return Date.now()-stamp.at>=350
   ? {state:'sdr',source:rule} : {state:'unknown',source:'probing'};
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
 root.setAttribute('data-zcth-stream-state',value);
 root.setAttribute('data-zcth-classification-source',value==='sdr'?states[0].source:'protected');
 root.toggleAttribute('data-zcth-sdr-glass',value==='sdr');
}
function onFrameState(browser,actor,data){
 if(!alive||!browser)return;
 let map=records.get(browser);
 if(!map){map=new Map();records.set(browser,map)}
 const state=['sdr','hdr','unknown','none'].includes(data?.state)?data.state:'unknown';
 if(state==='none'||Number(data?.count)<=0)map.delete(actor);
 else map.set(actor,{state,count:Number(data.count)||1,mediaKey:String(data?.mediaKey||'')});
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
function onNavigate(){
 revision++;records.clear();unknownSince.clear();clear();schedule(0);
}
const tabs=window.gBrowser?.tabContainer;
tabs?.addEventListener('TabSelect',onNavigate);
const progress={onLocationChange(browser){
 if(browser===window.gBrowser?.selectedBrowser)onNavigate();
}};
try{window.gBrowser?.addTabsProgressListener(progress)}catch(_){}
const observer=new MutationObserver(changes=>{
 if(changes.some(c=>c.attributeName==='zia-video')){
  if(!shouldClassify()){
   revision++;records.clear();unknownSince.clear();
  }
  render();schedule(0);
 }
});
observer.observe(root,{attributes:true,attributeFilter:['zia-video']});
const interval=window.setInterval(()=>{render();void probe()},50);
schedule(0);
function cleanup(){
 if(!alive)return;
 alive=false;clear();observer.disconnect();window.clearInterval(interval);
 if(pending!==null)window.clearTimeout(pending);
 tabs?.removeEventListener('TabSelect',onNavigate);
 try{window.gBrowser?.removeTabsProgressListener(progress)}catch(_){}
 records.clear();unknownSince.clear();delete window[KEY];
}
window[KEY]={onFrameState,forgetFrame,cleanup};
window.addEventListener('unload',cleanup,{once:true});
})();
