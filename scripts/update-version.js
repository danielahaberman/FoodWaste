#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

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
  
  // Update package.json version
  const packageData = JSON.parse(readFileSync(packageFile, 'utf8'));
  packageData.version = newVersion;
  writeFileSync(packageFile, JSON.stringify(packageData, null, 2) + '\n');
  console.log(`✅ Updated package.json version to ${newVersion}`);
  
  // Stage all files (git add .)
  execSync('git add .', { stdio: 'inherit' });
  console.log('✅ Staged all files');
  
  console.log(`\n📦 Version ${newVersion} ready to commit!`);
  
} catch (error) {
  console.error('❌ Error updating version:', error.message);
  process.exit(1);
}
