#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const candidatePath = process.argv[2] || 'index.template.html';
const baselinePath = process.argv[3] || null;

function stop(message, exitCode = 2) {
  console.error(`ERROR ${message}`);
  process.exit(exitCode);
}

if (!fs.existsSync(candidatePath)) {
  stop(`Cannot find ${candidatePath}`);
}

const read = filePath => fs.readFileSync(filePath, 'utf8');
const candidate = read(candidatePath);
const failures = [];
const warnings = [];

const pass = message => console.log(`PASS  ${message}`);
const fail = message => {
  failures.push(message);
  console.error(`FAIL  ${message}`);
};
const warn = message => {
  warnings.push(message);
  console.warn(`WARN  ${message}`);
};
const has = (text, pattern) => (
  typeof pattern === 'string' ? text.includes(pattern) : pattern.test(text)
);

console.log(`\nSuper Simple Speedo quality gate`);
console.log(`Checking: ${path.resolve(candidatePath)}\n`);

const contracts = [
  ['HTML document declaration exists', /<!doctype\s+html>/i],
  ['page title remains Super Simple Speedo', /<title>\s*Super Simple Speedo\s*<\/title>/i],
  ['viewport remains mobile friendly', /<meta[^>]+name=["']viewport["']/i],
  ['UTC timestamp is logged', /timeUtc\s*:/],
  ['local timestamp is logged', /timeLocal\s*:/],
  ['IANA timezone is logged', /timeZone\s*[,}:]/],
  ['timezone is detected from the device', /resolvedOptions\(\)\.timeZone/],
  ['diagnostic schema is versioned', /DIAGNOSTIC_SCHEMA_VERSION\s*=\s*1/],
  ['required diagnostic fields are declared', /DIAGNOSTIC_REQUIRED_FIELDS\s*=\s*\[[^\]]*["']schemaVersion["'][^\]]*["']timeUtc["'][^\]]*["']timeLocal["'][^\]]*["']timeZone["'][^\]]*\]/s],
  ['diagnostic entries are validated', /function\s+validateDiagnosticEntry\s*\(/],
  ['diagnostic entries use one creation function', /function\s+makeDiagnosticEntry\s*\(/],
  ['diagnostic self-test exists', /function\s+runDiagnosticContractSelfTest\s*\(/],
  ['diagnostic self-test runs', /runDiagnosticContractSelfTest\(\);/],
  ['copy refuses malformed logs', /invalidEntries\s*=\s*state\.diagnosticLog\.filter/],
  ['wake-lock logging remains present', /event:\s*["']WAKE_LOCK["']/],
  ['road-lookup logging remains present', /event:\s*["']ROAD_LOOKUP["']/],
  ['speed decisions remain logged', /speedDecision\s*:/],
  ['display decisions remain logged', /displayDecision\s*:/],
  ['reason codes remain logged', /(?:reasons\s*:|\breasons\s*[},])/],
  ['driver UI state remains logged', /driverUiActive\s*:/],
  ['diagnostic history persists across sessions', /DIAGNOSTIC_STORAGE_KEY\s*=\s*["']speedoDiagnosticLogV1["']/],
  ['diagnostic history cap is 1200 entries', /DIAGNOSTIC_MAX_ENTRIES\s*=\s*1200/],
  ['diagnostic history trims to configured cap', /slice\(-DIAGNOSTIC_MAX_ENTRIES\)/],
  ['diagnostic history is written to local storage', /localStorage\.setItem\(\s*DIAGNOSTIC_STORAGE_KEY/],
  ['diagnostic session markers remain logged', /event:\s*["']DIAGNOSTIC_SESSION["']/],
  ['clearing diagnostics clears persisted history', /localStorage\.removeItem\(DIAGNOSTIC_STORAGE_KEY\)/],
  ['speed-limit button shell remains transparent', /#limitButton\s*\{[^}]*background:\s*transparent/s],
  ['transport detective remains experimental', /id=["']experimentalTransportSetting["'][^>]*aria-hidden=["']true["']/],
  ['transport detective defaults off', /transportDetectiveEnabled:\s*localStorage\.getItem\(["']transportDetectiveEnabled["']\)\s*===\s*["']true["']/],
  ['transport detective has a user toggle', /id=["']transportDetectiveSwitch["']/],
  ['transport detective logs mode changes', /event:\s*["']TRANSPORT_GUESS["']/],
  ['transport badge remains bottom positioned', /#transportBadge\s*\{[^}]*bottom:/s],
  ['compact copied log is capped at 300 lines', /COMPACT_LOG_MAX_LINES\s*=\s*300/],
  ['transport confidence metrics are visible in experimental mode', /id=["']transportMetrics["']/],
  ['live intelligence hides wake-lock housekeeping', /filter\(item => Boolean\(item\.event\) && item\.event !== ["']WAKE_LOCK["']\)/],
  ['transport confidence exposes real classifier inputs', /confirmedRoadPct/],
  ['transport detective can classify buses', /bus:\s*["']🚌 Bus-like["']/],
  ['transport detective can classify walking', /walking:\s*["']🚶 Walking["']/],
  ['transport unknown state uses generic Thinking copy', /unknown:\s*["']🧭 Thinking…["']/],
  ['transport classifier scores walking plus all four vehicle families', /scores\s*=\s*\{[\s\S]*walking:[\s\S]*bus:[\s\S]*car:[\s\S]*tram:[\s\S]*train:/],
  ['walking uses a short recent window', /WALKING_WINDOW_MS\s*=\s*90\s*\*\s*1000/],
  ['walking requires sustained pedestrian evidence', /walkingSpanMs\s*<\s*WALKING_MIN_DURATION_MS[\s\S]*walkingConsistency\s*<\s*\.75/],
  ['walking starts a new journey segment', /mode\s*===\s*["']walking["'][\s\S]*state\.transportSamples\s*=\s*walkingSamples/],
  ['bus score combines road and stop evidence', /bus:\s*clamp01\(confirmedRoadRatio[\s\S]*stopScore/],
  ['tram is penalised by strong road confirmation', /confirmedRoadRatio\s*>=\s*\.65[\s\S]*scores\.tram\s*\*=\s*\.55/],
  ['transport mode changes use hysteresis', /winningScore\s*-\s*previousScore\s*<\s*\.12/],
  ['v13 persistent archive uses IndexedDB', /indexedDB\.open\(DIAGNOSTIC_ARCHIVE_DB/],
  ['v13 diagnostics archive retains 30 days', /DIAGNOSTIC_ARCHIVE_DAYS\s*=\s*30/],
  ['v13 full archive can be downloaded', /getArchivedDiagnostics\(\)/],
  ['v13 ground truth controls exist', /data-ground-truth=["']train["']/],
  ['v13 ground truth is logged', /event:\s*["']GROUND_TRUTH["']/],
  ['v13 tram timetable category T is recognised', /cat === ["']T["'][\s\S]*return ["']tram["']/],
  ['v13 S-Bahn labels preserve the S prefix', /mode === ["']train["'][\s\S]*\["S", ["']SN["']\][\s\S]*`\$\{category\}\$\{number\}`/],
  ['v13 rail recovery uses a long GPS baseline', /TRANSIT_SPEED_RECOVERY_MIN_BASELINE_MS\s*=\s*8000[\s\S]*deriveTransitLongBaselineSpeed/],
  ['v13 rail recovery requires strong rail context', /hasStrongRailTransitContext[\s\S]*candidate\.confidence >= \.55/],
  ['v13 busy stationboards request enough services', /TRANSIT_STATIONBOARD_LIMIT\s*=\s*60/],
  ['v13 transit diagnostics record raw board services', /outcome:\s*["']BOARD_SERVICES["']/],
  ['v13 timetable matching uses Swiss transport API', /transport\.opendata\.ch\/v1\/stationboard/],
  ['v13 coordinate stop search is present', /transport\.opendata\.ch\/v1\/locations/],
  ['v13 timetable evidence boosts classifier', /scores\[transitCandidate\.mode\][\s\S]*transitCandidate\.confidence/],
  ['v13 transit matches are logged', /event:\s*["']TRANSIT_MATCH["']/],
  ['settings sections are collapsible', /class=["']settings-section-header["']/],
  ['settings sections collapse by default', /aria-expanded=["']false["']/],
  ['settings accordion wiring remains present', /function\s+wireSettingsSections\s*\(/],
  ['copy-log control remains wired', /copyDiagnostics[^\n]*addEventListener/],
  ['clear-log control remains wired', /clearDiagnostics[^\n]*addEventListener/],
  ['privacy section remains present', /\bPrivacy\b/i],
  ['about section remains present', /\bAbout\b/i],
  ['free promise remains present', /(?:free\s+forever|always\s+free)/i],
  ['no-ads promise remains present', /no\s+ads/i],
  ['no-account promise remains present', /no\s+account/i],
  ['driver responsibility wording remains present', /responsibility\s+of\s+the\s+driver/i]
];

for (const [name, pattern] of contracts) {
  has(candidate, pattern) ? pass(name) : fail(name);
}

if (/timeZone:\s*["']Europe\/(?:Zurich|Berlin|Rome)["']/.test(candidate)) {
  fail('timezone must not be hard-coded');
} else {
  pass('timezone is not hard-coded');
}

if (/Google Analytics|googletagmanager|gtag\s*\(/i.test(candidate)) {
  fail('unexpected analytics code detected');
} else {
  pass('no Google Analytics code detected');
}

if (/\b(?:TODO|FIXME)\b/.test(candidate)) {
  warn('TODO or FIXME marker remains in the production template');
}

function setOfMatches(text, regex, group = 1) {
  const output = new Set();
  for (const match of text.matchAll(regex)) output.add(match[group]);
  return output;
}

function removed(before, after) {
  return [...before].filter(value => !after.has(value)).sort();
}

if (baselinePath) {
  if (!fs.existsSync(baselinePath)) stop(`Cannot find baseline ${baselinePath}`);
  const baseline = read(baselinePath);

  const comparisons = [
    ['DOM ids', /\bid=["']([^"']+)["']/g],
    ['localStorage contracts', /localStorage\.(?:getItem|setItem)\(["']([^"']+)["']/g],
    ['diagnostic event types', /event:\s*["']([A-Z0-9_]+)["']/g]
  ];

  for (const [label, regex] of comparisons) {
    const removedItems = removed(setOfMatches(baseline, regex), setOfMatches(candidate, regex));
    removedItems.length
      ? fail(`${label} removed since baseline: ${removedItems.join(', ')}`)
      : pass(`no baseline ${label.toLowerCase()} were removed`);
  }
}

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'}: ${failures.length} failure(s), ${warnings.length} warning(s)`);
process.exit(failures.length ? 1 : 0);
