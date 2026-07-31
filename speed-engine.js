"use strict";

const DEFAULTS = Object.freeze({
  driverModeEnterSpeed: 10,
  driverModeExitSpeed: 5,
  baselineResetSeconds: 15,
  maxDisplayedSpeed: 260
});

function createSpeedState() {
  return {
    lastGpsSample: null,
    lastAcceptedSpeed: 0,
    lastSpeedTimestamp: null,
    pendingSpeedCandidate: null,
    targetSpeed: 0,
    driverModeActive: false
  };
}

function haversineMetres(a, b) {
  const radius = 6371000;
  const toRadians = value => value * Math.PI / 180;
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = lat2 - lat1;
  const deltaLon = toRadians(b.longitude - a.longitude);
  const h = Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function updateDriverMode(state, speedKmh, config) {
  if (!state.driverModeActive && speedKmh >= config.driverModeEnterSpeed) {
    state.driverModeActive = true;
  } else if (state.driverModeActive && speedKmh <= config.driverModeExitSpeed) {
    state.driverModeActive = false;
  }
}

function processSpeedSample(state, sample, options = {}) {
  if (!state || typeof state !== "object") throw new TypeError("state is required");
  if (!sample || typeof sample !== "object") throw new TypeError("sample is required");

  const config = { ...DEFAULTS, ...options };
  const previousGps = state.lastGpsSample;
  const sampleTime = Number(sample.timestamp);
  const accuracy = Number.isFinite(sample.accuracy) ? sample.accuracy : 0;
  const rawKmh = Number.isFinite(sample.speedMps) && sample.speedMps >= 0
    ? sample.speedMps * 3.6
    : null;

  let derivedKmh = null;
  let elapsedSeconds = null;
  let movedMetres = null;
  let baselineReset = false;

  if (previousGps) {
    elapsedSeconds = Math.max(0.001, (sampleTime - previousGps.timestamp) / 1000);
    movedMetres = haversineMetres(previousGps, sample);
    if (elapsedSeconds > config.baselineResetSeconds) {
      baselineReset = true;
    } else if (elapsedSeconds > 0.35) {
      derivedKmh = movedMetres / elapsedSeconds * 3.6;
    }
  }

  let candidateKmh = rawKmh;
  if (candidateKmh === null && derivedKmh !== null) candidateKmh = derivedKmh;
  if (candidateKmh !== null && candidateKmh < 1.8) candidateKmh = 0;

  let decision = baselineReset ? "RESET_BASELINE" : "NO_SPEED";
  const reasons = [];
  const previousAcceptedKmh = state.lastAcceptedSpeed ?? 0;

  if (baselineReset) {
    state.pendingSpeedCandidate = null;
    state.lastSpeedTimestamp = null;
    reasons.push("LONG_LOCATION_GAP");
  } else if (previousGps && elapsedSeconds <= 0.35) {
    reasons.push("ELAPSED_TIME_TOO_SHORT");
  } else if (rawKmh === null && derivedKmh === null) {
    reasons.push("SPEED_NOT_AVAILABLE");
  }

  if (candidateKmh !== null && Number.isFinite(candidateKmh)) {
    const previousSpeed = previousAcceptedKmh;
    const acceptedElapsed = state.lastSpeedTimestamp === null
      ? null
      : Math.max(0.1, (sampleTime - state.lastSpeedTimestamp) / 1000);
    const poorAccuracy = accuracy > 80;
    const implausibleAbsoluteSpeed = candidateKmh > config.maxDisplayedSpeed;
    const derivedOnly = rawKmh === null && derivedKmh !== null;
    const previousAccuracy = Number.isFinite(previousGps?.accuracy) ? previousGps.accuracy : accuracy;
    const combinedAccuracy = Math.max(accuracy, previousAccuracy || 0);
    const strongMovementContradiction = !poorAccuracy && accuracy <= 50 &&
      derivedKmh !== null && candidateKmh > 35 && derivedKmh < Math.max(8, candidateKmh * 0.25);
    const implausibleJump = acceptedElapsed !== null &&
      Math.abs(candidateKmh - previousSpeed) > Math.max(45, acceptedElapsed * 55);
    const uncertainDerivedMovement = derivedOnly && candidateKmh >= config.driverModeEnterSpeed &&
      movedMetres !== null && movedMetres < Math.max(50, combinedAccuracy * 2.5);
    const unconfirmedStartFromStationary = derivedOnly && previousSpeed < config.driverModeExitSpeed &&
      candidateKmh >= config.driverModeEnterSpeed;
    const suddenDerivedStop = derivedOnly && previousSpeed >= config.driverModeEnterSpeed &&
      candidateKmh <= 2 && acceptedElapsed !== null && acceptedElapsed < 2.5;

    if (poorAccuracy) reasons.push("POOR_POSITION_ACCURACY");
    if (implausibleAbsoluteSpeed) reasons.push("ABSOLUTE_SPEED_LIMIT");
    if (strongMovementContradiction) reasons.push("MOVEMENT_CONTRADICTION");
    if (implausibleJump) reasons.push("LARGE_SPEED_JUMP");
    if (uncertainDerivedMovement) reasons.push("GPS_DISPLACEMENT_UNCERTAIN");
    if (unconfirmedStartFromStationary) reasons.push("START_FROM_STATIONARY_UNCONFIRMED");
    if (suddenDerivedStop) reasons.push("STOP_UNCONFIRMED");

    const needsConfirmation = !implausibleAbsoluteSpeed && (
      implausibleJump || uncertainDerivedMovement || unconfirmedStartFromStationary ||
      suddenDerivedStop || (state.lastSpeedTimestamp === null && candidateKmh > 80)
    );
    let confirmed = !needsConfirmation;

    if (needsConfirmation) {
      const pending = state.pendingSpeedCandidate;
      const tolerance = Math.max(15, candidateKmh * 0.35);
      let directionConsistent = true;

      if (derivedOnly && pending?.segment && previousGps) {
        const metresPerLat = 111320;
        const metresPerLon = metresPerLat * Math.cos(sample.latitude * Math.PI / 180);
        const oldX = (pending.segment.toLon - pending.segment.fromLon) * metresPerLon;
        const oldY = (pending.segment.toLat - pending.segment.fromLat) * metresPerLat;
        const newX = (sample.longitude - previousGps.longitude) * metresPerLon;
        const newY = (sample.latitude - previousGps.latitude) * metresPerLat;
        const oldLength = Math.hypot(oldX, oldY);
        const newLength = Math.hypot(newX, newY);
        if (oldLength > 3 && newLength > 3) {
          directionConsistent = (oldX * newX + oldY * newY) / (oldLength * newLength) > 0;
        }
      }

      if (!directionConsistent) reasons.push("INCONSISTENT_DIRECTION");

      if (pending && sampleTime - pending.timestamp < 7000 &&
          Math.abs(candidateKmh - pending.kmh) <= tolerance && directionConsistent) {
        pending.count += 1;
        pending.kmh = (pending.kmh + candidateKmh) / 2;
        pending.timestamp = sampleTime;
        pending.segment = previousGps ? {
          fromLat: previousGps.latitude,
          fromLon: previousGps.longitude,
          toLat: sample.latitude,
          toLon: sample.longitude
        } : null;
        confirmed = pending.count >= (derivedOnly ? 3 : 2);
      } else {
        state.pendingSpeedCandidate = {
          kmh: candidateKmh,
          timestamp: sampleTime,
          count: 1,
          segment: previousGps ? {
            fromLat: previousGps.latitude,
            fromLon: previousGps.longitude,
            toLat: sample.latitude,
            toLon: sample.longitude
          } : null
        };
      }

      if (!confirmed) reasons.push("AWAITING_CONFIRMATION");
    } else {
      state.pendingSpeedCandidate = null;
    }

    if (strongMovementContradiction) confirmed = false;

    if (!implausibleAbsoluteSpeed && confirmed) {
      state.lastAcceptedSpeed = candidateKmh;
      state.lastSpeedTimestamp = sampleTime;
      state.targetSpeed = Math.min(config.maxDisplayedSpeed, candidateKmh);
      decision = needsConfirmation ? "ACCEPTED_CONFIRMED" : "ACCEPTED";
      updateDriverMode(state, candidateKmh, config);
    } else {
      state.targetSpeed = previousSpeed;
      decision = implausibleAbsoluteSpeed || strongMovementContradiction ? "REJECTED" : "HELD";
      updateDriverMode(state, previousSpeed, config);
    }
  } else {
    updateDriverMode(state, state.lastAcceptedSpeed, config);
  }

  const displayDecision = state.targetSpeed === 0 && derivedKmh !== null && derivedKmh >= config.driverModeEnterSpeed
    ? "HELD_AT_ZERO"
    : state.targetSpeed === previousAcceptedKmh && decision === "HELD"
      ? "HELD_PREVIOUS_SPEED"
      : "UPDATED";
  const displayReasons = [];
  if (displayDecision === "HELD_AT_ZERO" && rawKmh !== null && rawKmh < config.driverModeEnterSpeed) {
    displayReasons.push("NATIVE_SPEED_INDICATES_STATIONARY");
  }
  if (displayDecision === "HELD_AT_ZERO" && derivedKmh !== null) {
    displayReasons.push("DERIVED_SPEED_NOT_USED_FOR_DISPLAY");
  }

  state.lastGpsSample = {
    latitude: sample.latitude,
    longitude: sample.longitude,
    timestamp: sampleTime,
    accuracy,
    rawKmh
  };

  return {
    rawKmh,
    derivedKmh,
    ignoredDerivedKmh: displayDecision === "HELD_AT_ZERO" ? derivedKmh : null,
    displayedKmh: state.targetSpeed,
    accuracyMetres: accuracy,
    elapsedSeconds,
    distanceMetres: movedMetres,
    speedSource: rawKmh !== null ? "NATIVE_GPS" : derivedKmh !== null ? "POSITION_DERIVED" : "NONE",
    displayDecision,
    displayReasons,
    previousAcceptedKmh,
    speedDecision: decision,
    reasons,
    driverUiActive: state.driverModeActive
  };
}

module.exports = {
  DEFAULTS,
  createSpeedState,
  haversineMetres,
  processSpeedSample
};
