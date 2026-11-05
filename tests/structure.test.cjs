'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const dir = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(dir,p),'utf8');
const css = read('chrome.css');
const meta = JSON.parse(read('theme.json'));
const pref = JSON.parse(read('preferences.json'));
const js = read('video-page.uc.js');

test('manifest is independent, CSS and video detector are loaded', () => {
  assert.equal(meta.id,'zen-compact-transparent-hdr-guard');
  assert.equal(meta.version,'0.1.2');
  assert.equal(meta.style.chrome,'chrome.css');
  assert.ok(meta.scripts['video-page.uc.js']);
  assert.equal(meta.preferences,'preferences.json');
  assert.ok(!fs.existsSync(path.join(dir, 'sliders.uc.js')));
  assert.ok(!meta.homepage.includes('Zen-Site-Folders'));
});
test('normal Transparent Mode is fenced off completely in video state', () => {
  assert.match(css, /:root\[zen-compact-mode="true"\]:not\(\[customizing\]\):not\(\s*\[inDOMFullscreen="true"\]\s*\):not\(\[zia-video\], \[data-zcth-video-page\]\)/);
  assert.match(css, /\.zen-browser-generic-background\.zen-toolbar-background\s*\{\s*display:\s*none !important/);
  assert.match(css,/backdrop-filter:\s*blur\(\s*var\(--mod-compacttpr-customblur,\s*5px\)/);
  assert.doesNotMatch(css,/#titlebar::before\s*\{\s*content:\s*none/);
});
test('video path uses native Zia/Zen two-layer theme paint, not a colour guess', () => {
  assert.match(css, /:root\[data-zcth-video-page\]:not\(\[zia-video\]\)/);
  assert.match(css, /--zen-background-opacity,\s*1/);
  assert.match(css, /background:\s*light-dark\(#e9e9e9,\s*#131313\)/);
  assert.match(css, /backdrop-filter:\s*none\s*!important/);
  assert.doesNotMatch(css,/--mod-compacttpr-(?:videosidebaropacity|videocardopacity)/);
});
test('settings no longer advertise sliders or redundant video opacity', () => {
  assert.equal(pref.some(p=>p.label?.includes('滑桿')),false);
  for(const val of ['5px','15%','80%'])
    assert.ok(pref.some(p=>p.label?.includes('預設 '+val)));
  assert.ok(!pref.some(p=>p.property==='mod.compacttpr.disablevideoguard'));
});
test('watch page selection stays supported when player scrolls out',()=>{
  assert.match(js,/data-zcth-video-page/);
  assert.match(js,/TabSelect/);
  assert.match(js,/bilibili/);
  assert.match(js,/youtube/);
});
