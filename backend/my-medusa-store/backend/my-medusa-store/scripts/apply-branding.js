/**
 * Post-build script to copy custom admin client files
 * This ensures marqasouq branding persists after Medusa rebuilds
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'admin', 'custom-client');
const destDir = path.join(__dirname, '..', '.medusa', 'client');

const filesToCopy = ['index.html', 'index.css'];

console.log('📦 Applying marqasouq branding to admin...');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log(`  📂 Created directory: ${destDir}`);
}

filesToCopy.forEach(file => {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(destDir, file);

  if (fs.existsSync(srcPath)) {
    try {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✅ Copied ${file}`);
    } catch (err) {
      console.error(`  ❌ Failed to copy ${file}:`, err.message);
    }
  } else {
    console.log(`  ⚠️  Source file not found: ${file}`);
  }
});

console.log('✨ marqasouq branding applied!\n');

// Also copy the built admin to public/ so it is served correctly
const adminSrc = path.join(__dirname, '..', '.medusa', 'server', 'public', 'admin');
const adminDest = path.join(__dirname, '..', 'public', 'admin');
if (fs.existsSync(adminSrc)) {
  try {
    fs.rmSync(adminDest, { recursive: true, force: true });
    fs.cpSync(adminSrc, adminDest, { recursive: true });
    console.log('📋 Copied admin build to public/admin');
  } catch (err) {
    console.error('Failed to copy admin build:', err.message);
  }
} else {
  console.log('No admin build found at .medusa/server/public/admin');
}
