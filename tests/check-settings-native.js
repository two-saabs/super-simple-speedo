#!/usr/bin/env node
'use strict';
// Characterises the shipped Settings DOM and permission lifecycle. A missing row,
// changed diagnostic copy, altered status transition, or extra native request fails.
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const {settingsHarness,snapshot,styles}=require('./helpers/settings-harness');
const html=fs.readFileSync(process.argv[2]||'index.template.html','utf8');
const {injectSupportDiagnostics}=require('../build/support-diagnostics');
const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/settings/shipped.json'),'utf8'));
async function run(){
 assert.deepEqual(styles(html),fixture.styles,'shipped Settings and Close CSS');
 for(const native of [false,true])for(const ready of ['loading','complete']){
  const h=await settingsHarness(html,{native,ready});
  let expected=fixture[native?'ios':'web'];
  // Stable-channel hidden flags are build configuration, not template ownership.
  if(html.includes('__APP_VERSION__'))for(const section of ['audio','advanced-and-experimental-features'])expected=expected.replace(`<div aria-hidden="true" class="hidden-element open settings-section" data-settings-section="${section}">`,`<div class="open settings-section" data-settings-section="${section}">`);
  assert.equal(snapshot(h),expected,'complete shipped Settings DOM');
  const sectionNames=[...h.$('settingsModal').querySelectorAll('[data-settings-section]')].map(e=>e.dataset.settingsSection);
  assert.deepEqual(sectionNames,['audio','display','statistics','about','privacy','advanced-and-experimental-features']);
  for(const name of ['audio','statistics','about','advanced-and-experimental-features'])assert.equal(h.w.getComputedStyle(h.$('settingsModal').querySelector(`[data-settings-section="${name}"]`)).display,'none');
  assert.equal(h.w.getComputedStyle(h.$('settingsModal').querySelector('.settings-section-header')).pointerEvents,'none');
  const version=html.includes('__APP_VERSION__')?'__APP_VERSION__':require('../version.json').version;
  assert.equal(h.$('settingsModal').querySelector('.settings-footer .version').textContent,native?`Version 1.0 · Build ${version}`:`Version ${version}`);
  assert.equal(h.$('locationPermissionLabel').textContent,'Off — location is needed to measure your speed');
  assert.equal(h.$('locationPermissionAction').textContent,native?'Manage':'How to change');
  assert.equal(h.$('settingsModal').querySelectorAll('.settings-top-close').length,1);
  h.$('settingsButton').click();await h.settle();assert.equal(h.$('settingsModal').getAttribute('aria-hidden'),'false');
  h.$('settingsModal').querySelector('.settings-top-close').click();assert.equal(h.$('settingsModal').getAttribute('aria-hidden'),'true');
  h.$('locationPermissionAction').click();await h.settle();
  if(native){assert.equal(h.calls.open,1);assert.ok(!h.$('locationPermissionHelp').classList.contains('show'));}
  else{assert.ok(h.$('locationPermissionHelp').classList.contains('show'));h.$('locationPermissionAction').click();assert.ok(!h.$('locationPermissionHelp').classList.contains('show'));}
  h.close();
 }
 for(const native of [false,true])for(const status of ['granted','denied','prompt','prompt-with-rationale','unknown']){
  const h=await settingsHarness(html,{native,status});
  const label=status==='granted'?'On — Frenano can use your location':status==='denied'?'Off in Settings':status.startsWith('prompt')?'Off — location is needed to measure your speed':native?'Checking location…':'Check browser location settings';
  assert.equal(h.$('locationPermissionLabel').textContent,label);
  assert.equal(h.$('locationPermissionStatus').classList.contains('granted'),status==='granted');
  assert.equal(h.$('locationPermissionStatus').classList.contains('denied'),status==='denied');
  assert.equal(h.$('locationPermissionAction').textContent,native?(status==='denied'?'Open Settings':'Manage'):'How to change');
  assert.equal(h.calls.refresh,native?2:0,'two shipped Settings initialization refreshes retained');
  assert.equal(h.calls.query,native?0:2);
  assert.equal(h.geo.__frenanoWrapped,native?undefined:true);
  if(native){h.setNativeStatus('granted');await h.event(h.w,'pageshow');assert.equal(h.calls.refresh,3);assert.equal(h.$('locationPermissionLabel').textContent,'On — Frenano can use your location');}
  h.close();
 }
 for(const method of ['watchPosition','getCurrentPosition']){
  const h=await settingsHarness(html);let success,error;const options={enableHighAccuracy:true};
  const result=h.geo[method](p=>success=p,e=>error=e,options);if(method==='watchPosition')assert.equal(result,17);
  assert.equal(h.gps().options,options);const position={coords:{latitude:47,longitude:8}};h.gps().success(position);assert.equal(success,position);
  assert.equal(h.$('locationPermissionLabel').textContent,'On — Frenano can use your location');
  await h.changePermission('prompt');assert.equal(h.$('locationPermissionLabel').textContent,'On — Frenano can use your location');
  h.gps().error({code:2});assert.equal(error.code,2);assert.equal(h.$('locationPermissionLabel').textContent,'On — Frenano can use your location');
  h.gps().error({code:1});assert.equal(error.code,1);assert.equal(h.$('locationPermissionLabel').textContent,'Off in Settings');
  await h.changePermission('granted');assert.equal(h.$('locationPermissionLabel').textContent,'On — Frenano can use your location');
  await h.changePermission('denied');assert.equal(h.$('locationPermissionLabel').textContent,'Off in Settings');
  h.close();
 }
 for(const options of [{queryFails:true},{noPermissions:true},{native:true,nativeFails:true}]){
  const h=await settingsHarness(html,options);assert.equal(h.$('locationPermissionLabel').textContent,options.native?'Checking location…':'Check browser location settings');h.close();
 }
 for(const [ua,help] of [['iPhone','In Safari, open Website Settings for Frenano and choose Location. You can also review Safari location access in iPhone Settings.'],['Android','Open your browser’s site settings for Frenano and choose Location.'],['desktop','Open your browser’s site permissions for Frenano and choose Location.']]){
  const h=await settingsHarness(html,{ua});assert.equal(h.$('locationPermissionHelp').textContent,help);h.close();
 }
 // This independent Settings refresh lifecycle intentionally remains separate. It updates
 // the row but not Manage/Open Settings; do not consolidate it in this migration.
 assert.ok(html.includes('id="ios-location-state-refresh-v1"'),'native Settings owns the ongoing refresh runtime');
 {
  const h=await settingsHarness(html,{native:true});h.setNativeStatus('denied');h.$('settingsButton').click();await h.settle();
  assert.equal(h.calls.refresh,3);assert.equal(h.$('locationPermissionLabel').textContent,'Off in Settings');assert.equal(h.$('locationPermissionAction').textContent,'Manage');
  assert.deepEqual(h.timers.map(t=>t.delay),[180]);await h.timers.shift().fn();await h.settle();assert.equal(h.calls.refresh,4);
  await h.event(h.d,'visibilitychange');assert.equal(h.calls.refresh,6);assert.equal(h.$('locationPermissionAction').textContent,'Open Settings');
  assert.deepEqual(h.timers.map(t=>t.delay),[180]);h.timers.length=0;await h.event(h.w,'focus');assert.deepEqual(h.timers.map(t=>t.delay),[80]);h.close();
 }
 // Execute the real support formatter and button binding against the final row.
 const diagnosticHtml=html.includes('const SUPPORT_REPORT_MAX_EVENTS')?html:injectSupportDiagnostics(html,{appVersion:require('../version.json').version,buildChannel:'stable',experimentalFeatures:false,speedBrainVersion:'1.0.0'});
 const supportCode=diagnosticHtml.match(/  const SUPPORT_REPORT_MAX_EVENTS = 150;[\s\S]*?(?=  function updateDiagnosticsDisplay)/)[0];
 for(const mode of ['share','copy','cancel','fallback','unavailable']){
  const h=await settingsHarness(html);const shared=[],copied=[];
  if(mode!=='copy')h.w.navigator.share=async payload=>{if(mode==='cancel')throw {name:'AbortError'};if(mode==='fallback'||mode==='unavailable')throw Error('share unavailable');shared.push(payload);};
  h.w.navigator.canShare=()=>false;
  h.w.navigator.clipboard={writeText:async text=>{if(mode==='unavailable')throw Error('clipboard unavailable');copied.push(text);}};
  h.w.eval(`(()=>{const $=id=>document.getElementById(id);const state={diagnosticLog:[{event:'SPEED',timeUtc:'2026-09-19T12:00:00Z',displayedKmh:42,latitude:'PRIVATE_COORD',roadName:'PRIVATE_ROAD',apiKey:'PRIVATE_KEY'}]};${supportCode}})();`);
  assert.equal(shared.length+copied.length,0,'nothing shared automatically');
  h.$('shareSupportDiagnostics').click();await h.settle();
  const status={share:'Shared from this device · nothing uploaded automatically',copy:'Sanitised diagnostic log copied to clipboard',cancel:'Nothing is uploaded automatically.',fallback:'Share unavailable · diagnostic log copied instead',unavailable:'Could not open sharing on this device'}[mode];
  assert.equal(h.$('supportDiagnosticsStatus').textContent,status);
  if(mode==='share'||mode==='copy'||mode==='fallback'){
   const text=mode==='share'?shared[0].text:copied[0];assert.ok(text.includes('# privacy=sanitised'));assert.doesNotMatch(text,/PRIVATE_COORD|PRIVATE_ROAD|PRIVATE_KEY/);
  }
  h.close();
 }
 console.log('PASS Settings: shipped DOM/CSS, sections, help/privacy, statistics, Units, Close, footer and web/iOS permission lifecycle');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
