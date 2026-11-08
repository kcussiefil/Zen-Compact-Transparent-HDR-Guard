// HG Preview Blur Trace — standalone, user-activated browser-chrome diagnostic.
// No URL/title/content collection, uploads, or modifications to existing styles.
(() => {
  'use strict';
  const KEY = '__hgPreviewBlurTraceV001';
  if (window[KEY]) return;
  const CARD_IDS = ['zia-tab-card', 'zia-folder-card', 'zia-tip-card', 'zsf-folder-hover-card'];
  const NS = 'http://www.w3.org/1999/xhtml';
  const MAX_FRAMES = 1800, MAX_EVENTS = 300, MAX_MS = 90000;
  const root = document.documentElement;
  let recording = false, finished = false, startedAt = 0, startedWall = '';
  let frames = [], events = [], rafId = 0, burstUntil = 0;
  let panel = null, statusNode = null;
  const listeners = [];
  const now = () => Math.round((performance.now() - startedAt) * 10) / 10;
  function prefBool(key) {
    try { return Services.prefs.getBoolPref(key, false); } catch (_) { return null; }
  }
  function prefString(key) {
    try { return Services.prefs.getStringPref(key, ''); } catch (_) { return ''; }
  }
  function on(target, type, callback, options) {
    target.addEventListener(type, callback, options);
    listeners.push([target, type, callback, options]);
  }
  function status(message) {
    if (statusNode) statusNode.textContent = message ||
      (recording ? '錄製中' : finished ? '已停止' : '待命') +
      '　影格 ' + frames.length + ' / 事件 ' + events.length;
  }
  function note(type, details) {
    if (!recording) return;
    events.push({ms: now(), type, ...(details || {})});
    if (events.length > MAX_EVENTS) events.shift();
    if (type === 'tab-open' || type === 'load-start' || type === 'load-stop')
      burstUntil = performance.now() + 7000;
    status();
  }
  function styleOf(node) {
    const s = getComputedStyle(node);
    return {
      backdrop: s.getPropertyValue('backdrop-filter').trim(),
      background: s.getPropertyValue('background-color').trim(),
      opacity: s.getPropertyValue('opacity').trim(),
      display: s.getPropertyValue('display').trim(),
      visibility: s.getPropertyValue('visibility').trim(),
      willChange: s.getPropertyValue('will-change').trim(),
      backface: s.getPropertyValue('backface-visibility').trim(),
      transform: s.getPropertyValue('transform').trim()
    };
  }
  function visibleCards() {
    const shown = [];
    for (const id of CARD_IDS) {
      const card = document.getElementById(id);
      if (!card || card.hidden || card.hasAttribute('hidden')) continue;
      const style = styleOf(card);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      shown.push({id, style, inlineBackdrop: card.style.getPropertyValue('backdrop-filter') || ''});
    }
    return shown;
  }
  function rootSnapshot() {
    return {
      ziaVideo: root.hasAttribute('zia-video'),
      hgVideo: root.hasAttribute('data-zcth-video-page'),
      hgSDR: root.hasAttribute('data-zcth-sdr-glass'),
      hgHDR: root.hasAttribute('data-zcth-hdr-glass'),
      glanceRecovery: root.hasAttribute('data-zcth-glance-recover'),
      compact: root.getAttribute('zen-compact-mode') === 'true',
      unifiedHG: prefBool('mod.compacttpr.unifiedhg'),
      ziaCardsBlur: prefBool('zia.cards.blur'),
      blurOverVideo: prefBool('zia.glass.blur-over-video'),
      oldHGExperiment: prefBool('mod.compacttpr.previewcardstability'),
      configuredHGBlur: prefString('mod.compacttpr.customblur')
    };
  }
  function panesSnapshot() {
    const container = document.getElementById('tabbrowser-tabpanels');
    if (!container) return {available: false};
    const panes = container.querySelectorAll(':scope > .browserSidebarContainer');
    const active = [];
    let backgroundCount = 0, glanceCount = 0, firstBackground = null;
    for (const pane of panes) {
      if (pane.classList.contains('zen-glance-overlay') || pane.classList.contains('zen-glance-background')) {
        glanceCount++;
        continue;
      }
      const selected = pane.classList.contains('deck-selected');
      const split = pane.getAttribute('zen-split') === 'true';
      if (selected || split) active.push({selected, split, style: styleOf(pane)});
      else {
        backgroundCount++;
        if (!firstBackground) firstBackground = styleOf(pane);
      }
    }
    return {available: true, active, firstBackground, backgroundCount, glanceCount};
  }
  function frame() {
    rafId = 0;
    if (!recording) return;
    if (performance.now() - startedAt >= MAX_MS || frames.length >= MAX_FRAMES) {
      stop('已達取樣上限');
      return;
    }
    const cards = visibleCards();
    if (cards.length || performance.now() <= burstUntil) {
      frames.push({ms: now(), cards, root: rootSnapshot(), panes: panesSnapshot()});
      if (frames.length % 12 === 0) status();
    }
    rafId = window.requestAnimationFrame(frame);
  }
  function start() {
    if (recording) return;
    recording = true;
    finished = false;
    frames = []; events = [];
    startedAt = performance.now();
    startedWall = new Date().toISOString();
    burstUntil = performance.now() + 1500;
    note('capture-start');
    rafId = window.requestAnimationFrame(frame);
    status();
  }
  function stop(reason) {
    if (!recording) return;
    note('capture-stop', {reason: reason || 'manual'});
    recording = false; finished = true;
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = 0;
    status(reason ? '已停止：' + reason : undefined);
  }
  function mark() { note('visual-glitch-marked'); }
  function result() {
    return {
      schema: 'HG-preview-blur-trace-v1', recordedAt: startedWall,
      privacy: 'No URLs, tab titles, page content, images, IDs, user agent or network requests',
      sampling: 'Animation frames while a card is visible or for short tab-load bursts',
      frames, events,
      limits: {frames: MAX_FRAMES, milliseconds: MAX_MS}
    };
  }
  function save() {
    if (recording) stop('export');
    if (!startedWall) { status('請先開始紀錄'); return; }
    try {
      const ci = Components.interfaces;
      const picker = Components.classes['@mozilla.org/filepicker;1'].createInstance(ci.nsIFilePicker);
      picker.init(window.browsingContext, '儲存 HG 預覽卡片診斷', ci.nsIFilePicker.modeSave);
      picker.appendFilter('JSON', '*.json');
      picker.defaultString = 'HG-preview-trace-' + Date.now() + '.json';
      picker.open(async code => {
        if (code !== ci.nsIFilePicker.returnOK && code !== ci.nsIFilePicker.returnReplace) return;
        try {
          await IOUtils.writeUTF8(picker.file.path, JSON.stringify(result(), null, 2));
          status('JSON 已儲存');
        } catch (e) {
          console.error('[HG Trace] export failed', e);
          status('儲存失敗，請查看 Browser Console');
        }
      });
    } catch (e) {
      console.error('[HG Trace] file picker error', e);
      status('無法開啟儲存視窗，請查看 Browser Console');
    }
  }
  const progress = {
    onStateChange(_browser, webProgress, _request, state) {
      if (!recording || !webProgress?.isTopLevel || !(state & 0x00020000)) return;
      if (state & 1) note('load-start');
      else if (state & 16) note('load-stop');
    }
  };
  function createUI() {
    const element = tag => document.createElementNS(NS, tag);
    panel = element('div');
    panel.id = 'hg-preview-trace-diagnostic-controls';
    Object.assign(panel.style, {
      position: 'fixed', right: '12px', bottom: '12px', zIndex: '2147483647',
      border: '1px solid #aaa', borderRadius: '0', background: '#232327',
      color: '#fff', padding: '6px 8px', display: 'flex', gap: '7px',
      alignItems: 'center', font: '12px system-ui', pointerEvents: 'auto',
      opacity: '1', boxShadow: '0 2px 8px #0008'
    });
    statusNode = element('span');
    panel.appendChild(statusNode);
    function button(label, action) {
      const b = element('button');
      b.textContent = label;
      b.setAttribute('type', 'button');
      Object.assign(b.style, {background: '#39393f', color: '#fff', border: '1px solid #aaa',
        borderRadius: '0', padding: '3px 6px', font: '12px system-ui', cursor: 'pointer'});
      b.addEventListener('click', action);
      panel.appendChild(b);
    }
    button('開始紀錄', start);
    button('標記異常', mark);
    button('停止', () => stop());
    button('匯出 JSON', save);
    root.appendChild(panel);
    status();
  }
  function cleanup() {
    stop('unload');
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = 0;
    for (const [target, name, fn, opts] of listeners) target.removeEventListener(name, fn, opts);
    try { window.gBrowser?.removeTabsProgressListener(progress); } catch (_) {}
    panel?.remove();
    panel = null; statusNode = null;
    if (window[KEY]) delete window[KEY];
  }
  function init() {
    const tc = window.gBrowser?.tabContainer;
    if (!tc || window[KEY]) return;
    window[KEY] = {start, stop, mark, save, result, cleanup};
    createUI();
    on(tc, 'TabOpen', e => note('tab-open', {background: e.target !== window.gBrowser?.selectedTab}), true);
    on(tc, 'TabSelect', () => note('tab-select'), true);
    on(tc, 'TabClose', () => note('tab-close'), true);
    on(tc, 'TabAttrModified', e => {
      if (!recording) return;
      const changed = e.detail?.changed || [];
      const wanted = changed.filter(x => ['busy', 'pending', 'progress'].includes(x));
      if (wanted.length) note('tab-attributes', {changed: wanted});
    }, true);
    try { window.gBrowser.addTabsProgressListener(progress); } catch (_) {}
    on(window, 'unload', cleanup, {once: true});
  }
  if (window.gBrowser?.tabContainer) init();
  else window.addEventListener('load', init, {once: true});
})();
