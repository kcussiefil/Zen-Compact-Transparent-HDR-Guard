'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const dir = path.resolve(__dirname, '..');
const source = name => fs.readFileSync(path.join(dir, name), 'utf8');
const css = source('chrome.css');
const js = source('sliders.uc.js');
const meta = JSON.parse(source('theme.json'));
const prefs = JSON.parse(source('preferences.json'));
const pref = name => prefs.find(x => x.property === 'mod.compacttpr.' + name);
test('independent Sine package has unique mod identity and valid entrypoints', () => {
  assert.equal(meta.id, 'zen-compact-transparent-hdr-guard');
  assert.equal(meta.style.chrome, 'chrome.css');
  assert.equal(meta.scripts['sliders.uc.js'].include[0], 'chrome://browser/content/browser.xhtml');
  assert.equal(meta.preferences, 'preferences.json');
  assert.ok(!meta.homepage.includes('Zen-Site-Folders'));
});
test('all preferences are natively accepted by Sine; slider values carry units', () => {
  const kinds = new Set(['separator','string','checkbox','dropdown']);
  assert.ok(prefs.every(p => kinds.has(p.type)));
  for (const [name,value] of Object.entries({customblur:'5px',transparentvalue:'15%',
     leftsidebarheight:'80%',videosidebaropacity:'97%',videocardopacity:'96%'})) {
    assert.equal(pref(name).type,'string');
    assert.equal(pref(name).defaultValue,value);
    assert.ok(js.includes("name: '" + name + "'"));
  }
  assert.equal(pref('disablevideoguard').defaultValue, false);
});
test('normal mode inherits upstream backdrop blur', () => {
  assert.match(css,/backdrop-filter:\s*blur\(var\(--mod-compacttpr-customblur, 5px\)\)/);
  assert.match(css,/--mod-compacttpr-transparentvalue, 15%/);
});
test('video mode uses Zia gate and does not force video layer promotion', () => {
  assert.match(css,/:root\[zia-video\]/);
  assert.match(css,/backdrop-filter:\s*none\s*!important/);
  assert.match(css,/--mod-compacttpr-videosidebaropacity, 97%/);
  assert.match(css,/--mod-compacttpr-videocardopacity, 96%/);
  assert.doesNotMatch(css,/\.browserSidebarContainer\s*\{\s*will-change/i);
  assert.doesNotMatch(css,/backface-visibility\s*:/i);
});
test('sliders delegate persistence to Sine change listener', () => {
  assert.match(js,/original\.dispatchEvent\(new E\('change'/);
  assert.match(js,/if \(!original\) return/);
});
