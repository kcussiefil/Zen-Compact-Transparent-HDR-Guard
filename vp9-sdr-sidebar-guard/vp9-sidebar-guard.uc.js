// Zen VP9 SDR Sidebar Guard v0.1.1
// Chrome-process observer. Open intent is recognized immediately; closing
// retains compensation until the sliding sidebar is physically hidden.
(() => {
  'use strict';
  const KEY = '__zvp9SidebarGuardV010';
  if (window[KEY]) return;

  const ACTOR = 'Zvp9SidebarGuard';
  const BASE = 'chrome://sine/content/zen-vp9-sdr-sidebar-guard/actors/';
  const PREF_ENABLED = 'mod.zvp9.enabled';
  const PREF_LEVEL = 'mod.zvp9.brightness';
  const ROOT = document.documentElement;
  const MARKERS = [
    'zen-has-hover', 'zen-user-show', 'zen-has-empty-tab',
    'flash-popup', 'has-popup-menu', 'movingtab', 'zen-compact-mode-active'
  ];
  let alive = true, lastKey = '', delayedTimers = [], poll = null;

  const enabledPref = () => {
    try { return Services.prefs.getBoolPref(PREF_ENABLED, true); }
    catch (_) { return true; }
  };
  const brightnessPref = () => {
    let raw = '1.10';
    try { raw = Services.prefs.getStringPref(PREF_LEVEL, raw); }
    catch (_) {}
    const v = Number(raw);
    return Number.isFinite(v) ? Math.max(1, Math.min(1.25, v)) : 1.10;
  };

  function sideIsVisible() {
    if (ROOT.getAttribute('zen-compact-mode') !== 'true' ||
        ROOT.hasAttribute('inDOMFullscreen')) return false;
    const sidebar = document.getElementById('navigator-toolbox');
    if (!sidebar) return false;
    // The previous (marker && width>40px) gate applied brightness too late on
    // opening and removed it too early on closing, producing a double flash.
    // On opening trust Zen's own intent immediately, before the slide begins.
    const opening = MARKERS.some(name => sidebar.hasAttribute(name));
    if (opening) return true;
    // On closing retain compensation while Zen's sliding toolbox is still on
    // screen. The collapsed compact strip is <40px and must not count.
    const rect = sidebar.getBoundingClientRect();
    const visibleWidth = Math.max(0,
      Math.min(window.innerWidth, rect.right) - Math.max(0, rect.left));
    return rect.width > 0 && visibleWidth > Math.max(40, Math.min(80, rect.width * 0.20));
  }

  function snapshot() {
    return { active: enabledPref() && sideIsVisible(), level: brightnessPref() };
  }

  function currentActor() {
    const browser = window.gBrowser?.selectedBrowser;
    if (!browser) return null;
    try {
      const url = new URL(browser.currentURI?.spec || '');
      if (url.protocol !== 'https:' ||
          !(/(^|\.)youtube\.com$/i).test(url.hostname) ||
          url.pathname !== '/watch') return null;
      return browser.browsingContext?.currentWindowGlobal?.getActor(ACTOR) || null;
    } catch (_) { return null; }
  }

  function refresh(force = false) {
    if (!alive) return;
    const state = snapshot();
    const actor = currentActor();
    const key = [state.active, state.level, actor ? 'video' : 'other'].join(':');
    if (!force && key === lastKey) return;
    lastKey = key;
    try { actor?.sendAsyncMessage('Zvp9:SidebarState', state); }
    catch (e) { console.warn('[VP9 Sidebar Guard] State delivery failed', e); }
  }

  function scheduleRefresh() {
    refresh();
    for (const ms of [32, 100, 220, 330]) {
      const timer = window.setTimeout(() => {
        delayedTimers = delayedTimers.filter(t => t !== timer);
        refresh();
      }, ms);
      delayedTimers.push(timer);
    }
  }

  // Set key BEFORE actor registration so an actor created synchronously can
  // answer GetState without exposing any state from a background tab.
  window[KEY] = { snapshot, cleanup };
  try {
    ChromeUtils.registerWindowActor(ACTOR, {
      parent: { esModuleURI: BASE + 'Zvp9SidebarGuardParent.sys.mjs' },
      child: { esModuleURI: BASE + 'Zvp9SidebarGuardChild.sys.mjs',
        events: {
          DOMContentLoaded: {}, pageshow: {}, pagehide: {},
          loadedmetadata: { capture: true, mozSystemGroup: true },
          loadeddata: { capture: true, mozSystemGroup: true },
          playing: { capture: true, mozSystemGroup: true },
          loadstart: { capture: true, mozSystemGroup: true },
          emptied: { capture: true, mozSystemGroup: true }
        }
      },
      matches: ['https://*/*'],
      allFrames: false,
      messageManagerGroups: ['browsers'],
      safeForUntrustedWebProcess: true
    });
  } catch (e) {
    if (e?.name !== 'NotSupportedError') {
      console.warn('[VP9 Sidebar Guard] Actor registration failed', e);
      delete window[KEY];
      return;
    }
  }

  const sidebar = document.getElementById('navigator-toolbox');
  const observer = new MutationObserver(scheduleRefresh);
  observer.observe(ROOT, { attributes: true,
    attributeFilter: ['zen-compact-mode', 'inDOMFullscreen', 'zen-renaming-tab'] });
  if (sidebar) observer.observe(sidebar, { attributes: true,
    attributeFilter: MARKERS.concat(['animate']) });

  const tabContainer = window.gBrowser?.tabContainer;
  tabContainer?.addEventListener('TabSelect', scheduleRefresh);
  const listener = {
    onLocationChange(browser) {
      if (browser !== window.gBrowser?.selectedBrowser) return;
      lastKey = '';
      scheduleRefresh();
    }
  };
  try { window.gBrowser?.addTabsProgressListener(listener); } catch (_) {}
  sidebar?.addEventListener('transitionend', scheduleRefresh);

  const prefObserver = { observe: scheduleRefresh };
  for (const name of [PREF_ENABLED, PREF_LEVEL]) {
    try { Services.prefs.addObserver(name, prefObserver); } catch (_) {}
  }
  // Safety watchdog for missed transitions or document replacements.
  poll = window.setInterval(() => refresh(true), 1250);
  scheduleRefresh();

  function cleanup() {
    if (!alive) return;
    alive = false;
    try { currentActor()?.sendAsyncMessage('Zvp9:SidebarState', { active: false, level: 1 }); }
    catch (_) {}
    observer.disconnect();
    tabContainer?.removeEventListener('TabSelect', scheduleRefresh);
    sidebar?.removeEventListener('transitionend', scheduleRefresh);
    try { window.gBrowser?.removeTabsProgressListener(listener); } catch (_) {}
    for (const name of [PREF_ENABLED, PREF_LEVEL]) {
      try { Services.prefs.removeObserver(name, prefObserver); } catch (_) {}
    }
    for (const timer of delayedTimers) window.clearTimeout(timer);
    if (poll !== null) window.clearInterval(poll);
    delete window[KEY];
  }
  window.addEventListener('unload', cleanup, { once: true });
})();
