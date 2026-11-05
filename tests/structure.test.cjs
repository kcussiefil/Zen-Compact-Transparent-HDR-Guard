'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(dir,p),'utf8');
const css=read('chrome.css');
const meta=JSON.parse(read('theme.json'));
const prefs=JSON.parse(read('preferences.json'));
test('independent package preserves native protection and adds SDR probe',()=>{
  assert.equal(meta.id,'zen-compact-transparent-hdr-guard');
  assert.equal(meta.version,'0.1.3');
  assert.equal(meta.style.chrome,'chrome.css');
  assert.ok(meta.scripts['video-page.uc.js']);
  assert.ok(meta.scripts['sdr-glass.uc.js']);
  assert.ok(!fs.existsSync(path.join(dir,'sliders.uc.js')));
});
test('Sine opt-in setting disabled by default; existing defaults unchanged',()=>{
  const option=prefs.find(p=>p.property==='mod.compacttpr.sdrrealblur');
  assert.equal(option?.type,'checkbox');
  assert.equal(option?.defaultValue,false);
  for(const value of ['5px','15%','80%'])
    assert.ok(prefs.some(p=>p.label?.includes('預設 '+value)));
});
test('safe original solid path and normal real glass are retained',()=>{
  assert.match(css,/:not\(\[zia-video\], \[data-zcth-video-page\]\)/);
  assert.match(css,/--zen-background-opacity,\s*1/);
  assert.match(css,/backdrop-filter:\s*blur\(/);
});
test('force blur requires opt-in and confirmed SDR plus visible video',()=>{
  assert.match(css,/-moz-bool-pref:\s*"mod.compacttpr.sdrrealblur"/);
  assert.match(css,/:root\[data-zcth-sdr-glass\]\[zia-video\]/);
  assert.match(css,/will-change:\s*transform\s*!important/);
  assert.match(css,/#zsf-folder-hover-card/);
});
