// HDR Guard v0.3.0 — event-driven, video-safe Glance compositor recovery.
// Glance and Zia independently change Gecko's browser/layer composition.
// This script only requests a ONE-frame reset on the selected normal page
// after Glance closes. It never permanently forces compositing or changes
// any video/SDR/HDR classification or sidebars.
(() => {
  'use strict';
  const KEY = '__zcthGlanceRecoveryV030';
  if (window[KEY]) return;
  const PREF = 'mod.compacttpr.glanceglass';
  const root = document.documentElement;
  let panels = null, tabContainer = null, observer = null;
  let seenOpen = false, started = false, alive = true;
  let startTimer = null, prepareFrame = null, releaseFrame = null;

  function enabled() {
    try { return Services.prefs.getBoolPref(PREF, false); }
    catch (_) { return false; }
  }
  function hasGlance() {
    return !!panels?.querySelector(
      ':scope > .browserSidebarContainer.zen-glance-overlay.deck-selected'
    );
  }
  function videoProtected() {
    if (root.hasAttribute('zia-video') ||
        root.hasAttribute('data-zcth-video-page') ||
        root.hasAttribute('inDOMFullscreen')) return true;
    return !!panels?.querySelector(
      ':scope > .browserSidebarContainer.deck-selected browser[zia-video]'
    );
  }
  function dropMarker() {
    root.removeAttribute('data-zcth-glance-recover');
    if (prepareFrame !== null) window.cancelAnimationFrame(prepareFrame);
    if (releaseFrame !== null) window.cancelAnimationFrame(releaseFrame);
    prepareFrame = releaseFrame = null;
  }
  function recover() {
    dropMarker();
    if (!alive || !enabled() || hasGlance() || videoProtected()) return;
    // After Glance removes its deck-selected / overlay classes, let Gecko
    // finish applying that style change before one normal-page layer release.
    prepareFrame = window.requestAnimationFrame(() => {
      prepareFrame = null;
      if (!alive || !enabled() || hasGlance() || videoProtected()) return;
      root.setAttribute('data-zcth-glance-recover', 'true');
      releaseFrame = window.requestAnimationFrame(() => {
        releaseFrame = null;
        root.removeAttribute('data-zcth-glance-recover');
      });
    });
  }
  function sync() {
    if (!alive) return;
    if (!enabled()) { seenOpen = false; dropMarker(); return; }
    if (hasGlance()) { seenOpen = true; dropMarker(); return; }
    if (seenOpen) { seenOpen = false; recover(); }
  }
  function onGlanceClose() {
    if (!enabled()) return;
    seenOpen = false;
    recover();
  }
  const prefObserver = {observe() { sync(); }};
  function start() {
    if (!alive || started) return;
    panels = document.getElementById('tabbrowser-tabpanels');
    tabContainer = window.gBrowser?.tabContainer;
    if (!panels || !tabContainer) {
      startTimer = window.setTimeout(start, 250);
      return;
    }
    started = true;
    // Only react to changes of top-level browser container classes; ignore
    // native web content and unrelated hover-card DOM mutations.
    observer = new MutationObserver(changes => {
      if (changes.some(m => m.type === 'childList' ||
            (m.attributeName === 'class' &&
             m.target?.classList?.contains('browserSidebarContainer')))) sync();
    });
    observer.observe(panels, {
      subtree: true, childList: true, attributes: true,
      attributeFilter: ['class']
    });
    tabContainer.addEventListener('GlanceClose', onGlanceClose, true);
    try { Services.prefs.addObserver(PREF, prefObserver); } catch (_) {}
    sync();
  }
  function cleanup() {
    alive = false;
    if (startTimer !== null) window.clearTimeout(startTimer);
    dropMarker();
    observer?.disconnect();
    if (started) tabContainer?.removeEventListener('GlanceClose', onGlanceClose, true);
    try { Services.prefs.removeObserver(PREF, prefObserver); } catch (_) {}
    delete window[KEY];
  }
  window[KEY] = {cleanup};
  window.addEventListener('unload', cleanup, {once:true});
  start();
})();
