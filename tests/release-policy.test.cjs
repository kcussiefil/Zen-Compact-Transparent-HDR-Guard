'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const theme=JSON.parse(read('theme.json'));
const version=theme.version;
const english=read('README.md');
const chinese=read('README.zh-TW.md');
const changelog=read('CHANGELOG.md');
const notes=read('releases/v'+version+'.md');
const policy=read('docs/RELEASE_POLICY.md');
const releaseWorkflow=read('.github/workflows/publish-releases.yml');
const validationWorkflow=read('.github/workflows/validate.yml');
const headings=['## Changes','## SDR/HDR and Zia compatibility','## Validation and hardware limitations','## Rollback'];

test('release policy: public docs and manifest share one current version',()=>{
 assert.match(version,/^\d+\.\d+\.\d+$/);
 assert.match(theme.updatedAt,/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
 assert.ok(!Number.isNaN(new Date(theme.updatedAt).getTime()));
 assert.ok(english.includes('Current version | **v'+version+'**'),
   'English README current version is stale');
 assert.ok(chinese.includes('目前版本 | **v'+version+'**'),
   'Traditional Chinese README current version is stale');
 assert.ok(changelog.includes('current release is **v'+version+'**'),
   'CHANGELOG version is stale');
 assert.ok(changelog.includes('[v'+version+'](releases/v'+version+'.md)'));
 assert.ok(english.includes('[繁體中文](README.zh-TW.md)'));
 assert.ok(chinese.includes('[English](README.md)'));
});

test('release policy: canonical H1 and four English section names, in order',()=>{
 const lines=notes.replace(/\r\n/g,'\n').split('\n').map(l=>l.trim());
 assert.ok(lines[0].startsWith('# Zen Compact Transparent HDR Guard v'+version+' — '),
   'Release must have the standardized versioned heading');
 assert.equal(lines.filter(l=>l.startsWith('# ')).length,1);
 let previous=0;
 for(const h of headings){
  const n=lines.indexOf(h);
  assert.ok(n>previous,h+' missing, duplicate or out of order');
  assert.equal(lines.filter(l=>l===h).length,1);
  previous=n;
 }
 for(const heading of headings){
  const start=lines.indexOf(heading);
  const end=lines.slice(start+1).findIndex(l=>l.startsWith('## '));
  const section=(end<0?lines.slice(start+1):lines.slice(start+1,start+1+end)).join(' ').trim();
  assert.ok(section.length>=60,heading+' must contain real details');
 }
});

test('release policy: separate CI evidence from actual macOS OLED acceptance',()=>{
 const validation=notes.split('## Validation and hardware limitations')[1].split('## Rollback')[0];
 assert.match(validation,/Node\.js/i);
 assert.match(validation,/CI/i);
 assert.match(validation,/macOS/i);
 assert.match(validation,/OLED/i);
 assert.match(validation,/(not performed|not verified|requires actual hardware testing|not.*hardware)/i);
 assert.match(notes,/Bilibili/i);
 assert.match(notes,/HDR.*(dim|washed out)/i);
 assert.match(notes,/default-OFF/);
});

test('release policy: previous tag, backup and immediate rollback are documented',()=>{
 const rollback=notes.split('## Rollback')[1];
 assert.match(rollback,/Sine/);
 const changelogVersions=[...changelog.matchAll(/^\\| \\[v(\\d+\\.\\d+\\.\\d+)\\]\\(releases\\/v\\1\\.md\\)/gm)].map(m=>m[1]);
 assert.equal(changelogVersions[0],version,'Latest changelog entry must be current release');
 const previous=changelogVersions[1];
 assert.ok(previous,'Latest release must retain a previous rollback reference');
 assert.ok(rollback.includes('v'+previous),'Rollback must cite the previous release tag');
 assert.match(rollback,/backup\\/v\\d+\\.\\d+\\.\\d+[-a-z0-9]*/i);
 assert.match(rollback,/[a-f0-9]{40}/);
 assert.match(rollback,/(OFF|disable)/);
});

test('release policy: README and changelog stay concise',()=>{
 assert.ok(english.length<8500,'Detailed changes belong in release notes');
 assert.ok(changelog.length<4500,'CHANGELOG must stay an index');
 assert.match(policy,/## Release gate and consistency checks/);
 assert.match(policy,/## Required release sections/);
 for(const h of headings)assert.ok(policy.includes(h),'Missing heading in policy: '+h);
});

test('release policy: publisher runs regressions before creating a release',()=>{
 const nodeTest='node --test tests/*.test.*';
 assert.ok(validationWorkflow.includes(nodeTest));
 assert.ok(releaseWorkflow.includes(nodeTest),
   'Publisher must run all tests before gh release create');
 const idxTest=releaseWorkflow.indexOf(nodeTest);
 const idxCreate=releaseWorkflow.indexOf('gh release create');
 assert.ok(idxTest>=0&&idxCreate>idxTest,'CI gate must precede publishing');
 assert.ok(releaseWorkflow.includes('node --check sdr-glass.uc.js'));
 assert.ok(releaseWorkflow.includes('head -n 1 "$notes"'));
});
