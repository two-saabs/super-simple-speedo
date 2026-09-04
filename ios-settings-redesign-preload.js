const fs = require('fs');
const path = require('path');
const { applySettingsRedesign } = require('./settings-redesign');

const originalWriteFileSync = fs.writeFileSync.bind(fs);
fs.writeFileSync = function patchedWriteFileSync(file, data, options) {
  try {
    const target = String(file);
    if (target.endsWith(path.join('dist', 'index.html')) && typeof data === 'string' && data.includes('id="settingsModal"') && !data.includes('settings-redesign-v1')) {
      data = applySettingsRedesign(data);
    }
  } catch (error) {
    console.error('iOS settings redesign injection failed:', error);
    throw error;
  }
  return originalWriteFileSync(file, data, options);
};
