'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname,'..','sliders.uc.js'),'utf8');
class FakeElement {
  constructor(tag) {
    this.tagName=tag; this.children=[]; this.attributes=new Map();
    this.listeners=new Map(); this.type=''; this.value='';
    const props=new Map();
    this.style={cssText:'',display:'',setProperty:(k,v)=>props.set(k,v),
      removeProperty:k=>props.delete(k),getPropertyValue:k=>props.get(k)};
  }
  setAttribute(k,v){this.attributes.set(k,String(v));}
  getAttribute(k){return this.attributes.get(k)||null;}
  append(...nodes){this.children.push(...nodes);}
  appendChild(node){this.children.push(node);return node;}
  querySelector(s){
    if(s==='input[type="text"]')return this.children.find(x=>x.tagName==='input'&&x.type==='text')||null;
    if(s==='[data-hdrguard-slider]')return this.children.flatMap(x=>[x,...x.children]).find(x=>x.attributes.has('data-hdrguard-slider'))||null;
    return null;
  }
  addEventListener(n,cb){const a=this.listeners.get(n)||[];a.push(cb);this.listeners.set(n,a);}
  dispatchEvent(e){for(const fn of this.listeners.get(e.type)||[])fn(e);return true;}
}
class FakeObserver {observe(){} disconnect(){}}
class FakeEvent {constructor(type){this.type=type;}}
function make() {
  const host=new FakeElement('div'),rows=new Map();
  for(const [name,initial] of Object.entries({customblur:'5px',transparentvalue:'15%',
    leftsidebarheight:'80%',videosidebaropacity:'97%',videocardopacity:'96%'})) {
    const row=new FakeElement('hbox');
    const input=new FakeElement('input'); input.type='text';input.value=initial;
    row.append(input);rows.set('mod-compacttpr-'+name,row);
  }
  const doc={defaultView:{MutationObserver:FakeObserver,Event:FakeEvent},
    getElementById:id=>id==='sineModsList'?host:(rows.get(id)||null),
    createElementNS:(_ns,name)=>new FakeElement(name)};
  const props=new Map();let scan;
  const browser={gBrowser:{tabs:[{linkedBrowser:{contentWindow:{location:{pathname:'/preferences'},document:doc}}}]},
    document:{documentElement:{style:{setProperty:(n,v)=>props.set(n,v),removeProperty:n=>props.delete(n)}}},
    setTimeout:fn=>fn(),setInterval:fn=>{scan=fn;return 1},clearInterval:()=>{},addEventListener:()=>{}};
  vm.runInNewContext(source,{window:browser});
  return {rows,scan};
}
test('Sine string inputs are converted into range sliders',()=>{
  const {rows}=make();
  for(const row of rows.values()) {
    const slider=row.children[1].children[0];
    assert.equal(slider.type,'range');
    assert.equal(row.children[0].style.display,'none');
  }
});
test('slider release invokes Sine original change event',()=>{
  const {rows}=make();
  const row=rows.get('mod-compacttpr-customblur');
  const input=row.children[0],slider=row.children[1].children[0];
  let called=0;input.addEventListener('change',()=>called++);
  slider.value='19';slider.dispatchEvent(new FakeEvent('input'));
  assert.equal(row.children[1].children[1].textContent,'19px');
  slider.dispatchEvent(new FakeEvent('change'));
  assert.equal(input.value,'19px');
  assert.equal(called,1);
});
test('repeated scans do not create duplicate sliders',()=>{
  const {rows,scan}=make();scan();
  for(const row of rows.values())assert.equal(row.children.length,2);
});
