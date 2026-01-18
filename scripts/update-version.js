#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

const versionFile = 'version.json';
const packageFile = 'package.json';

try {
  // Read version.json
  const versionData = JSON.parse(readFileSync(versionFile, 'utf8'));
  const currentVersion = versionData.version;
  
  // Parse version (e.g., "1.2.3")
  const versionParts = currentVersion.split('.').map(Number);
  const [major, minor, patch] = versionParts;
  
  // Increment patch version
  const newVersion = `${major}.${minor}.${patch + 1}`;
  
  // Update version.json
  versionData.version = newVersion;
  writeFileSync(versionFile, JSON.stringify(versionData, null, 2) + '\n');
  console.log(`✅ Updated version: ${currentVersion} → ${newVersion}`);
  
  // Copy version.json to public/ for update detection
  const publicVersionFile = 'public/version.json';
  writeFileSync(publicVersionFile, JSON.stringify(versionData, null, 2) + '\n');
  console.log(`✅ Copied version.json to public/`);
  
  // Update package.json version
  const packageData = JSON.parse(readFileSync(packageFile, 'utf8'));
  packageData.version = newVersion;
  writeFileSync(packageFile, JSON.stringify(packageData, null, 2) + '\n');
  console.log(`✅ Updated package.json version to ${newVersion}`);
  
  console.log(`\n📦 Version ${newVersion} updated successfully!`);
  
} catch (error) {
  console.error('❌ Error updating version:', error.message);
  process.exit(1);
}
