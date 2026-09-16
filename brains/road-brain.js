'use strict';

const ROAD_BRAIN_VERSION = '1.0.0';
const TECHNICAL_ROAD_NAMES = new Set([
  '', 'service_other', 'service other', 'service', 'other', 'unknown',
  'primary', 'secondary', 'tertiary', 'residential', 'track', 'path'
]);

function sanitiseRoadName(raw) {
  let road = String(raw == null ? '' : raw).trim().replace(/_/g, ' ');
  if (TECHNICAL_ROAD_NAMES.has(road.toLowerCase())) return '';
  const parts = road.split(',').map(part => part.trim()).filter(Boolean);
  if (parts.length > 1 && /^\d/.test(parts[parts.length - 1])) parts.pop();
  road = parts.join(', ');
  return TECHNICAL_ROAD_NAMES.has(road.toLowerCase()) ? '' : road;
}

function clonePosition(position) {
  if (!position || !Number.isFinite(Number(position.latitude)) || !Number.isFinite(Number(position.longitude))) return null;
  return { latitude: Number(position.latitude), longitude: Number(position.longitude) };
}

function distanceMetres(a, b) {
  const aa = clonePosition(a);
  const bb = clonePosition(b);
  if (!aa || !bb) return Infinity;
  const toRad = degrees => degrees * Math.PI / 180;
  const earthRadiusMetres = 6371000;
  const dLat = toRad(bb.latitude - aa.latitude);
  const dLon = toRad(bb.longitude - aa.longitude);
  const lat1 = toRad(aa.latitude);
  const lat2 = toRad(bb.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusMetres * Math.asin(Math.min(1, Math.sqrt(h)));
}

function createRoadBrain() {
  const state = {
    candidateLimits: [],
    candidateKeys: [],
    acceptedLimit: null,
    acceptedRoad: '',
    acceptedPosition: null
  };

  function acceptedSnapshot() {
    if (!Number.isFinite(state.acceptedLimit) || state.acceptedLimit <= 0) return null;
    return {
      limit: state.acceptedLimit,
      road: state.acceptedRoad,
      position: clonePosition(state.acceptedPosition)
    };
  }

  function result(outcome, candidate, checks, roadEvidenceConfirmed) {
    const accepted = acceptedSnapshot();
    const display = outcome === 'CONFIRMED' || outcome === 'BEST_ESTIMATE'
      ? candidate
      : accepted;
    return {
      outcome,
      candidate,
      accepted,
      display,
      confidenceChecks: checks,
      roadEvidenceConfirmed: roadEvidenceConfirmed === true
    };
  }

  function process(observation = {}) {
    const numericLimit = Number(observation.limit);
    const roundedLimit = Number.isFinite(numericLimit) ? Math.round(numericLimit) : NaN;
    const road = sanitiseRoadName(observation.roadName);
    const candidate = Number.isFinite(roundedLimit) && roundedLimit > 0
      ? { limit: roundedLimit, road }
      : null;
    const accuracy = Number(observation.accuracyMetres);
    const speed = Number(observation.speedKmh);
    const stationary = !Number.isFinite(speed) || speed < 3;
    const requiredMatches = stationary ? 3 : 2;
    const invalidRoadClass = String(observation.roadClass || '').toLowerCase() === 'service_other';
    const implausibleRoadLimit = String(observation.roadClass || '').toLowerCase() === 'residential' && roundedLimit > 70;
    const validRoadName = road.length > 0;
    const qualityGood = Number.isFinite(accuracy) && accuracy <= 30 && validRoadName && !invalidRoadClass && observation.matchType !== 'unmatched' && !implausibleRoadLimit;

    if (!candidate) {
      return result('NO_LIMIT', null, {
        qualityGood: false,
        repeatedMatch: false,
        requiredMatches,
        stationary,
        invalidRoadClass,
        implausibleRoadLimit,
        validRoadName
      }, false);
    }

    const key = `${roundedLimit}|${road}`;
    state.candidateLimits.push(roundedLimit);
    state.candidateKeys.push(key);
    state.candidateLimits = state.candidateLimits.slice(-3);
    state.candidateKeys = state.candidateKeys.slice(-3);

    const recent = state.candidateKeys.slice(-requiredMatches);
    const repeatedMatch = recent.length === requiredMatches && recent.every(item => item === key);
    const matchesAccepted = state.acceptedLimit === roundedLimit && state.acceptedRoad === road && validRoadName;
    const confirmed = qualityGood && (repeatedMatch || matchesAccepted);
    const checks = {
      qualityGood,
      repeatedMatch,
      requiredMatches,
      stationary,
      invalidRoadClass,
      implausibleRoadLimit,
      validRoadName
    };

    if (confirmed) {
      state.acceptedLimit = roundedLimit;
      state.acceptedRoad = road;
      state.acceptedPosition = clonePosition(observation.position);
      return result('CONFIRMED', candidate, checks, true);
    }

    if (!validRoadName && acceptedSnapshot()) {
      return result('RETAINED_UNCONFIRMED', candidate, checks, false);
    }

    return result('BEST_ESTIMATE', candidate, checks, false);
  }

  function reset() {
    state.candidateLimits = [];
    state.candidateKeys = [];
    state.acceptedLimit = null;
    state.acceptedRoad = '';
    state.acceptedPosition = null;
  }

  function getState() {
    return {
      candidateLimits: state.candidateLimits.slice(),
      candidateKeys: state.candidateKeys.slice(),
      acceptedLimit: state.acceptedLimit,
      acceptedRoad: state.acceptedRoad,
      acceptedPosition: clonePosition(state.acceptedPosition)
    };
  }

  function freshnessForPosition(position) {
    if (!state.acceptedPosition) return { fresh: false, distanceMetres: Infinity };
    const distance = distanceMetres(state.acceptedPosition, position);
    return { fresh: Number.isFinite(distance) && distance < 60, distanceMetres: distance };
  }

  return { process, reset, getState, freshnessForPosition };
}

module.exports = { ROAD_BRAIN_VERSION, createRoadBrain, sanitiseRoadName };
