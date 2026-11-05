// Zen Compact Transparent HDR Guard v0.1.1
// Small browser-chrome URL classifier. Zia continues to own visible-video
// detection; this merely keeps its native opaque theme colour while a video
// watch page remains selected, even when the player scrolls out of view.
(() => {
  'use strict';
  const KEY = '__zcthVideoPageGuardV011';
  if (window[KEY]) return;
  const root = document.documentElement;
  let timer = null;
  let pending = null;
  let progressListener = null;
  let started = false;

  function isVideoPage(spec) {
    try {
      const url = new URL(spec);
      if (!['http:', 'https:'].includes(url.protocol)) return false;
      const host = url.hostname.toLowerCase();
      const path = url.pathname;
      if (host === 'youtu.be') return path.length > 1;
      if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
        return path === '/watch' || /^\/(?:live|shorts|embed)\/[^/]+/.test(path);
      }
      if (host === 'bilibili.com' || host.endsWith('.bilibili.com')) {
        return /^\/(?:video|bangumi\/play)\/[^/]+/.test(path);
      }
      return false;
    } catch (_) { return false; }
  }
  function refresh() {
    pending = null;
    const browser = window.gBrowser?.selectedBrowser;
    let url = '';
    try { url = browser?.currentURI?.spec || ''; } catch (_) {}
    root.toggleAttribute('data-zcth-video-page', isVideoPage(url));
  }
  function schedule() {
    if (pending !== null) return;
    pending = window.setTimeout(refresh, 0);
  }
  function start() {
    if (started) return;
    if (!window.gBrowser?.tabContainer) {
      timer = window.setTimeout(start, 400);
      return;
    }
    started = true;
    progressListener = {
      onLocationChange(browser) {
        if (browser === window.gBrowser?.selectedBrowser) schedule();
      }
    };
    window.gBrowser.tabContainer.addEventListener('TabSelect', schedule);
    try { window.gBrowser.addTabsProgressListener(progressListener); } catch (_) {}
    schedule();
  }
  function cleanup() {
    if (timer !== null) window.clearTimeout(timer);
    if (pending !== null) window.clearTimeout(pending);
    if (started) {
      try { window.gBrowser?.tabContainer?.removeEventListener('TabSelect', schedule); } catch (_) {}
      try { window.gBrowser?.removeTabsProgressListener(progressListener); } catch (_) {}
    }
    root.removeAttribute('data-zcth-video-page');
    delete window[KEY];
  }
  window[KEY] = {cleanup};
  window.addEventListener('unload', cleanup, {once:true});
  start();
})();
