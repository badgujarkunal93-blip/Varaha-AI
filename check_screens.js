const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('stitch_screens');
files.forEach(f => {
  const content = fs.readFileSync(path.join('stitch_screens', f), 'utf8');
  const titleMatch = content.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1] : 'Unknown';
  console.log(`${f} -> Title: "${title}", Size: ${content.length} chars`);
});
