#!/usr/bin/env node

/**
 * Cursor Pre-Presentation Check
 * 
 * This script runs linting and type checking before presenting code to ensure
 * code quality standards are met. It's designed to be run by Cursor before
 * presenting code to clients or teammates.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Paths to check for changes relative to the current file (file passed in by Cursor)
const fileToCheck = process.argv[2];

console.log(`${colors.blue}Cursor Pre-Presentation Check${colors.reset}`);
console.log(`${colors.cyan}Checking file: ${fileToCheck}${colors.reset}\n`);

try {
  // Run ESLint on the specific file
  console.log(`${colors.yellow}Running ESLint on ${path.basename(fileToCheck)}...${colors.reset}`);
  execSync(`npx eslint ${fileToCheck} --max-warnings=0`, { stdio: 'inherit' });
  
  // If the file is a TypeScript file, run TypeScript checking
  if (fileToCheck.endsWith('.ts') || fileToCheck.endsWith('.tsx')) {
    console.log(`${colors.yellow}Running TypeScript check...${colors.reset}`);
    execSync(`npx tsc --noEmit ${fileToCheck}`, { stdio: 'inherit' });
  }

  console.log(`\n${colors.green}✓ All checks passed! Your code meets the quality standards.${colors.reset}`);
  process.exit(0);
} catch (error) {
  console.error(`\n${colors.red}✗ Checks failed. Please fix the issues before presenting.${colors.reset}`);
  process.exit(1);
} 