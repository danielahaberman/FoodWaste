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
    console.log(`📍 Current branch: ${currentBranch}`);
  } catch (e) {
    console.error('❌ Failed to detect current branch');
    process.exit(1);
  }
  
  // Step 1: Update version only if on main branch
  let newVersion;
  if (currentBranch === 'main' || currentBranch === 'master') {
    console.log('📝 Step 1: Updating version (main branch detected)...');
    execSync('npm run update-version', { stdio: 'inherit' });
    
    // Get the new version for commit message
    const versionData = JSON.parse(readFileSync(versionFile, 'utf8'));
    newVersion = versionData.version;
  } else {
    console.log(`⚠️  Step 1: Skipping version update (not on main branch, current: ${currentBranch})`);
    // Get current version without incrementing
    const versionData = JSON.parse(readFileSync(versionFile, 'utf8'));
    newVersion = versionData.version;
  }
  
  // Step 3: Stage all files (including version updates)
  console.log('\n📦 Step 2: Staging all files...');
  execSync('git add .', { stdio: 'inherit' });
  console.log('✅ All files staged');
  
  // Step 4: Check if there are changes to commit
  let hasChanges = false;
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    hasChanges = status.trim().length > 0;
  } catch (e) {
    // If status check fails, assume there are changes
    hasChanges = true;
  }
  
  if (hasChanges) {
    // Step 5: Commit with appropriate message
    if (currentBranch === 'main' || currentBranch === 'master') {
      console.log(`\n💾 Step 3: Committing changes (v${newVersion})...`);
      execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' });
    } else {
      console.log(`\n💾 Step 3: Committing changes...`);
      execSync('git commit -m "chore: update code"', { stdio: 'inherit' });
    }
    console.log('✅ Changes committed');
  } else {
    console.log('\n⚠️  No changes to commit');
  }
  
  // Step 6: Push to remote
  console.log(`\n🚀 Step 4: Pushing to remote...`);
  execSync('git push', { stdio: 'inherit' });
  console.log('✅ Pushed to remote');
  
  if (currentBranch === 'main' || currentBranch === 'master') {
    console.log(`\n🎉 Successfully pushed version ${newVersion} to main!`);
    console.log('📱 App will auto-publish');
  } else {
    console.log(`\n🎉 Successfully pushed to ${currentBranch}!`);
  }
  
} catch (error) {
  console.error('\n❌ Error in git push workflow:', error.message);
  
  // Check if it's a git error
  if (error.message.includes('git')) {
    console.error('\n💡 Tip: Make sure you have changes to commit and are on the correct branch');
  }
  
  process.exit(1);
}

