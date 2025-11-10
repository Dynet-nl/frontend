const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');
const indexPath = path.join(buildDir, 'index.html');
const marker = '<!-- BUILD_VERSION_PLACEHOLDER -->';

if (!fs.existsSync(indexPath)) {
  console.warn('injectVersion: build/index.html not found. Has the build completed?');
  process.exit(0);
}

const version = new Date().toISOString();
const stampText = `Build version: ${version}`;

let html = fs.readFileSync(indexPath, 'utf8');

if (html.includes(marker)) {
  html = html.replace(marker, `<!-- ${stampText} -->`);
} else if (html.includes('</body>')) {
  html = html.replace('</body>', `  <!-- ${stampText} -->\n</body>`);
} else {
  html += `\n<!-- ${stampText} -->\n`;
}

fs.writeFileSync(indexPath, html, 'utf8');

const versionFilePath = path.join(buildDir, 'build-version.txt');
fs.writeFileSync(versionFilePath, `${stampText}\n`, 'utf8');

console.log(`injectVersion: ${stampText}`);
