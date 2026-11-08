'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'chrome.css'), 'utf8');
const prefs = JSON.parse(fs.readFileSync(path.join(root, 'preferences.json'), 'utf8'));
const theme = JSON.parse(fs.readFileSync(path.join(root, 'theme.json'), 'utf8'));
const marker = '/* v0.4.2 — opt-in card-only macOS backdrop compositing experiment.';
const start = css.indexOf(marker);
const block = css.slice(start).replace(/\/\*[\s\S]*?\*\//g, '');
test('042 is opt-in, limited to visible cards on macOS and Zia blur-enabled state', () => {
  assert.equal(theme.version, '0.4.2');
  assert.ok(start > 0);
  assert.equal(prefs.find(x=>x.property==='mod.compacttpr.previewcardstability')?.defaultValue,false);
  for (const token of [
    '@media (-moz-platform: macos)',
    'mod.compacttpr.usecompacttransparent',
    'mod.compacttpr.unifiedhg',
    'mod.compacttpr.previewcardstability',
    '@media -moz-pref("zia.cards.blur")',
    ':not([hidden])',
    ':not([customizing], [inDOMFullscreen="true"], [zia-video])',
    '.zen-glance-overlay.deck-selected',
    '#zia-tab-card', '#zia-folder-card', '#zia-tip-card', '#zsf-folder-hover-card'
  ]) assert.ok(block.includes(token),token);
});
test('042 hints only the backdrop-filter layer; it does not repaint, transform or promote pages', () => {
  assert.equal((block.match(/will-change:\s*backdrop-filter\s*!important/g)||[]).length,1);
  assert.doesNotMatch(block,/\b(?:background|background-color|color|opacity|filter|backdrop-filter|transform|box-shadow|animation|transition|position|display|visibility|pointer-events)\s*:/);
  assert.doesNotMatch(block,/\.browserSidebarContainer\s*\{|\bsetTimeout\b|\bsetInterval\b/);
  assert.doesNotMatch(block,/#tabContextMenu|#contentAreaContextMenu|#urlbar|#titlebar|#navigator-toolbox/);
});
test('042 retains 041 menu background restoration and scoped no-native-window-shadow rules',()=>{
  const menu=css.slice(css.indexOf('/* v0.4.0 — macOS context-menu border-only correction.'),start);
  assert.match(menu,/#tabContextMenu/);
  assert.match(menu,/--panel-border-color: transparent !important;/);
  assert.match(menu,/--panel-box-shadow: none !important;/);
  assert.doesNotMatch(menu,/-moz-window-shadow\s*:/);
  assert.doesNotMatch(menu,/\bbackground(?:-color)?\s*:/);
});
