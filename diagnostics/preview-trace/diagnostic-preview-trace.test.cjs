'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {spawnSync} = require('node:child_process');
const directory = __dirname;
const script = fs.readFileSync(path.join(directory,'preview-trace.uc.js'),'utf8');
const theme = JSON.parse(fs.readFileSync(path.join(directory,'theme.json'),'utf8'));

test('independent diagnostic Sine mod and JavaScript syntax', () => {
  assert.equal(theme.id, 'hg-preview-blur-diagnostic');
  assert.equal(theme.scripts['preview-trace.uc.js'].loadOrder, 99);
  assert.equal(theme.style.chrome, 'empty.css');
  const proc=spawnSync(process.execPath,['--check',path.join(directory,'preview-trace.uc.js')],{encoding:'utf8'});
  assert.equal(proc.status,0,proc.stderr);
});

test('privacy, finite sampling, reversible lifecycle', () => {
  for (const pattern of ['fetch(', 'XMLHttpRequest', 'sendBeacon(', 'WebSocket(',
    'currentURI','document.title', 'tab.label','outerHTML','innerHTML',
    'getScreenshot(', 'navigator.userAgent', 'localStorage'])
    assert.ok(!script.includes(pattern),'forbidden: '+pattern);
  assert.match(script,/let recording = false/);
  assert.match(script,/MAX_FRAMES = 1800/);
  assert.match(script,/MAX_MS = 90000/);
  assert.match(script,/requestAnimationFrame\(frame\)/);
  assert.match(script,/IOUtils\.writeUTF8/);
  assert.doesNotMatch(script,/\.style\.setProperty\(/);
});

test('mock-browser runtime records tab-open, CSS, video state and exports local JSON', async () => {
  const callbacks={}; let time=0, frameCallback=null, written=null;
  const makeElement=()=>({style:{}, hidden:false, attributes:{}, children:[],
    setAttribute(name,value){this.attributes[name]=value;},
    hasAttribute(name){return Object.hasOwn(this.attributes,name);},
    getAttribute(name){return this.attributes[name]||null;},
    appendChild(el){this.children.push(el);},
    addEventListener(type,callback){this.handlers??={};this.handlers[type]=callback;},
    removeEventListener(type){delete this.handlers?.[type];},
    remove(){},
    classList:{contains(){return false;}}
  });
  function css(){return {getPropertyValue(name){return ({'backdrop-filter':'blur(10px)',
    'background-color':'rgba(20,20,20,0.85)','opacity':'1','display':'block',
    'visibility':'visible','will-change':'auto','backface-visibility':'visible',
    'transform':'none'})[name]||'';}};}
  const root=makeElement();
  const card=makeElement(); card.style.getPropertyValue=()=>'';
  const tabs=makeElement();
  const panel=makeElement(); panel.classList={contains:name=>name==='deck-selected'};
  const container={querySelectorAll(){return [panel];}};
  const doc={documentElement:root,createElementNS:()=>makeElement(),
    getElementById(id){return id==='zia-tab-card'?card:id==='tabbrowser-tabpanels'?container:null;}};
  const window={gBrowser:{tabContainer:tabs,selectedTab:{},
    addTabsProgressListener(){}, removeTabsProgressListener(){}},
    addEventListener(type,callback){callbacks[type]=callback;},
    removeEventListener(type){delete callbacks[type];},
    requestAnimationFrame(callback){frameCallback=callback;return 1;},
    cancelAnimationFrame(){frameCallback=null;},browsingContext:{}};
  const fp={init(){},appendFilter(){},open(cb){cb(0);},file:{path:'/diagnostic.json'}};
  const ci={nsIFilePicker:{modeSave:1,returnOK:0,returnReplace:2}};
  const sandbox={window,document:doc,performance:{now:()=>time},
    getComputedStyle:css,Services:{prefs:{getBoolPref:()=>true,getStringPref:()=> '10px'}},
    Components:{interfaces:ci,classes:{'@mozilla.org/filepicker;1':{createInstance:()=>fp}}},
    IOUtils:{async writeUTF8(path,data){written={path,data};}},
    console,Date};
  vm.runInNewContext(script,sandbox);
  const tool=window.__hgPreviewBlurTraceV001;
  assert.ok(tool);
  tool.start();
  tabs.handlers.TabOpen({target:{}}); // not selected: background tab
  time=16;
  frameCallback();
  assert.equal(tool.result().frames.length,1);
  assert.equal(tool.result().frames[0].cards[0].style.backdrop,'blur(10px)');
  assert.equal(tool.result().frames[0].root.ziaVideo,false);
  assert.equal(tool.result().events.some(e=>e.type==='tab-open'&&e.background),true);
  tool.mark(); tool.stop(); tool.save();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(written.path,'/diagnostic.json');
  const json=JSON.parse(written.data);
  assert.equal(json.schema,'HG-preview-blur-trace-v1');
  assert.ok(json.events.some(e=>e.type==='visual-glitch-marked'));
  tool.cleanup();
  assert.equal(window.__hgPreviewBlurTraceV001,undefined);
});
