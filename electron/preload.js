const { contextBridge } = require('electron');

// Keep preload lightweight; no Node modules to avoid sandbox issues
console.log('[Preload] Loaded');

// Expose a minimal API surface if needed in future
contextBridge.exposeInMainWorld('bridge', { ready: true });
