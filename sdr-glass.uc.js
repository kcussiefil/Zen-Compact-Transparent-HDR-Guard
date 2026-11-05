// Zen Compact Transparent HDR Guard v0.1.5.
// Opt-in SDR glass. Immediate classification for confirmed SDR; 50ms fallback checks.
(() => {
  'use strict';
  const KEY='__zcthSdrGlassV014', ACTOR='ZcthStreamV014';
  if (window[KEY]) return;
  const BASE='chrome://sine/content/zen-compact-transparent-hdr-guard/actors/';
  const root=document.documentElement;
  let generation=0, pending=null, inFlight=false, stopped=false, queued=false;
  try {
    const events={};
    for (const name of ['loadeddata','loadedmetadata','playing','emptied','resize','loadstart'])
      events[name]={capture:true,mozSystemGroup:true};
    ChromeUtils.registerWindowActor(ACTOR,{
      parent:{esModuleURI:BASE+'ZcthStreamV014Parent.sys.mjs'},
      child:{esModuleURI:BASE+'ZcthStreamV014Child.sys.mjs',events},
      matches:['https://youtube.com/*','https://*.youtube.com/*'],
      allFrames:false,messageManagerGroups:['browsers'],safeForUntrustedWebProcess:true,
    });
  } catch(e) {
    if (e?.name!=='NotSupportedError')
      console.warn('[HDR Guard] Cannot register SDR actor:',e);
  }
  function reset() {
    generation++;root.removeAttribute('data-zcth-sdr-glass');
  }
  function enabled() {return Services.prefs.getBoolPref('mod.compacttpr.sdrrealblur',false);}
  function schedule(delay=0) {
    if (stopped) return;
    if (pending!==null) window.clearTimeout(pending);
    pending=window.setTimeout(()=>{pending=null;void check();},delay);
  }
  async function check() {
    if (stopped) return;
    if (!enabled()) {if (root.hasAttribute('data-zcth-sdr-glass')) reset();return;}
    const browser=window.gBrowser?.selectedBrowser;
    const uri=browser?.currentURI?.spec || '';
    let url;
    try {url=new URL(uri);}catch(_) {reset();return;}
    if (url.protocol!=='https:' || !/(^|\.)youtube\.com$/i.test(url.hostname) ||
        url.pathname!=='/watch' || !url.searchParams.get('v') ||
        !root.hasAttribute('zia-video')) {
      if (root.hasAttribute('data-zcth-sdr-glass')) reset();
      return;
    }
    if (inFlight) { queued=true; return; }
    let actor;
    try {actor=browser.browsingContext?.currentWindowGlobal?.getActor(ACTOR);}catch(_){}
    if (!actor) {reset();return;}
    const token=generation;
    inFlight=true;
    try {
      const result=await actor.sendQuery('ZcthStreamV014:Classify');
      if (stopped || token!==generation || browser!==window.gBrowser?.selectedBrowser ||
          uri!==browser.currentURI?.spec || !root.hasAttribute('zia-video') || !enabled()) return;
      root.toggleAttribute('data-zcth-sdr-glass', result === 'sdr');
    } catch(_) {reset();}
    finally {inFlight=false; if (queued && !stopped) { queued=false; schedule(0); } }
  }
  function navigation() {reset();schedule(0);}
  function mediaChanged(browser) {
    if (browser!==window.gBrowser?.selectedBrowser) return;
    reset();schedule(0);
  }
  const tabs=window.gBrowser?.tabContainer;
  tabs?.addEventListener('TabSelect',navigation);
  const progress={onLocationChange(browser) {
    if(browser===window.gBrowser?.selectedBrowser)navigation();
  }};
  try {window.gBrowser?.addTabsProgressListener(progress);}catch(_){}
  const observer=new MutationObserver(mutations=>{
    if (mutations.some(m=>m.attributeName==='zia-video')) {reset();schedule(0);}
  });
  observer.observe(root,{attributes:true,attributeFilter:['zia-video']});
  const interval=window.setInterval(()=>{void check();},50);
  schedule(0);
  const cleanup=()=>{
    if (stopped) return;
    stopped=true;reset();
    observer.disconnect();window.clearInterval(interval);
    if(pending!==null)window.clearTimeout(pending);
    tabs?.removeEventListener('TabSelect',navigation);
    try{window.gBrowser?.removeTabsProgressListener(progress);}catch(_){}
    delete window[KEY];
  };
  window[KEY]={cleanup,onVideoChange:mediaChanged};
  window.addEventListener('unload',cleanup,{once:true});
})();