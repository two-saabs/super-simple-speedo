'use strict';

// Compatibility hook: the template owns the adapter; builds leave it unchanged.
function applyRoadBrainOwnership(source) {
  return source;
}

module.exports = { applyRoadBrainOwnership };
