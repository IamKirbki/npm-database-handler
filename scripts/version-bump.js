#!/usr/bin/env node
/* eslint-disable no-undef */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const newVersion = process.argv[2];

if (!newVersion) {
  console.error('❌ Error: Please provide a version number');
  console.log('Usage: npm run version <version>');
  console.log('Example: npm run version 1.2.3');
  process.exit(1);
}

// Validate semver format (basic check)
const semverRegex = /^\d+\.\d+\.\d+(-[\w.]+)?$/;
if (!semverRegex.test(newVersion)) {
  console.error(`❌ Error: Invalid version format "${newVersion}"`);
  console.log('Version must follow semver format: X.Y.Z or X.Y.Z-prerelease');
  process.exit(1);
}

const rootDir = resolve(__dirname, '..');

// Package paths relative to root
const packagePaths = [
  'packages/core/package.json',
  'packages/bettersqlite3/package.json',
  'packages/pg/package.json',
];

// Core package name for dependency updates
const corePackageName = '@iamkirbki/database-handler-core';

console.log(`\n📦 Updating all packages to version ${newVersion}...\n`);

// Update each package
packagePaths.forEach((pkgPath) => {
  const fullPath = resolve(rootDir, pkgPath);

  try {
    const content = readFileSync(fullPath, 'utf8');
    const pkg = JSON.parse(content);

    // Update package version
    const oldVersion = pkg.version;
    pkg.version = newVersion;

    // Update core dependency version if it exists
    if (pkg.dependencies && pkg.dependencies[corePackageName]) {
      // Keep the version range prefix (^, ~, etc.) if it exists
      const currentDep = pkg.dependencies[corePackageName];
      const prefix = currentDep.match(/^[\^~]/) ? currentDep[0] : '^';

      // Don't update if it's a file: reference
      if (!currentDep.startsWith('file:')) {
        pkg.dependencies[corePackageName] = `${prefix}${newVersion}`;
      }
    }

    // Write back with proper formatting
    writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

    console.log(`✅ ${pkg.name}: ${oldVersion} → ${newVersion}`);
  } catch (error) {
    console.error(`❌ Error updating ${pkgPath}:`, error.message);
    process.exit(1);
  }
});

console.log('\n✨ All packages updated successfully!\n');
console.log('Next steps:');
console.log('  1. Review the changes: git diff');
console.log(
  '  2. Commit: git add . && git commit -m "chore: bump version to ' +
    newVersion +
    '"',
);
console.log('  3. Tag: git tag v' + newVersion);
console.log('  4. Build: npm run build');
console.log('  5. Publish: npm publish --workspaces\n');
