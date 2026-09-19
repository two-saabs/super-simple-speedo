'use strict';
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const settle = async () => { for (let i=0;i<8;i++) await Promise.resolve(); };
async function settingsHarness(html, { native=false, status='prompt', ready='loading', ua='desktop', queryFails=false, noPermissions=false, nativeFails=false }={}) {
  const dom = new JSDOM(html, { url:'https://frenano.app/app/', runScripts:'outside-only', pretendToBeVisual:true });
  const w=dom.window, d=w.document, $=id=>d.getElementById(id), timers=[], calls={refresh:0,open:0,query:0};
  // Let jsdom finish its own parsing events before explicitly testing either readiness path.
  await new Promise(resolve=>d.readyState==='complete'?resolve():w.addEventListener('load',resolve,{once:true}));
  Object.defineProperty(d,'readyState',{value:ready,configurable:true});
  Object.defineProperty(d,'visibilityState',{value:'visible',configurable:true});
  Object.defineProperty(w.navigator,'userAgent',{value:ua,configurable:true});
  w.__SPEEDO_NATIVE_IOS__=native;
  let nativeStatus=status, geoCallbacks={};
  const permission=new w.EventTarget();permission.state=status;
  Object.defineProperty(w.navigator,'permissions',{value:noPermissions?undefined:{query:async options=>{assert.equal(options.name,'geolocation');calls.query++;if(queryFails)throw Error('unavailable');return permission;}}});
  const geo={watchPosition(success,error,options){geoCallbacks={success,error,options};return 17;},getCurrentPosition(success,error,options){geoCallbacks={success,error,options};}};
  Object.defineProperty(w.navigator,'geolocation',{value:geo});w.__SPEEDO_NATIVE_GEOLOCATION__=geo;
  w.__SPEEDO_NATIVE_PERMISSIONS__={refresh:async()=>{calls.refresh++;if(nativeFails)throw Error('unavailable');return nativeStatus;},openSettings:async()=>{calls.open++;}};
  w.setTimeout=(fn,delay)=>{timers.push({fn,delay});return timers.length;};w.clearTimeout=()=>{};
  // Exercise actual application accordion and close functions, without starting GPS/network loops.
  function functionSource(name) {const start=html.indexOf(`  function ${name}(`);assert.ok(start>=0,name);return html.slice(start,html.indexOf('\n  }',start)+4);}
  w.eval(`const $=id=>document.getElementById(id); const settingsModal=$('settingsModal'); ${['collapseAllSettingsSections','wireSettingsSections','openModal','closeModal'].map(functionSource).join('\n')}\nwireSettingsSections();collapseAllSettingsSections();$('settingsButton').addEventListener('click',()=>openModal(settingsModal));$('closeSettings').addEventListener('click',()=>closeModal(settingsModal));`);
  const ids=['speed-display-units-script','settings-redesign-v2-script','frenano-startup-flow-v5','ios-location-state-refresh-v1'];
  for(const id of ids){const script=$(id);if(script)w.eval(script.textContent);}
  if(ready==='loading')d.dispatchEvent(new w.Event('DOMContentLoaded'));
  await settle();
  return {w,d,$,calls,timers,permission,geo,dom,settle,
    setNativeStatus(value){nativeStatus=value;},
    async event(target,type){target.dispatchEvent(new w.Event(type));await settle();},
    async changePermission(value){permission.state=value;permission.dispatchEvent(new w.Event('change'));await settle();},
    gps(){return geoCallbacks;}, close(){dom.window.close();}
  };
}
function snapshot(h) {
  const modal=h.$('settingsModal').cloneNode(true);
  modal.querySelector('#appBuildTime')?.remove();
  // Version/build values are configuration; version layout and labels remain protected.
  for(const node of modal.querySelectorAll('.settings-footer .version,[data-settings-section="about"] .setting')) {
    node.innerHTML=node.innerHTML.replace(/(Version |Build )(?:\d+\.\d+(?:\.\d+)?|__APP_VERSION__)/g,'$1VERSION');
  }
  for(const node of [modal,...modal.querySelectorAll('*')]) {
    if(node.hasAttribute('class'))node.setAttribute('class',node.className.split(/\s+/).filter(Boolean).sort().join(' '));
    const attrs=[...node.attributes].sort((a,b)=>a.name.localeCompare(b.name));
    for(const attr of [...node.attributes])node.removeAttribute(attr.name);
    for(const attr of attrs)node.setAttribute(attr.name,attr.value);
  }
  return modal.outerHTML.replace(/\s+/g,' ').replace(/> </g,'><').trim();
}
function styles(html){
  const dom=new JSDOM(html);const d=dom.window.document;
  const settings=['settings-redesign-v2','settings-polish-v2'].map(id=>{const el=d.getElementById(id);assert.ok(el,id);return el.textContent.trim();});
  const close=[...d.querySelectorAll('style')].flatMap(el=>el.textContent.split('\n').filter(line=>/^\s*#settingsModal (\.sheet \{ position:relative;|h2 \{ padding-right:86px;|\.settings-top-close \{)/.test(line))).map(s=>s.trim());
  dom.window.close();return {settings,close};
}
module.exports={settingsHarness,snapshot,styles};
