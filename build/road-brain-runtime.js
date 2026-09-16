'use strict';

function injectRoadBrainRuntime(html, brainSource) {
  const marker = '(() => {';
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error('Road Brain runtime injection failed: app IIFE marker not found');
  }

  const scriptStart = html.lastIndexOf('<script', markerIndex);
  const previousScriptEnd = html.lastIndexOf('</script>', markerIndex);
  const openingTagEnd = scriptStart === -1 ? -1 : html.indexOf('>', scriptStart);
  const scriptEnd = html.indexOf('</script>', markerIndex);
  const markerStartsScript = openingTagEnd !== -1 && html.slice(openingTagEnd + 1, markerIndex).trim() === '';
  if (scriptStart === -1 || previousScriptEnd > scriptStart || !markerStartsScript || scriptEnd === -1) {
    throw new Error('Road Brain runtime injection failed: enclosing app script not found');
  }

  const runtime = `<script id="frenano-road-brain-v1">
(() => {
  'use strict';
  const module = { exports: {} };
  const exports = module.exports;
${brainSource}
  const api = module.exports;
  window.FrenanoRoadBrain = Object.freeze({
    version: api.ROAD_BRAIN_VERSION,
    createRoadBrain: api.createRoadBrain,
    sanitiseRoadName: api.sanitiseRoadName
  });
})();
</script>
`;
  return html.slice(0, scriptStart) + runtime + html.slice(scriptStart);
}

module.exports = { injectRoadBrainRuntime };
