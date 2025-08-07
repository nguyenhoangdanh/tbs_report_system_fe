const fs = require('fs');
const path = require('path');

function copyFileIfExists(src, dest) {
  try {
    if (fs.existsSync(src)) {
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(src, dest);
      console.log(`✅ Copied: ${src} -> ${dest}`);
      return true;
    }
  } catch (error) {
    console.warn(`⚠️  Failed to copy ${src}: ${error.message}`);
  }
  return false;
}

function copyDirIfExists(src, dest) {
  try {
    if (fs.existsSync(src)) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      fs.cpSync(src, dest, { recursive: true });
      console.log(`✅ Copied directory: ${src} -> ${dest}`);
      return true;
    }
  } catch (error) {
    console.warn(`⚠️  Failed to copy directory ${src}: ${error.message}`);
  }
  return false;
}

// Create public directory if it doesn't exist
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

// Try different possible paths for PDF.js worker files
const workerPaths = [
  'node_modules/pdfjs-dist/build/pdf.worker.min.js',
  'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js',
  'node_modules/pdfjs-dist/pdf.worker.min.js'
];

const mjsWorkerPaths = [
  'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
  'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  'node_modules/pdfjs-dist/pdf.worker.min.mjs'
];

// Copy worker files
let workerCopied = false;
for (const workerPath of workerPaths) {
  if (copyFileIfExists(workerPath, 'public/pdf.worker.min.js')) {
    workerCopied = true;
    break;
  }
}

let mjsWorkerCopied = false;
for (const mjsWorkerPath of mjsWorkerPaths) {
  if (copyFileIfExists(mjsWorkerPath, 'public/pdf.worker.min.mjs')) {
    mjsWorkerCopied = true;
    break;
  }
}

// Copy cmaps and standard_fonts
copyDirIfExists('node_modules/pdfjs-dist/cmaps', 'public/cmaps');
copyDirIfExists('node_modules/pdfjs-dist/standard_fonts', 'public/standard_fonts');

if (!workerCopied && !mjsWorkerCopied) {
  console.warn('⚠️  No PDF.js worker files found. PDF functionality may not work.');
}

console.log('📦 PDF.js assets setup completed');
