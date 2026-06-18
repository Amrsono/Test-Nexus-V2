const fs = require('fs');
const path = require('path');

const slide2Path = path.join(__dirname, '..', 'temp_pptx', 'ppt', 'slides', 'slide2.xml');
const content = fs.readFileSync(slide2Path, 'utf8');

// A simple regex to find <a:p>...</a:p> blocks and extract all <a:t> text inside them
const pRegex = /<a:p>([\s\S]*?)<\/a:p>/g;
let pMatch;
let pIndex = 0;

while ((pMatch = pRegex.exec(content)) !== null) {
  const pContent = pMatch[1];
  const tRegex = /<a:t>([^<]*)<\/a:t>/g;
  let tMatch;
  let texts = [];
  while ((tMatch = tRegex.exec(pContent)) !== null) {
    texts.push(tMatch[1]);
  }
  if (texts.length > 0) {
    console.log(`Paragraph ${pIndex++}: ${texts.join(' | ')}`);
  }
}
