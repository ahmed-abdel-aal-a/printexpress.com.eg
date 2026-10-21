const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const outDir = path.join(__dirname, 'out');
const oldName = '_next';
const newName = 'assets';
const oldPath = path.join(outDir, oldName);
const newPath = path.join(outDir, newName);

console.log('\n🚀 Starting cPanel optimizations...');

if (!fs.existsSync(outDir)) {
  console.error('❌ Error: "out" directory not found. Please run "npm run build" first.');
  process.exit(1);
}

if (fs.existsSync(oldPath)) {
  console.log(`📁 Renaming ${oldName} to ${newName}...`);
  fs.renameSync(oldPath, newPath);
} else if (!fs.existsSync(newPath)) {
  console.warn(`⚠️ Warning: Neither ${oldName} nor ${newName} found in "out" directory.`);
}

console.log(`🔍 Updating file references from /${oldName}/ to /${newName}/...`);
let modifiedFilesCount = 0;

function replaceInFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInFiles(fullPath);
    } else {
      const ext = path.extname(fullPath);
      if (['.html', '.js', '.css', '.json', '.txt', '.map'].includes(ext)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        const originalContent = content;
        
        // Use split/join for foolproof global replacement
        content = content.split(`/${oldName}/`).join(`/${newName}/`);
        content = content.split(`\\/${oldName}\\/`).join(`\\/${newName}\\/`);
        
        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content, 'utf8');
          modifiedFilesCount++;
        }
      }
    }
  }
}

replaceInFiles(outDir);
console.log(`✅ Successfully updated ${modifiedFilesCount} files.`);

const archiveName = 'storefront-cpanel-ready.tar.gz';
console.log(`📦 Creating ${archiveName} archive for cPanel...`);
try {
  execSync(`tar -czf "${archiveName}" -C out .`, { stdio: 'inherit' });
  console.log(`\n🎉 All done! You can now upload '${archiveName}' directly to your cPanel hosting.\n`);
} catch (error) {
  console.error('❌ Error creating tar archive:', error.message);
  console.log('You may need to manually compress the "out" folder.');
}
