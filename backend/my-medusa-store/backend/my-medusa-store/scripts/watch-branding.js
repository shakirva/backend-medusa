#!/usr/bin/env node
/**
 * Watch script to continuously apply marqasouq branding
 * This monitors .medusa/client/ and reapplies branding when Medusa regenerates files
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'admin', 'custom-client');
const destDir = path.join(__dirname, '..', '.medusa', 'client');
const filesToCopy = ['index.html'];

let lastApplied = 0;
const DEBOUNCE_MS = 500;

function applyBranding() {
  const now = Date.now();
  if (now - lastApplied < DEBOUNCE_MS) return;
  lastApplied = now;

  console.log('\x1b[35m[marqasouq]\x1b[0m Applying branding...');
  
  filesToCopy.forEach(file => {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);
    
    if (fs.existsSync(srcPath) && fs.existsSync(destDir)) {
      try {
        fs.copyFileSync(srcPath, destPath);
        console.log(`\x1b[32m  ✓\x1b[0m ${file}`);
      } catch (err) {
        console.error(`\x1b[31m  ✗\x1b[0m ${file}: ${err.message}`);
      }
    }
  });
}

function startWatching() {
  // Wait for .medusa/client to exist
  if (!fs.existsSync(destDir)) {
    console.log('\x1b[33m[marqasouq]\x1b[0m Waiting for .medusa/client to be created...');
    setTimeout(startWatching, 1000);
    return;
  }

  console.log('\x1b[35m[marqasouq]\x1b[0m Watching for changes in .medusa/client/');
  
  // Apply immediately
  applyBranding();
  
  // Watch for changes
  fs.watch(destDir, { persistent: true }, (eventType, filename) => {
    if (filename === 'index.html') {
      console.log(`\x1b[33m[marqasouq]\x1b[0m Detected change: ${filename}`);
      // Small delay to ensure Medusa has finished writing
      setTimeout(applyBranding, 100);
    }
  });
  
  // Also re-apply periodically as a safety net
  setInterval(applyBranding, 5000);
}

console.log('\x1b[35m═══════════════════════════════════════\x1b[0m');
console.log('\x1b[35m  marqasouq Branding Watcher Started\x1b[0m');
console.log('\x1b[35m═══════════════════════════════════════\x1b[0m');

startWatching();
