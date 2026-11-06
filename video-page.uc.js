// HDR Guard v0.2.4 — synchronous selected-URL markers, including Bilibili fast path.
// No content/SDR/HDR probing is needed before applying Bilibili custom glass.
// Retain Zia's own visibility-gated video compositor: never set will-change.
(() => {
  'use strict';
  const KEY = '__zcthVideoPageGuardV011';
  if (window[KEY]) return;
  const root = document.documentElement;
  const BILI_PREF = 'mod.compacttpr.bilibiliinstantglass';
  const ZIA_BLUR_PREF = 'zia.glass.blur-over-video';
  const watchedPrefs = [];
  let timer = null, progressListener = null, started = false;

  function isVideoPage(spec) {
    try {
      const url = new URL(spec);
      if (!['http:', 'https:'].includes(url.protocol)) return false;
      const host = url.hostname.toLowerCase(), path = url.pathname;
      if (host === 'youtu.be') return path.length > 1;
      if (host === 'youtube.com' || host.endsWith('.youtube.com'))
        return path === '/watch' || /^\/(?:live|shorts|embed)\/[^/]+/.test(path);
      if (host === 'bilibili.com' || host.endsWith('.bilibili.com'))
        return /^\/(?:video|bangumi\/play)\/[^/]+/.test(path);
      return false;
    } catch (_) { return false; }
  }

  // Explicit user opt-in covers www.bilibili.com/* (all paths, query and hash).
  // Do not broaden the rule to other subdomains or other websites.
  function isBilibili(spec) {
    try {
      const url = new URL(spec);
      return (url.protocol === 'https:' || url.protocol === 'http:') &&
        url.hostname.toLowerCase() === 'www.bilibili.com';
    } catch (_) { return false; }
  }
  function prefEnabled(name, fallback) {
    try { return Services.prefs.getBoolPref(name, fallback); }
    catch (_) { return fallback; }
  }
  function refresh(specOverride) {
    const browser = window.gBrowser?.selectedBrowser;
    let spec = typeof specOverride === 'string' ? specOverride : '';
    if (!spec) {
      try { spec = browser?.currentURI?.spec || ''; } catch (_) {}
    }
    root.toggleAttribute('data-zcth-video-page', isVideoPage(spec));
    // Write synchronously on TabSelect and onLocationChange: no timer,
    // no 350ms unknown-stream fallback, and no content actor roundtrip.
    root.toggleAttribute('data-zcth-bilibili-glass',
      isBilibili(spec) &&
      prefEnabled(BILI_PREF, true) &&
      prefEnabled(ZIA_BLUR_PREF, false));
  }
  function onTabSelect() { refresh(); }
  const prefObserver = { observe() { refresh(); } };
  function start() {
    if (started) return;
    if (!window.gBrowser?.tabContainer) {
      timer = window.setTimeout(start, 400);
      return;
    }
    started = true;
    progressListener = {
      onLocationChange(browser, _webProgress, _request, location) {
        if (browser === window.gBrowser?.selectedBrowser)
          refresh(location?.spec);
      }
    };
    window.gBrowser.tabContainer.addEventListener('TabSelect', onTabSelect);
    try { window.gBrowser.addTabsProgressListener(progressListener); } catch (_) {}
    for (const name of [BILI_PREF, ZIA_BLUR_PREF]) {
      try { Services.prefs.addObserver(name, prefObserver); watchedPrefs.push(name); }
      catch (_) {}
    }
    refresh();
  }
  function cleanup() {
    if (timer !== null) window.clearTimeout(timer);
    if (started) {
      try { window.gBrowser?.tabContainer?.removeEventListener('TabSelect', onTabSelect); } catch (_) {}
      try { window.gBrowser?.removeTabsProgressListener(progressListener); } catch (_) {}
    }
    for (const name of watchedPrefs) {
      try { Services.prefs.removeObserver(name, prefObserver); } catch (_) {}
    }
    root.removeAttribute('data-zcth-video-page');
    root.removeAttribute('data-zcth-bilibili-glass');
    delete window[KEY];
  }
  window[KEY] = { cleanup, refresh };
  window.addEventListener('unload', cleanup, { once: true });
  start();
})();
