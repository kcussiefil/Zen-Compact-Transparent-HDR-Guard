// ==UserScript==
// @name         HDR Guard — independent selected-tab color editor
// @version      0.4.5
// @description  Selected tab color and non-modal picker independent of Site Folders.
// @include      chrome://browser/content/browser.xhtml
// ==/UserScript==
(() => {
  'use strict';
  const KEY = '__zcthSelectedColorV045';
  if (window[KEY]) return;
  const TAG = '[HDRGuardSelectedColor]';
  const alertUser = msg => {
    try { Services.prompt.alert(window, 'HDR Guard', msg); }
    catch (_) { console.warn(TAG, msg); }
  };
  const COLOR_PREF = 'zsf.selected-tab-color.v1';
  const COLOR_TOPIC = 'zsf-selected-tab-color-changed';
  const DEFAULT_COLOR = { hex: '#ffffff', alpha: 8 };
  let colorDialog = null, tabColorItem = null;
  function validColor(value) {
    return value && /^#[0-9a-f]{6}$/i.test(value.hex) &&
      Number.isFinite(value.alpha) && value.alpha >= 0 && value.alpha <= 100;
  }
  function readColor() {
    try {
      const value = JSON.parse(Services.prefs.getStringPref(COLOR_PREF, 'null'));
      if (validColor(value)) return value;
    } catch (_) {}
    return { ...DEFAULT_COLOR };
  }
  function applySelectedColor(value = readColor()) {
    if (!validColor(value)) return;
    const rgb = [1, 3, 5].map(i => parseInt(value.hex.slice(i, i + 2), 16));
    document.documentElement.style.setProperty('--zsf-selected-tab-fill',
      `rgba(${rgb.join(', ')}, ${value.alpha / 100})`);
  }
  function chooseSelectedColor(anchorTab = null) {
    if (colorDialog?.isConnected) { colorDialog.focus(); return; }
    const html = (tag, text) => {
      const node = document.createElementNS('http://www.w3.org/1999/xhtml', tag);
      if (text != null) node.textContent = text;
      return node;
    };
    const dialog = html('dialog'); dialog.id = 'zsf-color-dialog';
    dialog.setAttribute('aria-labelledby', 'zsf-color-heading');
    const header = html('div'); header.className = 'zsf-color-heading-row';
    const heading = html('h3', '選取分頁顏色'); heading.id = 'zsf-color-heading';
    const dismiss = html('button', '×'); dismiss.type = 'button';
    dismiss.className = 'zsf-color-dismiss'; dismiss.setAttribute('aria-label', '關閉顏色設定');
    header.append(heading, dismiss);
    const colorRow = html('label'); colorRow.className = 'zsf-color-picker-row';
    const controls = html('span'); controls.className = 'zsf-color-picker-controls';
    const color = html('input'); color.type = 'color';
    color.setAttribute('aria-label', '選取分頁顏色');
    const code = html('span'); code.className = 'zsf-color-hex';
    controls.append(color, code); colorRow.append(html('span', '顏色'), controls);
    const alphaBlock = html('div'); alphaBlock.className = 'zsf-color-opacity';
    const alphaHeader = html('div'); alphaHeader.className = 'zsf-color-opacity-heading';
    const output = html('output'); output.className = 'zsf-color-percent';
    alphaHeader.append(html('span', '不透明度'), output);
    const alpha = html('input'); alpha.type = 'range'; alpha.min = '0'; alpha.max = '100';
    alpha.step = '1'; alpha.setAttribute('aria-label', '底色不透明度');
    alphaBlock.append(alphaHeader, alpha);
    const sample = html('div'); sample.className = 'zsf-color-sample';
    const caption = html('span', '即時預覽'); caption.className = 'zsf-color-sample-caption';
    const sampleTab = html('div'); sampleTab.className = 'zsf-color-sample-tab';
    sampleTab.append(html('span', anchorTab?.label || window.gBrowser?.selectedTab?.label || '目前選取的分頁'));
    sample.append(caption, sampleTab);
    const actions = html('div'); actions.className = 'zsf-color-actions';
    const button = (text, type) => {
      const node = html('button', text); node.type = 'button';
      node.className = 'zsf-color-button ' + type; return node;
    };
    const reset = button('還原預設', 'zsf-color-reset');
    const cancel = button('取消', 'zsf-color-cancel');
    const save = button('儲存', 'zsf-color-save');
    const right = html('div'); right.className = 'zsf-color-confirm'; right.append(cancel, save);
    actions.append(reset, right); dialog.append(header, colorRow, alphaBlock, sample, actions);
    const preview = () => {
      code.textContent = color.value.toUpperCase();
      output.textContent = alpha.value + '%';
      applySelectedColor({ hex: color.value, alpha: Number(alpha.value) });
    };
    const set = value => { color.value = value.hex; alpha.value = String(value.alpha); preview(); };
    set(readColor());
    color.addEventListener('input', preview);
    alpha.addEventListener('input', preview);
    reset.addEventListener('click', () => set(DEFAULT_COLOR));
    dismiss.addEventListener('click', () => dialog.close());
    cancel.addEventListener('click', () => dialog.close());
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
    });
    save.addEventListener('click', () => {
      const value = { hex: color.value, alpha: Number(alpha.value) };
      if (!validColor(value)) return;
      try {
        Services.prefs.setStringPref(COLOR_PREF, JSON.stringify(value));
        Services.obs.notifyObservers(null, COLOR_TOPIC);
        dialog.close();
      } catch (_) { alertUser('無法儲存顏色，請再試一次。'); }
    });
    const toolbox = document.getElementById('navigator-toolbox');
    // Independent of preview cards: neither holder can release the other's sidebar.
    toolbox?.setAttribute('data-zsf-color-sidebar-hold', 'true');
    const position = () => {
      const sidebar = toolbox?.getBoundingClientRect();
      const anchor = anchorTab?.isConnected ? anchorTab.getBoundingClientRect() : null;
      const root = document.documentElement;
      const vw = window.innerWidth || root.clientWidth || 1024;
      const vh = window.innerHeight || root.clientHeight || 768;
      const width = dialog.getBoundingClientRect().width || 310;
      const height = dialog.getBoundingClientRect().height || 260;
      const onRight = root.getAttribute('zen-right-side') === 'true';
      const x = onRight ? (sidebar?.left ?? vw) - width - 8 : (sidebar?.right ?? 0) + 8;
      const y = anchor?.height ? anchor.top : (sidebar?.top ?? 8) + 20;
      dialog.style.left = Math.round(Math.max(8, Math.min(x, vw - width - 8))) + 'px';
      dialog.style.top = Math.round(Math.max(8, Math.min(y, vh - height - 8))) + 'px';
      dialog.style.visibility = 'visible';
    };
    dialog.addEventListener('close', () => {
      window.removeEventListener('resize', position);
      toolbox?.removeAttribute('data-zsf-color-sidebar-hold');
      applySelectedColor(); dialog.remove();
      if (colorDialog === dialog) colorDialog = null;
    }, { once: true });
    document.documentElement.appendChild(dialog); colorDialog = dialog;
    dialog.style.visibility = 'hidden';
    dialog.show(); // Non-modal, so the selected tab remains visible during adjustments.
    position(); window.addEventListener('resize', position);
  }
  const colorObserver = { observe() { applySelectedColor(); } };
  let initialized = false;
  let dead = false;
  const listeners = [];
  function bind(node, type, callback, capture) {
    node?.addEventListener?.(type, callback, capture);
    listeners.push([node, type, callback, capture]);
  }
  function ordinaryContextTab() {
    const tab = window.TabContextMenu?.contextTab;
    return tab?.isConnected && tab.localName === 'tab' &&
      !tab.hasAttribute('zen-essential') && !tab.hasAttribute('zen-empty-tab') ? tab : null;
  }
  function installTabColorMenu() {
    const popup = document.getElementById('tabContextMenu');
    if (!popup || tabColorItem?.isConnected) return;
    tabColorItem = document.createXULElement('menuitem');
    tabColorItem.id = 'zsf-change-selected-tab-color';
    tabColorItem.setAttribute('label', '變更選取分頁顏色');
    tabColorItem.hidden = true;
    // Keep the native tab context menu and its normal commands intact.
    const anchor = document.getElementById('context_duplicateTab');
    popup.insertBefore(tabColorItem, anchor?.parentElement === popup ? anchor : null);
    bind(popup, 'popupshowing', event => {
      if (event.target === popup) tabColorItem.hidden = !ordinaryContextTab();
    });
    bind(tabColorItem, 'command', () => {
      const tab = ordinaryContextTab();
      if (tab) chooseSelectedColor(tab);
    });
  }
  function init() {
    if (initialized || dead || !window.gBrowser?.tabContainer) return;
    initialized = true;
    applySelectedColor();
    installTabColorMenu();
    Services.obs.addObserver(colorObserver, COLOR_TOPIC);
    // Follow direct preference changes from about:config too.
    try { Services.prefs.addObserver(COLOR_PREF, colorObserver); } catch (_) {}
  }
  function destroy() {
    if (dead) return;
    dead = true;
    colorDialog?.close();
    tabColorItem?.remove();
    tabColorItem = null;
    try { Services.obs.removeObserver(colorObserver, COLOR_TOPIC); } catch (_) {}
    try { Services.prefs.removeObserver(COLOR_PREF, colorObserver); } catch (_) {}
    for (const [node, type, cb, capture] of listeners.splice(0).reverse()) {
      try { node?.removeEventListener?.(type, cb, capture); } catch (_) {}
    }
    if (window[KEY] === api) delete window[KEY];
  }
  const api = {
    version: '0.4.5',
    init, destroy, openSelectedColor: chooseSelectedColor,
    readColor, applySelectedColor, validColor
  };
  window[KEY] = api;
  if (document.readyState === 'complete') init();
  else bind(window, 'load', init, { once: true });
  bind(window, 'unload', destroy, { once: true });
})();
