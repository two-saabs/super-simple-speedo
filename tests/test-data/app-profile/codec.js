"use strict";
// Preserve nonfinite values and undefined in JSON snapshots and VM realm comparisons.
exports.encode = value => JSON.parse(JSON.stringify(value, (_key, item) =>
  item === undefined ? { $number: "undefined" } : typeof item === "number" && !Number.isFinite(item)
    ? { $number: String(item) } : item));
