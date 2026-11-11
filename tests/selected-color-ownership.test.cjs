'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'selected-color.uc.js'),'utf8');
const css=fs.readFileSync(path.join(root,'chrome.css'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'theme.json'),'utf8'));
test('selected color is owned exclusively by HG, not Site Folders',()=>{
 assert.equal(manifest.scripts['selected-color.uc.js'].loadOrder,30);
 assert(!source.includes('__zsfMenuV037'));
 assert(source.includes("const COLOR_PREF = 'zsf.selected-tab-color.v1'"));
 assert(source.includes("tabColorItem.id = 'zsf-change-selected-tab-color'"));
 assert(source.includes("tabColorItem.setAttribute('label', '變更選取分頁顏色')"));
 assert(css.includes('--zia-active-tab-bg-folder'));
 assert(css.includes('tab-group[split-view-group]'));
 assert(css.includes('#zsf-folder-hover-card .zsf-hover-row[zia-selected]'));
 assert(css.includes('data-zsf-color-sidebar-hold'));
});
test('saved user color is reused without migration or reset',()=>{
 let stored=JSON.stringify({hex:'#123456',alpha:60});
 const styles={};
 const window={addEventListener(){},removeEventListener(){}};
 const document={readyState:'loading',documentElement:{style:{setProperty(k,v){styles[k]=v;}}}};
 const Services={prefs:{getStringPref(){return stored;}}};
 const modified=source.replace('  window[KEY] = api;',
   '  window.__hgProbe = {validColor,readColor,applySelectedColor};\n  window[KEY] = api;');
 assert.notEqual(modified,source);
 vm.runInNewContext(modified,{window,document,Services,console});
 const probe=window.__hgProbe;
 assert.equal(probe.readColor().alpha,60);
 probe.applySelectedColor();
 assert.equal(styles['--zsf-selected-tab-fill'],'rgba(18, 52, 86, 0.6)');
 for(const v of [null,{}, {hex:'red',alpha:8},{hex:'#ffffff',alpha:-1},{hex:'#ffffff',alpha:101},
  {hex:'#ffffff',alpha:'8'}])assert(!probe.validColor(v));
 assert(probe.validColor({hex:'#ffffff',alpha:0}));
 stored='broken';
 assert.equal(probe.readColor().alpha,8);
 probe.applySelectedColor();
 assert.equal(styles['--zsf-selected-tab-fill'],'rgba(255, 255, 255, 0.08)');
});
