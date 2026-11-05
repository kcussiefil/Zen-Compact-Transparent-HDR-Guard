// Zen Compact Transparent HDR Guard v0.1.3 — opt-in true blur for confirmed SDR.
// Requires Zia's currently visible-video attribute. Unknown => leave Zia solid.
(() => {
  'use strict';
  const KEY = '__zcthSdrGlassV013';
  if (window[KEY]) return;
  const ACTOR = 'ZcthStream';
  const BASE = 'chrome://sine/content/zen-compact-transparent-hdr-guard/actors/';
  const root = document.documentElement;
  let generation = 0, inFlight = false, stopped = false;
  let interval = null;
  try {
    ChromeUtils.registerWindowActor(ACTOR, {
      parent: { esModuleURI: BASE + 'ZcthStreamParent.sys.mjs?v=013' },
      child: { esModuleURI: BASE + 'ZcthStreamChild.sys.mjs?v=013' },
      matches: ['https://youtube.com/*', 'https://*.youtube.com/*'],
      allFrames: false, messageManagerGroups: ['browsers'],
      safeForUntrustedWebProcess: true,
    });
  } catch (err) {
    if (err?.name !== 'NotSupportedError') console.warn('[HDR Guard] Actor registration:', err);
  }
  function reset() {
    generation++;
    root.removeAttribute('data-zcth-sdr-glass');
  }
  async function check() {
    if (stopped || inFlight) return;
    // Keep the default-off feature entirely idle. Sine settings can toggle it live.
    if (!Services.prefs.getBoolPref('mod.compacttpr.sdrrealblur', false)) {
      if (root.hasAttribute('data-zcth-sdr-glass')) reset();
      return;
    }
    const browser = window.gBrowser?.selectedBrowser;
    const uri = browser?.currentURI?.spec || '';
    let url;
    try { url = new URL(uri); } catch (_) { reset(); return; }
    if (url.protocol !== 'https:' || !/(^|\.)youtube\.com$/i.test(url.hostname) ||
        url.pathname !== '/watch' || !url.searchParams.get('v') ||
        !root.hasAttribute('zia-video')) { reset(); return; }
    const token = generation;
    let actor;
    try { actor = browser.browsingContext?.currentWindowGlobal?.getActor(ACTOR); } catch (_) {}
    if (!actor) { reset(); return; }
    inFlight = true;
    try {
      const result = await actor.sendQuery('ZcthStream:Classify');
      // Do not allow a stale async reply to enable blur after navigation, format
      // changes, or Zia hiding the video. Every check fails closed.
      if (!stopped && token === generation && browser === window.gBrowser?.selectedBrowser &&
          uri === browser.currentURI?.spec && root.hasAttribute('zia-video')) {
        root.toggleAttribute('data-zcth-sdr-glass', result === 'sdr');
      }
    } catch (_) { reset(); }
    finally { inFlight = false; }
  }
  function navigation() { reset(); check(); }
  const tabs = window.gBrowser?.tabContainer;
  tabs?.addEventListener('TabSelect', navigation);
  const progress = { onLocationChange(browser) {
    if (browser === window.gBrowser?.selectedBrowser) navigation();
  }};
  try { window.gBrowser?.addTabsProgressListener(progress); } catch (_) {}
  interval = window.setInterval(check, 1350);
  window.setTimeout(check, 200);
  function cleanup() {
    if (stopped) return;
    stopped = true; reset();
    window.clearInterval(interval);
    tabs?.removeEventListener('TabSelect', navigation);
    try { window.gBrowser?.removeTabsProgressListener(progress); } catch (_) {}
    delete window[KEY];
  }
  window[KEY] = { cleanup };
  window.addEventListener('unload', cleanup, { once:true });
})();
