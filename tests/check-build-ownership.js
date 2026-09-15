#!/usr/bin/env node
'use strict';

const fs = require('fs');

const settingsPath = 'build/settings-redesign.js';
const statisticsPath = 'build/usage-statistics.js';
const speedDisplayPath = 'build/speed-display-units.js';
const failures = [];

function pass(message) { console.log(`PASS  ${message}`); }
function fail(message) { failures.push(message); console.error(`FAIL  ${message}`); }
function requireCondition(name, condition) { condition ? pass(name) : fail(name); }

const settings = fs.readFileSync(settingsPath, 'utf8');
requireCondition('usage statistics has a focused build owner', fs.existsSync(statisticsPath));
requireCondition('Settings redesign does not own statistics state', !settings.includes('maxSpeed: 0, roadsIdentified: 0'));
requireCondition('Settings redesign does not record maximum speed', !settings.includes('candidateKmh > (state.stats.maxSpeed || 0)'));
requireCondition('Settings redesign does not count identified roads', !settings.includes('state.stats.roadsIdentified = (state.stats.roadsIdentified || 0) + 1'));

requireCondition('speed display units has a focused build owner', fs.existsSync(speedDisplayPath));
requireCondition('Settings redesign does not convert displayed speed', !settings.includes('shown * 0.621371'));
requireCondition('Settings redesign does not convert displayed speed limits', !settings.includes('nextLimit * 0.621371'));
requireCondition('Settings redesign does not own dial maximum conversion', !settings.includes('const base = mphMode ? 160.9344 : 160'));
requireCondition('Settings redesign does not own dial tick conversion', !settings.includes('const tickStep = mphMode ? 16.09344 : 10'));

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'}: ${failures.length} build ownership failure(s)`);
process.exit(failures.length ? 1 : 0);
