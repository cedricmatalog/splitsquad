/**
 * Script to update UI component imports after restructuring
 * 
 * Run with: node scripts/update-ui-imports.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Map of components to their new directories
const componentMapping = {
  // Feedback components
  'spinner': 'feedback',
  'loading-state': 'feedback',
  'toast': 'feedback',
  'toaster': 'feedback',
  'use-toast': 'feedback',

  // Form components
  'button': 'forms',
  'input': 'forms',
  'label': 'forms',
  'select': 'forms',
  'date-picker': 'forms',
  'form': 'forms',

  // Layout components
  'card': 'layout',
  'tabs': 'layout',

  // Overlay components
  'dialog': 'overlay',
  'dropdown-menu': 'overlay',

  // Display components
  'avatar': 'display',
  'badge': 'display',
  'table': 'display',
};

// Helper function to normalize path separators for cross-platform compatibility
function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

// Helper function to update imports in a file
function updateImportsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const normalizedPath = normalizePath(filePath);
    
    // Skip files in the ui component directories
    if (normalizedPath.includes('/components/ui/') && 
       (normalizedPath.includes('/feedback/') || 
        normalizedPath.includes('/forms/') || 
        normalizedPath.includes('/layout/') || 
        normalizedPath.includes('/overlay/') || 
        normalizedPath.includes('/display/'))) {
      return;
    }

    let updatedContent = content;
    
    // Update direct component imports
    for (const [component, directory] of Object.entries(componentMapping)) {
      const importRegex = new RegExp(`from\\s+['"]@/components/ui/${component}['"]`, 'g');
      updatedContent = updatedContent.replace(importRegex, `from '@/components/ui'`);
    }

    // Write the file only if changes were made
    if (updatedContent !== content) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`Updated imports in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

// Find TypeScript and TSX files in the src directory
function findTsFiles() {
  try {
    // For Windows compatibility, use a different approach
    const srcPath = path.resolve(__dirname, '../src');
    const files = [];
    
    function walkDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          files.push(fullPath);
        }
      }
    }
    
    walkDir(srcPath);
    return files;
  } catch (error) {
    console.error('Error finding TypeScript files:', error);
    return [];
  }
}

// Main function
function main() {
  console.log('Updating UI component imports...');
  
  const tsFiles = findTsFiles();
  console.log(`Found ${tsFiles.length} TypeScript files to process`);
  
  tsFiles.forEach(file => {
    updateImportsInFile(file);
  });
  
  console.log('Import update completed!');
}

main(); 