#!/usr/bin/env node
'use strict';

const fs = require('fs');

const settingsPath = 'build/settings-redesign.js';
const polishPath = 'build/settings-polish.js';
const helpPath = 'build/help-contact-privacy-fix.js';
const statisticsPath = 'build/usage-statistics.js';
const speedDisplayPath = 'build/speed-display-units.js';
const failures = [];

function pass(message) { console.log(`PASS  ${message}`); }
function fail(message) { failures.push(message); console.error(`FAIL  ${message}`); }
function requireCondition(name, condition) { condition ? pass(name) : fail(name); }

const settings = fs.readFileSync(settingsPath, 'utf8');
const polish = fs.existsSync(polishPath) ? fs.readFileSync(polishPath, 'utf8') : '';
const help = fs.existsSync(helpPath) ? fs.readFileSync(helpPath, 'utf8') : '';
requireCondition('usage statistics has a focused build owner', fs.existsSync(statisticsPath));
requireCondition('Settings redesign does not own statistics state', !settings.includes('maxSpeed: 0, roadsIdentified: 0'));
requireCondition('Settings redesign does not record maximum speed', !settings.includes('candidateKmh > (state.stats.maxSpeed || 0)'));
requireCondition('Settings redesign does not count identified roads', !settings.includes('state.stats.roadsIdentified = (state.stats.roadsIdentified || 0) + 1'));

requireCondition('speed display units has a focused build owner', fs.existsSync(speedDisplayPath));
requireCondition('Settings redesign does not convert displayed speed', !settings.includes('shown * 0.621371'));
requireCondition('Settings redesign does not convert displayed speed limits', !settings.includes('nextLimit * 0.621371'));
requireCondition('Settings redesign does not own dial maximum conversion', !settings.includes('const base = mphMode ? 160.9344 : 160'));
requireCondition('Settings redesign does not own dial tick conversion', !settings.includes('const tickStep = mphMode ? 16.09344 : 10'));
requireCondition('Settings redesign does not own speed unit preference', !settings.includes("const unitKey = 'speedUnits'"));
requireCondition('Settings redesign does not install unit controls', !settings.includes('function installUnitsSetting'));
const speedDisplay = fs.readFileSync(speedDisplayPath, 'utf8');
requireCondition('Speed display owner owns speed unit preference', speedDisplay.includes("const unitKey = 'speedUnits'"));
requireCondition('Speed display owner installs unit controls', speedDisplay.includes('function installUnitsSetting'));

// Task 4 target: all Settings presentation, location controls, help/privacy
// presentation and footer have one owner. Focused non-Settings behavior remains
// outside this transform.
requireCondition('Settings redesign owns final location controls', settings.includes('function installLocationSetting'));
requireCondition('Settings redesign owns final Settings footer', settings.includes("footer.className = 'settings-footer'"));
requireCondition('Settings redesign owns final diagnostic help copy', settings.includes('Share a privacy-safe diagnostic log to help us understand what happened.'));
requireCondition('Settings redesign owns Help & privacy presentation', settings.includes('Help & privacy'));
requireCondition('Settings redesign owns feedback presentation', settings.includes('Questions, ideas or suggestions are always welcome'));
requireCondition('Settings redesign owns privacy-policy presentation', settings.includes('Read privacy policy'));
requireCondition('Historical Settings polish transform is retired', !fs.existsSync(polishPath));
requireCondition('Historical help/privacy Settings transform is retired', !fs.existsSync(helpPath));

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'}: ${failures.length} build ownership failure(s)`);
process.exit(failures.length ? 1 : 0);
