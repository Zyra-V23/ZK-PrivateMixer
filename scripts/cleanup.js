// Script to safely remove obsolete circuit files
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the obsolete files to be removed
const obsoleteFiles = [
  '../circomlib/circuits/poseidon_old.circom',
  '../circomlib/circuits/poseidon_constants_old.circom',
  '../circomlib/circuits/pedersen_old.circom'
];

// Function to safely remove files
async function removeObsoleteFiles() {
  console.log('Removing obsolete circuit files...');
  
  for (const file of obsoleteFiles) {
    const filePath = path.join(__dirname, file);
    
    try {
      // Check if file exists
      if (fs.existsSync(filePath)) {
        // Create backup with .bak extension
        const backupPath = `${filePath}.bak`;
        fs.copyFileSync(filePath, backupPath);
        console.log(`✓ Created backup: ${path.basename(backupPath)}`);
        
        // Remove the original file
        fs.unlinkSync(filePath);
        console.log(`✓ Removed: ${path.basename(filePath)}`);
      } else {
        console.log(`⚠ File not found: ${path.basename(filePath)}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${path.basename(filePath)}: ${error.message}`);
    }
  }
  
  console.log('\nCleanup complete. If you need to restore any files, .bak backups have been created.');
}

// Execute the function
removeObsoleteFiles().catch(console.error); 