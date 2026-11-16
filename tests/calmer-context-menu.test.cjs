'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('selected-color.uc.js','utf8');
assert(source.includes("tabColorItem.id = 'zsf-change-selected-tab-color'"));
assert(source.includes("'context_zen-edit-tab-icon'"));
assert(!source.includes("const anchor = document.getElementById('context_duplicateTab')"));

class Item {
  constructor(localName, id='') {
    this.localName=localName;this.id=id;this.parentElement=null;
    this.children=[];this.attrs={};this.events={};this.hidden=false;
    this.isConnected=true;
  }
  appendChild(el) {el.parentElement=this;this.children.push(el);return el;}
  insertBefore(el,anchor) {
    if(!anchor)return this.appendChild(el);
    const index=this.children.indexOf(anchor);
    if(index<0)throw Error('Anchor is not a direct menu child');
    el.parentElement=this;this.children.splice(index,0,el);return el;
  }
  setAttribute(name,value) {this.attrs[name]=String(value);}
  getAttribute(name) {return this.attrs[name]??null;}
  hasAttribute(name) {return name in this.attrs;}
  addEventListener(name,fn) {(this.events[name]||=[]).push(fn);}
  removeEventListener(name,fn) {this.events[name]=(this.events[name]||[]).filter(x=>x!==fn);}
}
function arrange({siteFirst=false,hasEditIcon=true}={}) {
  const popup=new Item('menupopup','tabContextMenu');
  const title=new Item('menuitem','context_zen-edit-tab-title');
  const icon=hasEditIcon?new Item('menuitem','context_zen-edit-tab-icon'):null;
  const sep=new Item('menuseparator');
  const bookmark=new Item('menuitem','context_bookmarkTab');
  const duplicate=new Item('menuitem','context_duplicateTab');
  popup.appendChild(title);
  if(icon)popup.appendChild(icon);
  if(icon)popup.appendChild(sep);
  popup.appendChild(bookmark);
  popup.appendChild(duplicate);
  const site=new Item('menuitem','zsf-manual-create-group');
  const anchor=icon||bookmark;
  if(siteFirst)popup.insertBefore(site,anchor);
  const document={
    readyState:'loading',
    createXULElement:name=>new Item(name),
    getElementById:id=>id==='tabContextMenu'?popup:
      popup.children.find(x=>x.id===id)||null,
  };
  const tab={localName:'tab',isConnected:true,hasAttribute:()=>false};
  const window={TabContextMenu:{contextTab:tab},addEventListener(){},
    removeEventListener(){}};
  const patched=source.replace('  window[KEY] = api;',
    '  window.__installColorMenu = installTabColorMenu;\n  window[KEY] = api;');
  assert.notEqual(patched,source);
  vm.runInNewContext(patched,{window,document,console});
  window.__installColorMenu();
  const color=popup.children.find(x=>x.id==='zsf-change-selected-tab-color');
  assert(color,'selected-color menuitem must be installed');
  if(!siteFirst)popup.insertBefore(site,anchor);
  return {popup,title,icon,sep,bookmark,site,color};
}
for(const siteFirst of [true,false]){
  test('Calmer native section is shared, site first = '+siteFirst,()=>{
    const {popup,icon,sep,site,color}=arrange({siteFirst});
    const ids=popup.children.map(x=>x.id);
    const positions=[ids.indexOf(site.id),ids.indexOf(color.id)];
    const iconAt=ids.indexOf(icon.id);
    assert(positions.every(x=>x>=0 && x<iconAt));
    assert.equal(popup.children[iconAt+1],sep,
      'Zen icon + separator sibling selector must remain intact');
    assert(!popup.children.slice(Math.min(...positions),Math.max(...positions)+1)
      .some(x=>x.localName==='menuseparator'),
      'Calmer must see both custom items inside the SAME separator group');
  });
}
test('missing Change Icon uses Bookmark as a safe shared fallback',()=>{
  const {popup,site,color,bookmark}=arrange({siteFirst:true,hasEditIcon:false});
  const ids=popup.children.map(x=>x.id);
  assert(ids.indexOf(site.id)<ids.indexOf(bookmark.id));
  assert(ids.indexOf(color.id)<ids.indexOf(bookmark.id));
  assert(!popup.children.some(x=>x.localName==='menuseparator'),
    'fallback must not inject an extra separator');
});
test('menu command and visibility continue to work in native popup',()=>{
  const {popup,color}=arrange();
  assert.equal(color.getAttribute('label'),'變更選取分頁顏色');
  assert.equal(color.hidden,true);
  for(const listener of popup.events.popupshowing||[])listener({target:popup});
  assert.equal(color.hidden,false);
  assert.equal(color.events.command?.length,1);
});
