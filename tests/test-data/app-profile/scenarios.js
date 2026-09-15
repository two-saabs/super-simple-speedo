"use strict";
// Normalized platform observations; missing/nonfinite inputs deliberately remain JS values.
const sample = (timestamp, speedKmh, extra = {}) => ({ type: "sample", sample: {
  latitude: 0, longitude: 0, timestamp, accuracy: 1,
  speedMps: speedKmh === null ? null : speedKmh / 3.6, ...extra
} });
const wait = ms => ({ type: "wait", ms });
const cases = [];
for (const gap of [15, 15.001, 20, 30, 30.001]) {
  for (const native of [null, 100]) cases.push({ name: `gap ${gap}s native ${native}`, events: [
    sample(0, 100), sample(gap * 1000, native, { latitude: .0001 }),
    sample(gap * 1000 + 1000, 100, { latitude: .0004 })
  ] });
}
for (const start of [5, 5.5, 5.999999, 6]) cases.push({ name: `derived start ${start}`, events: [
  sample(0, start), sample(10000, null, { latitude: .001 }),
  sample(15000, null, { latitude: .0015 }), sample(20000, null, { latitude: .002 })
] });
for (const speed of [6, 6.000001]) cases.push({ name: `driver exit boundary ${speed}`, events: [
  sample(0, 10), sample(1000, speed), wait(4999), wait(1), wait(6000)
] });
for (const [name, tail] of [
  ["delayed callback without sample", [wait(8000)]],
  ["repeated low does not restart", [sample(2000, 5), wait(5000)]],
  ["midband keeps timer but callback uses latest speed", [sample(2000, 8), wait(5000), sample(3000, 6), wait(5000)]],
  ["entry cancels", [sample(2000, 10), wait(5000), sample(3000, 6), wait(5000)]],
  ["inactive callback keeps driver active", [{ type: "watch", active: false }, wait(5000), sample(2000, 6, { watchActive: false }), sample(3000, 6, { watchActive: false })]],
  ["inactive process cancels", [sample(2000, 6, { watchActive: false }), wait(5000)]],
  ["reset cancels", [{ type: "reset" }, wait(5000), sample(0, 6)]]
]) cases.push({ name, events: [sample(0, 10), sample(1000, 6), ...tail] });
for (const [name, events] of [
  ["recovery beats derived and exempts contradiction", [sample(0, 0), sample(1000, null, { transitRecoveryKmh: 40 })]],
  ["native beats recovery", [sample(0, 12, { transitRecoveryKmh: 80 })]],
  ["recovery two confirmations", [sample(0, null, { transitRecoveryKmh: 100 }), sample(1000, null, { transitRecoveryKmh: 105 })]],
  ["recovery jump two confirmations", [sample(0, 10), sample(1000, null, { transitRecoveryKmh: 100 }), sample(2000, null, { transitRecoveryKmh: 105 })]],
  ["recovery short segment", [sample(0, 0), sample(100, null, { transitRecoveryKmh: 30 })]],
  ["recovery long gap and fallback", [sample(0, 0), sample(30001, null, { transitRecoveryKmh: 30 }), sample(40001, null, { latitude: .001, transitRecoveryKmh: null })]],
  ["missing recovery fallback", [sample(0, 6), sample(10000, null, { latitude: .001 })]]
]) cases.push({ name, events });
for (const accuracy of [undefined, null, "8", NaN, Infinity, 0, 50, 80, 81]) {
  cases.push({ name: `accuracy ${String(accuracy)}`, events: [sample(0, 36, { accuracy }), sample(1000, 43.2, { accuracy }), sample(11000, null, { latitude: .001, accuracy: 1 })] });
  cases.push({ name: `previous accuracy ${String(accuracy)}`, events: [sample(0, 0, { accuracy }), sample(10000, null, { latitude: .001, accuracy: 50 })] });
}
for (const speedMps of [Infinity, -1, NaN, null, "10", undefined]) cases.push({ name: `raw ${String(speedMps)}`, events: [
  sample(0, null, { speedMps, transitRecoveryKmh: 20 }), sample(1000, null, { speedMps, latitude: .0001 })
] });
for (const latitude of [0, 47.3769, 85, -47.3769]) cases.push({ name: `exact distance latitude ${latitude}`, events: [
  sample(0, 6, { latitude, longitude: 8.5417 }),
  sample(10000, null, { latitude: latitude + .001, longitude: 8.5427 }),
  sample(20000, null, { latitude: latitude + .00144966, longitude: 8.5427, accuracy: 20 })
] });
cases.push({ name: "raw timestamp representation", events: [sample("1000", 6), sample("11000", null, { latitude: .001 }), sample(undefined, null)] });
module.exports = cases;
