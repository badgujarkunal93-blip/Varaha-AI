const fs = require('fs');
const path = require('path');
const https = require('https');

// Load project data from step 15
const projFile = 'C:\\Users\\kunal badgujar\\.gemini\\antigravity-ide\\brain\\9b3e8a81-ef5b-4396-a43f-e293e8e4125a\\.system_generated\\steps\\15\\output.txt';
const data = JSON.parse(fs.readFileSync(projFile, 'utf8'));
const krishiProj = data.projects.find(p => p.title.includes('Krishi Vikas'));

console.log('Total screen instances:', krishiProj.screenInstances.length);
krishiProj.screenInstances.forEach(s => {
  console.log(s.id, s.sourceScreen, s.hidden ? '(hidden)' : '');
});
