#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const versionFile = 'version.json';

try {
  console.log('🚀 Starting git push workflow...\n');
  
  // Check current branch
  let currentBranch;
  try {
    currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    console.log(`📍 Current branch: ${currentBranch}\n`);
  } catch (e) {
    console.error('❌ Failed to detect current branch');
    process.exit(1);
  }
  
  // Get current version before update
  let currentVersion;
  try {
    const versionDataBefore = JSON.parse(readFileSync(versionFile, 'utf8'));
    currentVersion = versionDataBefore.version;
    console.log(`📋 Current version: v${currentVersion}`);
  } catch (e) {
    console.error('❌ Failed to read current version');
    process.exit(1);
  }
  
  // Step 1: Update version only if on main branch
  let newVersion;
  if (currentBranch === 'main' || currentBranch === 'master') {
    console.log(`\n📝 Step 1: Updating version (main branch detected)...`);
    console.log(`   Incrementing from v${currentVersion}...`);
    execSync('npm run update-version', { stdio: 'inherit' });
    
    // Get the new version for commit message
    const versionData = JSON.parse(readFileSync(versionFile, 'utf8'));
    newVersion = versionData.version;
    console.log(`\n✅ Version updated: v${currentVersion} → v${newVersion}`);
  } else {
    console.log(`\n⚠️  Step 1: Skipping version update (not on main branch)`);
    console.log(`   Current branch: ${currentBranch}`);
    console.log(`   Version will remain: v${currentVersion}`);
    // Get current version without incrementing
    const versionData = JSON.parse(readFileSync(versionFile, 'utf8'));
    newVersion = versionData.version;
  }
  
  // Step 3: Stage all files (including version updates)
  console.log(`\n📦 Step 2: Staging all files...`);
  execSync('git add .', { stdio: 'inherit' });
  console.log('✅ All files staged');
  
  // Step 4: Check if there are changes to commit
  let hasChanges = false;
  let changedFiles = [];
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    hasChanges = status.trim().length > 0;
    if (hasChanges) {
      changedFiles = status.trim().split('\n').map(line => line.trim());
      console.log(`   ${changedFiles.length} file(s) to commit`);
    }
  } catch (e) {
    // If status check fails, assume there are changes
    hasChanges = true;
  }
  
  if (hasChanges) {
    // Step 5: Commit with appropriate message
    if (currentBranch === 'main' || currentBranch === 'master') {
      console.log(`\n💾 Step 3: Committing changes...`);
      console.log(`   Commit message: "chore: bump version to ${newVersion}"`);
      execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' });
      console.log(`✅ Committed version bump: v${currentVersion} → v${newVersion}`);
    } else {
      console.log(`\n💾 Step 3: Committing changes...`);
      console.log(`   Commit message: "chore: update code"`);
      execSync('git commit -m "chore: update code"', { stdio: 'inherit' });
      console.log('✅ Changes committed');
    }
  } else {
    console.log('\n⚠️  No changes to commit');
  }
  
  // Step 6: Push to remote
  console.log(`\n🚀 Step 4: Pushing to remote...`);
  console.log(`   Branch: ${currentBranch}`);
  execSync('git push', { stdio: 'inherit' });
  console.log('✅ Pushed to remote');
  
  if (currentBranch === 'main' || currentBranch === 'master') {
    console.log(`\n🎉 Successfully pushed version ${newVersion} to main!`);
    console.log(`   Previous version: v${currentVersion}`);
    console.log(`   New version: v${newVersion}`);
    console.log('📱 App will auto-publish on main branch');
  } else {
    console.log(`\n🎉 Successfully pushed to ${currentBranch}!`);
    console.log(`   Version: v${newVersion} (unchanged)`);
  }
  
} catch (error) {
  console.error('\n❌ Error in git push workflow:', error.message);
  
  // Check if it's a git error
  if (error.message.includes('git')) {
    console.error('\n💡 Tip: Make sure you have changes to commit and are on the correct branch');
  }
  
  process.exit(1);
}

