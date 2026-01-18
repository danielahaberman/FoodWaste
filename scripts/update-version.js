#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

const versionFile = 'version.json';
const packageFile = 'package.json';

try {
  console.log('📝 Updating version files...\n');
  
  // Read version.json
  const versionData = JSON.parse(readFileSync(versionFile, 'utf8'));
  const currentVersion = versionData.version;
  console.log(`   Current version: v${currentVersion}`);
  
  // Parse version (e.g., "1.2.3")
  const versionParts = currentVersion.split('.').map(Number);
  const [major, minor, patch] = versionParts;
  
  // Increment patch version
  const newVersion = `${major}.${minor}.${patch + 1}`;
  console.log(`   New version: v${newVersion}`);
  console.log(`   Incrementing patch: ${patch} → ${patch + 1}\n`);
  
  // Update version.json
  versionData.version = newVersion;
  writeFileSync(versionFile, JSON.stringify(versionData, null, 2) + '\n');
  console.log(`✅ Updated ${versionFile}: v${currentVersion} → v${newVersion}`);
  
  // Copy version.json to public/ for update detection
  const publicVersionFile = 'public/version.json';
  writeFileSync(publicVersionFile, JSON.stringify(versionData, null, 2) + '\n');
  console.log(`✅ Updated ${publicVersionFile}: v${currentVersion} → v${newVersion}`);
  
  // Update package.json version
  const packageData = JSON.parse(readFileSync(packageFile, 'utf8'));
  packageData.version = newVersion;
  writeFileSync(packageFile, JSON.stringify(packageData, null, 2) + '\n');
  console.log(`✅ Updated ${packageFile}: v${currentVersion} → v${newVersion}`);
  
  console.log(`\n📦 Version update complete: v${currentVersion} → v${newVersion}`);
  
} catch (error) {
  console.error('\n❌ Error updating version:', error.message);
  process.exit(1);
}
