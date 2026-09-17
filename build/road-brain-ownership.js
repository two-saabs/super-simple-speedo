'use strict';

function replaceOnce(source, before, after, label) {
  if (!source.includes(before)) throw new Error(`Road Brain ownership transform: missing ${label}`);
  return source.replace(before, after);
}

function applyRoadBrainOwnership(source) {
  source = replaceOnce(
    source,
    '  const speedBrain = window.FrenanoSpeedBrain.createSpeedBrain({ profile: "frenano-app-v1" });',
    '  const speedBrain = window.FrenanoSpeedBrain.createSpeedBrain({ profile: "frenano-app-v1" });\n  const roadBrain = window.FrenanoRoadBrain.createRoadBrain();',
    'brain construction anchor'
  );

  const confirmationStart = '  function candidateConfirmation({ limit, road, accuracyMetres, roadClass, matchType, speedKmh }) {';
  const lookupStart = '  async function lookupSpeedLimit(currentCoords) {';
  const startIndex = source.indexOf(confirmationStart);
  const lookupIndex = source.indexOf(lookupStart, startIndex);
  if (startIndex < 0 || lookupIndex < 0) throw new Error('Road Brain ownership transform: legacy confirmation block not found');
  source = source.slice(0, startIndex) + source.slice(lookupIndex);

  const oldDecisionBlock = `      const previousConfirmedLimit = state.acceptedAutoLimit;
      const previousConfirmedRoad = state.acceptedAutoRoad || null;
      let roadOutcome = "NO_LIMIT";

      let confirmation = null;
      if (Number.isFinite(value) && value > 0) {
        const roundedLimit = Math.round(value);
        confirmation = candidateConfirmation({
          limit: roundedLimit,
          road: roadName,
          accuracyMetres: Number(currentCoords.accuracy),
          roadClass: step?.road_class || null,
          matchType: latest?.match_type || (step ? "matched" : "unmatched"),
          speedKmh: state.targetSpeed
        });

        if (confirmation.confirmed) {
          roadOutcome = "CONFIRMED";
          const previous = state.acceptedAutoLimit;
          state.acceptedAutoLimit = roundedLimit;
          state.acceptedAutoRoad = displayRoadName(roadName);
          setLimit(roundedLimit, "Automatic limit from:", state.acceptedAutoRoad, {
            chime: previous !== null && previous !== roundedLimit,
            previous
          });
          setAutomaticStatus("matched", state.acceptedAutoRoad);
        } else if (!confirmation.validRoadName && state.acceptedAutoLimit !== null) {
          roadOutcome = "RETAINED_UNCONFIRMED";
          setLimit(state.acceptedAutoLimit, "Automatic limit from:", state.acceptedAutoRoad || "Last matched road");
          setAutomaticStatus("confirming", state.acceptedAutoRoad || "Last matched road");
        } else {
          roadOutcome = "BEST_ESTIMATE";
          setLimit(roundedLimit, "Automatic limit from:", roadName || "Road match pending");
          setAutomaticStatus("confirming", roadName || "Road match pending");
        }
      } else {
        setAutomaticStatus("nodata", roadName ? "No mapped speed limit" : "No road identified");
      }`;

  const newDecisionBlock = `      const previousAccepted = roadBrain.getState().accepted;
      const previousConfirmedLimit = previousAccepted?.limit ?? null;
      const previousConfirmedRoad = previousAccepted?.road ? displayRoadName(previousAccepted.road) : null;
      const roadDecision = roadBrain.process({
        limit: Number.isFinite(value) ? value : null,
        roadName,
        accuracyMetres: Number(currentCoords.accuracy),
        roadClass: step?.road_class || null,
        matchType: latest?.match_type || (step ? "matched" : "unmatched"),
        speedKmh: state.targetSpeed,
        position: { latitude: currentCoords.latitude, longitude: currentCoords.longitude }
      });
      const roadOutcome = roadDecision.outcome;
      const confirmation = roadDecision.confidenceChecks;
      const acceptedRoadState = roadBrain.getState().accepted;
      const acceptedLimit = acceptedRoadState?.limit ?? null;
      const acceptedRoad = acceptedRoadState?.road ? displayRoadName(acceptedRoadState.road) : null;

      if (roadOutcome === "CONFIRMED" && acceptedLimit !== null) {
        setLimit(acceptedLimit, "Automatic limit from:", acceptedRoad, {
          chime: previousConfirmedLimit !== null && previousConfirmedLimit !== acceptedLimit,
          previous: previousConfirmedLimit
        });
        setAutomaticStatus("matched", acceptedRoad);
      } else if (roadOutcome === "RETAINED_UNCONFIRMED" && acceptedLimit !== null) {
        setLimit(acceptedLimit, "Automatic limit from:", acceptedRoad || "Last matched road");
        setAutomaticStatus("confirming", acceptedRoad || "Last matched road");
      } else if (roadOutcome === "BEST_ESTIMATE" && roadDecision.display) {
        setLimit(roadDecision.display.limit, "Automatic limit from:", roadDecision.display.road || "Road match pending");
        setAutomaticStatus("confirming", roadDecision.display.road || "Road match pending");
      } else {
        setAutomaticStatus("nodata", roadName ? "No mapped speed limit" : "No road identified");
      }`;

  source = replaceOnce(source, oldDecisionBlock, newDecisionBlock, 'lookup decision block');

  source = source.replace(
    '          candidateHistory: [...state.autoCandidates],',
    '          candidateHistory: roadBrain.getState().candidateLimits,'
  );
  source = source.replace(
    '          validRoadName: Boolean(roadName),',
    '          validRoadName: confirmation?.validRoadName ?? Boolean(roadName),'
  );

  // Transport consumes canonical Road Brain evidence rather than reconstructing
  // confirmation from UI/app state. This keeps classifier behaviour unchanged
  // while making Road Brain the single owner of accepted-road truth.
  source = replaceOnce(
    source,
    '      roadConfirmed: state.roadMatchStage === "matched" && Boolean(state.acceptedAutoRoad)',
    '      roadConfirmed: Boolean(roadBrain.getState().accepted)',
    'Transport confirmed-road evidence'
  );

  // Legacy arrays are no longer decision owners. Remove their mutations/resets so
  // generated web/iOS code has exactly one candidate-history state machine.
  source = source.replaceAll('    state.autoCandidates = [];\n    state.autoMatchCandidates = [];\n', '    roadBrain.reset();\n');
  return source;
}

module.exports = { applyRoadBrainOwnership };
