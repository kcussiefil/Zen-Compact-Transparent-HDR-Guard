'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),{spawnSync}=require('node:child_process');
test('diagnostic Sine preview trace runs independently of stable HG',()=>{
 const pathToTest=path.join(__dirname,'../diagnostics/preview-trace/diagnostic-preview-trace.test.cjs');
 const p=spawnSync(process.execPath,['--test',pathToTest],{encoding:'utf8'});
 assert.equal(p.status,0,p.stdout+'\n'+p.stderr);
 assert.match(p.stdout,/# pass 3/);
});
