'use strict';

function injectSpeedBrainRuntime(html, brainSource) {
  const marker = '(() => {';
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error('Speed Brain runtime injection failed: app IIFE marker not found');
  }

  const scriptStart = html.lastIndexOf('<script', markerIndex);
  const previousScriptEnd = html.lastIndexOf('</script>', markerIndex);
  const openingTagEnd = scriptStart === -1 ? -1 : html.indexOf('>', scriptStart);
  const scriptEnd = html.indexOf('</script>', markerIndex);
  const markerStartsScript = openingTagEnd !== -1 && html.slice(openingTagEnd + 1, markerIndex).trim() === '';
  if (scriptStart === -1 || previousScriptEnd > scriptStart || !markerStartsScript || scriptEnd === -1) {
    throw new Error('Speed Brain runtime injection failed: enclosing app script not found');
  }

  const runtime = `<script id="frenano-speed-brain-v1">
(() => {
  'use strict';
  const module = { exports: {} };
  const exports = module.exports;
${brainSource}
  const api = module.exports;
  window.FrenanoSpeedBrain = Object.freeze({
    version: api.SPEED_BRAIN_VERSION,
    createSpeedBrain: api.createSpeedBrain
  });
})();
</script>
`;
  return html.slice(0, scriptStart) + runtime + html.slice(scriptStart);
}

module.exports = { injectSpeedBrainRuntime };
